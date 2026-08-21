/**
 * Ambient study doodles for the app background — ruler, pencil and pen, drawn as outlines only.
 *
 * Deliberately different from the ornaments in DecorativeSvgs: those are filled shapes placed
 * next to content as illustration. These are line art living behind everything, so every path is
 * `fill="none"` and inherits `currentColor`, and the wrapper alone decides colour and opacity.
 *
 * Stroke widths are in viewBox units, so a doodle rendered at 96px on a phone and 176px on a
 * desktop keeps the same visual line weight relative to its own drawing.
 */

type DoodleProps = { className?: string }

const svgBase = 'pointer-events-none select-none'

/** Ruler — body plus a graduated edge of alternating long and short ticks. */
export function DoodleRuler({ className = '' }: DoodleProps) {
  const ticks = []
  for (let x = 12; x <= 128; x += 12) {
    const long = (x / 12) % 2 === 1
    ticks.push(<path key={x} d={`M${x},1 L${x},${long ? 11 : 7}`} />)
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 30"
      aria-hidden="true"
      focusable="false"
      className={`${svgBase} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="1" width="138" height="28" rx="3" />
      {ticks}
    </svg>
  )
}

/** Pencil — sharpened tip, hexagonal barrel, ferrule and eraser. */
export function DoodlePencil({ className = '' }: DoodleProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 140 26"
      aria-hidden="true"
      focusable="false"
      className={`${svgBase} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* sharpened tip, with the graphite marked off near the point */}
      <path d="M2,13 L24,3 L24,23 Z" />
      <path d="M9.5,9.6 L9.5,16.4" />
      {/* barrel, with the ridge line that reads as a hexagonal shaft */}
      <path d="M24,3 L106,3 L106,23 L24,23 Z" />
      <path d="M24,13 L106,13" />
      {/* ferrule */}
      <path d="M106,3 L122,3 L122,23 L106,23 Z" />
      <path d="M112,3 L112,23" />
      {/* eraser */}
      <path d="M122,3 L134,3 Q138,3 138,7 L138,19 Q138,23 134,23 L122,23 Z" />
    </svg>
  )
}

