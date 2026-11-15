import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium, webkit } from '@playwright/test'

const [baseUrl, output, ...routes] = process.argv.slice(2)
if (!baseUrl || !output || routes.length === 0) {
  console.error(
    'Usage: node scripts/audit-ui-responsive.mjs <local URL> <output directory> <route> [...]',
  )
  process.exit(2)
}

const base = new URL(baseUrl)
if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) {
  throw new Error(
    'Run the responsive audit against a local build or local read-only fixtures.',
  )
}

const viewports = [
  [320, 568],
  [360, 640],
  [375, 667],
  [390, 844],
  [393, 852],
  [402, 874],
  [414, 896],
  [430, 932],
  [600, 960],
  [768, 1024],
  [820, 1180],
  [834, 1194],
  [1024, 768],
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1536, 864],
  [1728, 1117],
  [1920, 1080],
  [2560, 1440],
  [3440, 1440],
  [667, 375],
  [844, 390],
  [1280, 600],
].map(([width, height]) => ({ width, height }))

function inspectLayout() {
  const width = document.documentElement.clientWidth
  const selector = (element) => {
    const anchor = element.closest('[data-testid], [id]')
    const prefix = anchor?.id
      ? '#' + anchor.id
      : anchor?.getAttribute('data-testid')
    const classes = (element.getAttribute('class') || '')
      .split(/\s+/)
      .slice(0, 6)
      .join('.')
    return [prefix, element.localName + (classes ? '.' + classes : '')]
      .filter(Boolean)
      .join(' ')
  }

  function scrollAncestor(element) {
    for (
      let parent = element.parentElement;
      parent && parent !== document.body;
      parent = parent.parentElement
    ) {
      if (
        ['auto', 'scroll'].includes(getComputedStyle(parent).overflowX) &&
        parent.scrollWidth > parent.clientWidth + 1
      ) {
        return parent
      }
    }
    return null
  }

  const leaks = []
  const clippedControls = []
  const scrollRegions = []
  for (const element of document.querySelectorAll(
    'main *, header *, nav *, [role="dialog"] *',
  )) {
    if (!(element instanceof HTMLElement) || !element.getClientRects().length)
      continue
    if (element.closest('[aria-hidden="true"], .sr-only, [inert]')) continue
    const carousel = element.closest('[data-contained-carousel]')
    if (carousel && carousel !== element) continue
    const style = getComputedStyle(element)
    if (style.visibility === 'hidden') continue
    // Screen-reader-only skip links intentionally clip until keyboard focus.
    if (style.clipPath === 'inset(50%)' && element !== document.activeElement && element.clientWidth <= 1) continue
    const rect = element.getBoundingClientRect()
    const parent = scrollAncestor(element)

    if (
      !parent &&
      rect.width > 2 &&
      (rect.right > width + 2 || rect.left < -2)
    ) {
      leaks.push({
        selector: selector(element),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      })
    }
    if (
      ['auto', 'scroll'].includes(style.overflowX) &&
      element.scrollWidth > element.clientWidth + 1
    ) {
      scrollRegions.push({
        selector: selector(element),
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
      })
    }
    if (
      !parent &&
      element.matches('a, button, input, select, textarea') &&
      element.clientWidth > 0 &&
      element.scrollWidth > element.clientWidth + 2 &&
      style.textOverflow !== 'ellipsis'
    ) {
      clippedControls.push({
        selector: selector(element),
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
      })
    }
  }

  // Measure past the old shell clipping so a hidden overflow still fails the audit.
  const shell = document.querySelectorAll(
    '.premium-app, .premium-app #main-content, .home-mobile-optimized, .admin-section-root',
  )
  const saved = [...shell].map((element) => [
    element,
    element.style.getPropertyValue('overflow-x'),
    element.style.getPropertyPriority('overflow-x'),
  ])
  const scrollWidth = document.documentElement.scrollWidth
  saved.forEach(([element]) =>
    element.style.setProperty('overflow-x', 'visible', 'important'),
  )
  const unclippedWidth = document.documentElement.scrollWidth
  saved.forEach(([element, value, priority]) =>
    element.style.setProperty('overflow-x', value, priority),
  )

  const visible = (query) =>
    [...document.querySelectorAll(query)].find(
      (element) => element.getClientRects().length,
    )
  const course = visible(
    '[data-testid="continue-learning"], .premium-active-course',
  )
  const courseAction = course?.querySelector('.learning-course-action')
  const dock = visible('.stitch-mobile-nav')
  const dockTop = dock?.getBoundingClientRect().top ?? window.innerHeight
  const topBar = visible('.premium-desktop-header, .admin-desktop-header')
  const headerItems = topBar
    ? [...topBar.children].map((element) => element.getBoundingClientRect())
    : []
  const navCollision =
    headerItems.length === 3 &&
    (headerItems[0].right > headerItems[1].left + 1 ||
      headerItems[1].right > headerItems[2].left + 1)
  return {
    clientWidth: width,
    scrollWidth,
    unclippedWidth,
    leaks: leaks.slice(0, 16),
    clippedControls: clippedControls.slice(0, 16),
    scrollRegions: scrollRegions.slice(0, 12),
    navCollision,
    courseTop: course ? Math.round(course.getBoundingClientRect().top) : null,
    courseBottom: course
      ? Math.round(course.getBoundingClientRect().bottom)
      : null,
    actionBottom: courseAction
      ? Math.round(courseAction.getBoundingClientRect().bottom)
      : null,
    dockTop: Math.round(dockTop),
    title: visible('main h1, h1')?.textContent?.trim() || null,
    font: getComputedStyle(document.body).fontFamily,
  }
}

