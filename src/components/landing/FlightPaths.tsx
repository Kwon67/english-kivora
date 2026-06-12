/* Decorative flight-path background
 * – position: absolute → scrolls with the page, never sticks to viewport
 * – z-index: 0 → sits above the page bg colour but below all content (z-1)
 * – pointer-events: none → completely non-interactive
 * – overflow-hidden on the wrapper prevents horizontal and vertical scroll leak
 */

interface FlightSegment {
  id: string
  top: number
  height: number
  pathD: string
}

const SEGMENTS: FlightSegment[] = [
  // Path 1: Top section, left to right
  {
    id: 's1',
    top: 180,
    height: 180,
    pathD: 'M -5 60 C 20 20, 60 80, 105 40',
  },
  // Path 2: Mid-upper, right to left
  {
    id: 's2',
    top: 550,
    height: 200,
    pathD: 'M 105 30 C 80 80, 40 20, -5 70',
  },
  // Path 3: Mid, left to right
  {
    id: 's3',
    top: 1050,
    height: 180,
    pathD: 'M -5 30 C 30 90, 70 10, 105 60',
  },
  // Path 4: Mid-lower, right to left
  {
    id: 's4',
    top: 1600,
    height: 200,
    pathD: 'M 105 70 C 75 10, 35 90, -5 40',
  },
  // Path 5: Lower, left to right
  {
    id: 's5',
    top: 2200,
    height: 180,
    pathD: 'M -5 50 C 35 15, 65 85, 105 45',
  },
  // Path 6: Bottom-mid, right to left
  {
    id: 's6',
    top: 2800,
    height: 180,
    pathD: 'M 105 35 C 75 85, 35 15, -5 65',
  },
  // Path 7: Bottom, left to right
  {
    id: 's7',
    top: 3350,
    height: 200,
    pathD: 'M -5 30 C 30 85, 75 15, 105 55',
  },
]

export default function FlightPaths() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {SEGMENTS.map((seg) => (
        <div
          key={seg.id}
          className="absolute left-0 w-full"
          style={{
            top: `${seg.top}px`,
            height: `${seg.height}px`,
          }}
        >
          {/* Wave/Bezier line that scales horizontally but retains constant stroke thickness */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={seg.pathD}
              fill="none"
              strokeWidth="1.6"
              strokeDasharray="4 8"
              strokeLinecap="round"
              style={{
                stroke: 'var(--color-flight-path)',
                vectorEffect: 'non-scaling-stroke',
              }}
            />
          </svg>
        </div>
      ))}
    </div>
  )
}
