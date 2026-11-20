// Browser-test instrumentation only. The renderer ships without timing hooks.
export function installCanvasProbe() {
  const stats = { frames: [], draws: 0, strokes: 0, bufferWrites: 0, rectReads: 0, lengthReads: 0, tip: null }
  window.__ribbonProbe = stats
  const isRibbon = c => c?.hasAttribute('data-ribbon-canvas')
  const context = CanvasRenderingContext2D.prototype
  const clear = context.clearRect, stroke = context.stroke, cubic = context.bezierCurveTo
  context.clearRect = function (...args) {
    if (isRibbon(this.canvas)) { stats.draws++; stats.tip = null }
    return clear.apply(this, args)
  }
  context.stroke = function (...args) {
    if (isRibbon(this.canvas)) stats.strokes++
    return stroke.apply(this, args)
  }
  context.bezierCurveTo = function (...args) {
    if (isRibbon(this.canvas)) stats.tip = args.slice(2)
    return cubic.apply(this, args)
  }
  for (const name of ['width', 'height']) {
    const desc = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, name)
    Object.defineProperty(HTMLCanvasElement.prototype, name, { ...desc, set(value) {
      if (isRibbon(this)) stats.bufferWrites++
      desc.set.call(this, value)
    } })
  }
  let allRectReads = 0, allLengthReads = 0
  const rect = Element.prototype.getBoundingClientRect, length = SVGPathElement.prototype.getTotalLength
  Element.prototype.getBoundingClientRect = function () {
    allRectReads++
    if (this.matches('[data-ribbon-journey],[data-ribbon-canvas],[data-ribbon-mobile],[data-ribbon-desktop]')) stats.rectReads++
    return rect.call(this)
  }
  SVGPathElement.prototype.getTotalLength = function () {
    allLengthReads++
    if (this.closest('[data-ribbon-mobile],[data-ribbon-desktop]')) stats.lengthReads++
    return length.call(this)
  }
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = fn => raf(time => {
    const { draws, strokes } = stats
    const rects = allRectReads, lengths = allLengthReads
    const start = performance.now()
    fn(time)
    if (stats.draws !== draws) stats.frames.push({ ms: performance.now() - start, strokes: stats.strokes - strokes,
      rectReads: allRectReads - rects, lengthReads: allLengthReads - lengths })
  })
}

export function readCanvasCounters() {
  const { frames, tip, ...counters } = window.__ribbonProbe
  return { ...counters, frames: frames.length, tip }
}

export function canvasPixels() {
  const canvas = document.querySelector('[data-ribbon-canvas]')
  return canvas.toDataURL()
}