const directory = resolve(output)
await mkdir(directory, { recursive: true })
const engine = process.env.KIVORA_BROWSER === 'webkit' ? webkit : chromium
const browser = await engine.launch({
  ...(engine === chromium ? { executablePath: process.env.KIVORA_CHROME || undefined } : {}),
})
const results = []
const errors = []
try {
  for (const route of routes) {
    const destination = new URL(route, base)
    if (destination.origin !== base.origin)
      throw new Error('Audit routes must stay on the local origin')
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
      viewport: { width: 1440, height: 900 },
    })
    try {
      const page = await context.newPage()
      page.on('pageerror', (error) =>
        errors.push({ route, message: error.message }),
      )
      const response = await page.goto(destination.href, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      const key = route.replace(/^\//, '').replace(/[^\w-]+/g, '-') || 'landing'
      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.evaluate(async () => {
          window.scrollTo({ top: 0, behavior: 'instant' })
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          )
        })
        await page.screenshot({
          path: resolve(
            directory,
            `${key}-${viewport.width}x${viewport.height}.jpg`,
          ),
          type: 'jpeg',
          quality: 78,
        })
        const layout = await page.evaluate(inspectLayout)
        results.push({
          route,
          finalPath: new URL(page.url()).pathname,
          status: response?.status(),
          ...viewport,
          ...layout,
        })
      }
      console.log(route, response?.status(), new URL(page.url()).pathname)
    } catch (error) {
      errors.push({ route, message: error.message })
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
const failures = results.filter(
  (result) =>
    result.status !== 200 ||
    result.scrollWidth > result.clientWidth + 1 ||
    result.unclippedWidth > result.clientWidth + 1 ||
    result.finalPath !== new URL(result.route, base).pathname ||
    result.leaks.length ||
    result.clippedControls.length ||
    result.navCollision ||
    (result.width === 320 &&
      result.actionBottom !== null &&
      result.actionBottom > result.dockTop),
)
await writeFile(
  resolve(directory, 'results.json'),
  JSON.stringify({ results, failures, errors }, null, 2),
)
console.log(
  JSON.stringify({
    checks: results.length,
    failures: failures.length,
    errors: errors.length,
  }),
)
if ((failures.length || errors.length) && !process.env.KIVORA_AUDIT_BASELINE)
  process.exitCode = 1
