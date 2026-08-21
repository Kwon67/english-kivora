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
 * `inset-0` over a `relative` parent means the doodles spread across the full scroll height of
 * the page, and percentage offsets keep them distributed rather than bunched at the top of a
 * long list. Phones get three of them at smaller sizes — the same five would read as clutter in
 * a 375px column.
 */
export default function StudyDoodleBackdrop({ className = '' }: DoodleProps) {
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
      <DoodlePencil className="absolute left-[-3%] top-[6%] w-28 -rotate-[18deg] sm:w-40 lg:w-44" />
      <DoodleRuler className="absolute right-[-4%] top-[22%] w-24 rotate-[24deg] sm:w-36 lg:w-40" />
      <DoodlePen className="absolute left-[4%] top-[46%] hidden w-28 rotate-[8deg] sm:block sm:w-36 lg:w-40" />
      <DoodleRuler className="absolute left-[-5%] top-[68%] w-24 -rotate-[12deg] sm:w-32 lg:w-36" />
      <DoodlePencil className="absolute right-[-2%] top-[84%] w-24 rotate-[32deg] sm:w-36 lg:w-40" />
    </div>
  )
}
