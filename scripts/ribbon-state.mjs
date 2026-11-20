// Executed in the page by the diagnostic scripts. Only inspect the current
// band: reading transformed children of skipped bands can force their layout.
export function readRibbonState() {
  const mobile = matchMedia('(max-width: 767px)').matches
  const svg = document.querySelector(mobile ? '[data-ribbon-mobile]' : '[data-ribbon-desktop]')
  const reference = svg.querySelector('[data-ribbon-path]')
  const bands = [...document.querySelectorAll('[data-ribbon-band]')]
  const tiled = bands.length > 0 && matchMedia('(pointer: coarse)').matches
  const journey = svg.closest('[data-ribbon-journey]')
  const length = journey.offsetHeight
  let offset = 0
  if (tiled) {
    const focus = innerHeight / 2
    const active = bands.find(el => el.getBoundingClientRect().bottom >= focus) ?? bands.at(-1)
    const gate = getComputedStyle(active.querySelector('[data-ribbon-gate]'))
    if (gate.animationName !== 'none') {
      const remaining = -new DOMMatrix(gate.transform).m42
      offset = Math.max(0, length - active.offsetTop - active.offsetHeight + remaining)
    }
  } else {
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
  }
  const hidden = [...document.querySelectorAll('[data-reveal]')].filter(el => {
    const rect = el.getBoundingClientRect()
    return rect.top < innerHeight * .9 && rect.bottom > 0 && getComputedStyle(el).opacity === '0'
  }).length
  return { d: reference.getAttribute('d'), viewBox: svg.getAttribute('viewBox'), height: length,
    offset, tiles: tiled ? bands.length : 0, hidden, overflow: document.documentElement.scrollWidth > innerWidth }
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
  // Keep the view timelines and compositor state live between captures.
  const css = await page.addStyleTag({ content: ':is([data-ribbon-band], [data-ribbon-desktop], [data-ribbon-mobile]) path[vector-effect] {opacity:0!important}' })
  return async () => {
    await css.evaluate(el => el.remove())
    await element.evaluate(el => el.remove())
    await element.dispose()
  }
}
