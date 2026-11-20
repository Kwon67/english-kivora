import styles from './MindmarketLanding.module.css'

type Point = { x: number; y: number }
export type RibbonCubic = { start: Point; first: Point; second: Point; end: Point }
export type RibbonClearance = { x: number; y: number; w: number; h: number; r: number }

const mix = (a: number, b: number, t: number) => a + (b - a) * t

function prepareSegment(curve: RibbonCubic, scaleX: number, scaleY: number) {
  const project = (p: Point) => ({ x: p.x * scaleX, y: p.y * scaleY })
  const a = project(curve.start), b = project(curve.first), c = project(curve.second), d = project(curve.end)
  const path = new Path2D()
  path.moveTo(a.x, a.y)
  path.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y)

  // Invert projected arc length to t once per draw using this measured table.
  const distances = new Float64Array(257)
  let last = a
  for (let i = 1; i < distances.length; i++) {
    const t = i / (distances.length - 1), u = 1 - t
    const at = (a: number, b: number, c: number, d: number) => u*u*u*a + 3*u*u*t*b + 3*u*t*t*c + t*t*t*d
    const point = { x: at(a.x, b.x, c.x, d.x), y: at(a.y, b.y, c.y, d.y) }
    distances[i] = distances[i - 1] + Math.hypot(point.x - last.x, point.y - last.y)
    last = point
  }
  function strokePrefix(ctx: CanvasRenderingContext2D, fraction: number) {
    const target = fraction * distances[distances.length - 1]
    let lo = 0, hi = distances.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >>> 1
      if (target < distances[mid]) hi = mid
      else lo = mid
    }
    const span = distances[hi] - distances[lo]
    const t = (lo + (span ? (target - distances[lo]) / span : 0)) / (distances.length - 1)
    // de Casteljau gives the exact prefix cubic and tangent at the round cap.
    const bx = mix(a.x, b.x, t), by = mix(a.y, b.y, t)
    const mx = mix(b.x, c.x, t), my = mix(b.y, c.y, t)
    const cx = mix(bx, mx, t), cy = mix(by, my, t)
    const dx = mix(cx, mix(mx, mix(c.x, d.x, t), t), t)
    const dy = mix(cy, mix(my, mix(c.y, d.y, t), t), t)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.bezierCurveTo(bx, by, cx, cy, dx, dy)
    ctx.stroke()
  }
  return { path, strokePrefix, minX: Math.min(a.x,b.x,c.x,d.x), maxX: Math.max(a.x,b.x,c.x,d.x),
    minY: Math.min(a.y,b.y,c.y,d.y), maxY: Math.max(a.y,b.y,c.y,d.y) }
}

type Geometry = {
  curves: RibbonCubic[]; areas: RibbonClearance[]; ends: number[]
  scaleX: number; scaleY: number; width: number; height: number
  journeyTop: number; footerTop: number; stroke: number; color: string
  lengthAtY: (y: number) => number
}

export function mountRibbonCanvas(container: HTMLElement, reduced: boolean) {
  const rail = document.createElement('div')
  rail.className = styles.ribbonRail
  const canvas = document.createElement('canvas')
  canvas.className = styles.ribbonCanvas
  canvas.dataset.ribbonCanvas = ''
  const surface = canvas.getContext('2d')
  if (!surface) return null
  const context = surface
  rail.append(canvas)
  container.append(rail)
  let width = 0, height = 0, angle: number | undefined
  let frame = 0
  let paint: (() => void) | undefined
  const onFrame = () => { frame = 0; paint?.() }
  const onScroll = () => { if (!frame) frame = requestAnimationFrame(onFrame) }
  window.addEventListener('scroll', onScroll, { passive: true })

  function measure(g: Geometry) {
    const orientation = window.screen.orientation?.angle ?? window.orientation
    if (g.width !== width || orientation !== angle) {
      angle = orientation
      width = g.width
      canvas.style.removeProperty('height')
      height = canvas.offsetHeight
      canvas.style.height = `${height}px`
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }
    const holes = g.areas.map(area => {
      const x = area.x * g.scaleX, y = area.y * g.scaleY, w = area.w * g.scaleX, h = area.h * g.scaleY
      const path = new Path2D()
      path.rect(0, 0, width, g.height)
      path.roundRect(x, y, w, h, { x: area.r * g.scaleX, y: area.r * g.scaleY })
      return { x, y, w, h, path }
    })
    const pad = g.stroke / 2 + 1
    const segments = g.curves.map((curve, i) => {
      const seg = prepareSegment(curve, g.scaleX, g.scaleY)
      const minY = seg.minY - pad, maxY = seg.maxY + pad
      const clips = holes.filter(h => h.x < seg.maxX + pad && h.x + h.w > seg.minX - pad && h.y < maxY && h.y + h.h > minY)
      return { ...seg, minY, maxY, clips, start: g.ends[i - 1] ?? 0, end: g.ends[i] }
    })
    const endScroll = g.height - height
    const footerStart = Math.max(g.footerTop - height, endScroll - height * .35)
    const length = g.ends[g.ends.length - 1]
    const sx = canvas.width / width, sy = canvas.height / height
    context.strokeStyle = g.color
    context.lineWidth = g.stroke
    context.lineJoin = context.lineCap = 'round'
    let lastTop = NaN, lastDrawn = NaN
    paint = () => {
      const local = window.scrollY - g.journeyTop
      const top = Math.max(0, Math.min(endScroll, local))
      const f = Math.min(1, Math.max(0, (local - footerStart) / Math.max(1, endScroll - footerStart)))
      const spatial = reduced ? length : g.lengthAtY(local + height / 2)
      const drawn = spatial + (length - spatial) * f*f*(3 - 2*f)
      if (top === lastTop && drawn === lastDrawn) return
      lastTop = top
      lastDrawn = drawn
      context.setTransform(sx, 0, 0, sy, 0, 0)
      context.clearRect(0, 0, width, height)
      context.translate(0, -top)
      for (const segment of segments) {
        if (drawn <= segment.start) break
        if (segment.maxY < top || segment.minY > top + height) continue
        context.save()
        for (const hole of segment.clips) context.clip(hole.path, 'evenodd')
        if (drawn >= segment.end) context.stroke(segment.path)
        else segment.strokePrefix(context, (drawn - segment.start) / (segment.end - segment.start))
        context.restore()
      }
    }
    paint()
  }
  return { measure, destroy() {
    window.removeEventListener('scroll', onScroll)
    cancelAnimationFrame(frame)
    rail.remove()
  } }
}