/** Pen — nib with its slit, collar bands and a rounded barrel. */
export function DoodlePen({ className = '' }: DoodleProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 130 28"
      aria-hidden="true"
      focusable="false"
      className={`${svgBase} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* nib */}
      <path d="M2,14 L20,7 L20,21 Z" />
      <path d="M2,14 L13,14" />
      {/* collar between nib and barrel */}
      <path d="M20,7 L25,5 L25,23 L20,21 Z" />
      {/* barrel, closed with a domed end */}
      <path d="M25,5 L114,5 Q126,5 126,14 Q126,23 114,23 L25,23 Z" />
      {/* band near the grip */}
      <path d="M36,5 L36,23" />
    </svg>
  )
}

/**
 * The backdrop layer itself.
 *
 * Vertical placement is a fixed pixel rhythm, not percentages. Percentages sound right — spread
 * the doodles down the page — but they make density depend on page length: five items spent on a
 * short Settings page sat close together, the same five on a long Explore page ended up hundreds
 * of pixels apart, which is why the background read as "one here, one over there". A fixed
 * ROW_HEIGHT means a screenful shows roughly the same number of doodles on every page, short or
 * long; `overflow-hidden` on the layer trims whatever a short page doesn't need.
 *
 * `top` is computed per row, so it cannot be a Tailwind class — `top-[${top}px]` built from a
 * runtime number has no literal text in this file for Tailwind's content scanner to find, and
 * would silently generate no CSS (the same class of bug the design-system tokens hit earlier:
 * Tailwind's JIT only sees class names it can read as text). It is inline style instead. The
 * horizontal offset, rotation and size stay Tailwind classes on purpose — those strings ARE
 * written literally in `DOODLE_PATTERN` below, so the scanner finds them.
 */
const ROW_HEIGHT = 190
/**
 * `x` stays negative on every entry — off the margin, drifting further off rather than toward
 * the centre. A positive offset ("left-[3%]") pulls a doodle inward by tens of pixels, which at
 * these sizes lands it mid-card, on top of a badge or a line of text instead of crossing an
 * edge. The first version of this pattern had a few positive values and one sat squarely on the
 * "Plano do dia" pill.
 */
const DOODLE_PATTERN: {
  Doodle: (props: DoodleProps) => React.JSX.Element
  x: string
  rotate: string
  size: string
}[] = [
  { Doodle: DoodlePencil, x: 'left-[-6%]', rotate: '-rotate-[18deg]', size: 'w-24 sm:w-36' },
  { Doodle: DoodleRuler, x: 'right-[-7%]', rotate: 'rotate-[22deg]', size: 'w-24 sm:w-32' },
  { Doodle: DoodlePen, x: 'left-[-8%]', rotate: '-rotate-[8deg]', size: 'w-24 sm:w-32' },
  { Doodle: DoodleRuler, x: 'left-[-4%]', rotate: '-rotate-[14deg]', size: 'w-24 sm:w-34' },
  { Doodle: DoodlePencil, x: 'right-[-4%]', rotate: 'rotate-[30deg]', size: 'w-24 sm:w-36' },
  { Doodle: DoodlePen, x: 'right-[-9%]', rotate: 'rotate-[10deg]', size: 'w-24 sm:w-30' },
  { Doodle: DoodleRuler, x: 'right-[-3%]', rotate: '-rotate-[24deg]', size: 'w-24 sm:w-32' },
  { Doodle: DoodlePencil, x: 'left-[-9%]', rotate: 'rotate-[16deg]', size: 'w-24 sm:w-34' },
]

export default function StudyDoodleBackdrop({ className = '' }: DoodleProps) {
  // 60 rows * 190px covers ~11,400px — past Explore's ~9,400px (105 packs, the longest catalogue
  // page today) with headroom for the catalogue to grow. `overflow-hidden` on the layer clips
  // the rest on every shorter page, so the row count doesn't need to vary per route.
  const rows = Array.from({ length: 60 }, (_, index) => ({
    ...DOODLE_PATTERN[index % DOODLE_PATTERN.length],
    top: 60 + index * ROW_HEIGHT,
  }))

  return (
    <div
      aria-hidden="true"
      /*
       * Sits ABOVE the content rather than behind it, which is not where a background layer
       * belongs — but behind it the doodles do not exist. The dashboard is wall-to-wall opaque
       * cards: sampling a grid of the viewport found page background showing at 4 points out of
       * 1575. Underneath, even pure red at full opacity was invisible. Reading a hairline through
       * a card would need the card near 50% opacity, which repaints the whole app.
       *
       * So this is a paper-grain overlay instead: 10% opacity hairlines, `pointer-events-none`,
       * and doodles parked at the page margins, where they cross card edges rather than text.
       * z-index 5 keeps it under the sticky topbar (50) and dialogs (100), so nothing
       * interactive ever gets a line drawn over it.
       *
       * Both position and z-index are inline because `.home-page-texture > *` in globals.css
       * sets `position: relative; z-index: 1` on every direct child and ties with a Tailwind
       * utility on specificity, so stylesheet order decides and the utility loses. With
       * `position` coming from a class this layer collapsed to height 0 and every doodle
       * stacked at the top of the page instead of spreading down it.
       */
      style={{ position: 'absolute', zIndex: 5 }}
      className={`pointer-events-none inset-0 overflow-hidden text-brand-dark opacity-10 ${className}`}
    >
      {rows.map(({ Doodle, x, rotate, size, top }, index) => (
        <div key={index} className="absolute inset-x-0" style={{ top }}>
          <Doodle className={`absolute ${x} ${size} ${rotate}`} />
        </div>
      ))}
    </div>
  )
}
