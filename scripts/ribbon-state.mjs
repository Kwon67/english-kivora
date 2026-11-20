export function readRibbonState() {
  const mobile = matchMedia('(max-width: 767px)').matches
  const svg = document.querySelector(mobile ? '[data-ribbon-mobile]' : '[data-ribbon-desktop]')
  const reference = svg.querySelector('[data-ribbon-path]')
  const journey = svg.closest('[data-ribbon-journey]')
  const length = journey.offsetHeight
  let offset = 0
  const paths = [...svg.querySelectorAll('path[vector-effect]:not([data-ribbon-path])')]
  if (paths.length) {
    for (const path of paths) {
      if (path.style.strokeDasharray) {
        offset += parseFloat(path.style.strokeDashoffset)
      } else if (path.getAttribute('visibility') === 'hidden') {
        // Project the unrevealed cubic into CSS pixels on the diagnostic side.
        const matrix = path.getScreenCTM()
        const arc = path.getTotalLength()
        let prev = path.getPointAtLength(0).matrixTransform(matrix)
        for (let i = 1; i <= 64; i++) {
          const point = path.getPointAtLength(arc * i / 64).matrixTransform(matrix)
          offset += Math.hypot(point.x - prev.x, point.y - prev.y)
          prev = point
        }
      }
    }
  } else {
    offset = parseFloat(reference.style.strokeDashoffset) || 0
  }
  const hidden = [...document.querySelectorAll('[data-reveal]')].filter(el => {
    const rect = el.getBoundingClientRect()
    return rect.top < innerHeight * .9 && rect.bottom > 0 && getComputedStyle(el).opacity === '0'
  }).length
  return { d: reference.getAttribute('d'), viewBox: svg.getAttribute('viewBox'), height: length,
    offset, hidden, overflow: document.documentElement.scrollWidth > innerWidth }
}

// Run in the browser after the initial layout has settled. Include the backing
// surfaces and clip definitions in the mutation check, as well as the ink.
export async function auditStaticRibbonScroll() {
  const svg = document.querySelector(matchMedia('(max-width: 767px)').matches ? '[data-ribbon-mobile]' : '[data-ribbon-desktop]')
  const root = svg.parentElement
  const journey = root.parentElement
  const ink = svg.querySelector('[data-ribbon-path]')
  const anchor = () => svg.getBoundingClientRect().top - journey.getBoundingClientRect().top
  const origin = anchor()
  const max = document.documentElement.scrollHeight - innerHeight
  const positions = [0, 120, 400, max/4, max/2, max, max/2, max/4, 400, 120, 0]
  let mutations = 0, drift = 0
  let samples = 0
  const active = new MutationObserver(records => { mutations += records.length })
  active.observe(root, { attributes: true, childList: true, subtree: true })
  try {
    for (const top of positions) {
      scrollTo({ top, behavior: 'instant' })
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      drift = Math.max(drift, Math.abs(anchor() - origin))
      if (Math.abs(scrollY - top) <= 1) samples++
    }
    mutations += active.takeRecords().length
    const { visibility, strokeDasharray, strokeDashoffset } = getComputedStyle(ink)
    return { mutations, drift, samples, position: getComputedStyle(svg).position,
      clips: svg.querySelectorAll('clipPath').length, canvas: root.querySelectorAll('canvas').length,
      strokes: svg.querySelectorAll('path[vector-effect]').length, visibility, strokeDasharray, strokeDashoffset }
  } finally {
    active.disconnect()
  }
}

// Display the original, unsegmented geometry and its full clearance mask.
export async function showRibbonReference(page) {
  const element = await page.evaluateHandle(() => {
    const svg = document.querySelector(matchMedia('(max-width: 767px)').matches ? '[data-ribbon-mobile]' : '[data-ribbon-desktop]')
    const clone = svg.cloneNode(false)
    clone.removeAttribute('data-ribbon-desktop')
    clone.removeAttribute('data-ribbon-mobile')
    clone.style.setProperty('display', 'block', 'important')
    const ink = svg.querySelector('[data-ribbon-path]').cloneNode(true)
    ink.removeAttribute('visibility')
    ink.removeAttribute('style')
    ink.removeAttribute('data-ribbon-path')
    ink.setAttribute('mask', `url(#${svg.querySelector('mask').id}-reference)`)
    const defs = svg.querySelector('defs').cloneNode(false)
    const mask = svg.querySelector('mask').cloneNode(true)
    mask.id += '-reference'
    defs.append(mask)
    clone.append(defs, ink)
    svg.after(clone)
    return clone
  })
  // Keep the live renderer mounted while capturing the reference.
  const css = await page.addStyleTag({ content: ':is([data-ribbon-desktop], [data-ribbon-mobile]) path[vector-effect] {opacity:0!important}' })
  return async () => {
    await css.evaluate(el => el.remove())
    await element.evaluate(el => el.remove())
    await element.dispose()
  }
}
