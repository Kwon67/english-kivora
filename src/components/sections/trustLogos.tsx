import type { ComponentType, SVGProps } from 'react'

/**
 * Partner marks for the landing trust bar.
 *
 * These live as inline SVG rather than files under /public because an `<img src="*.svg">`
 * renders in an isolated context: no page fonts, no CSS variables. The previous assets had to
 * hardcode `#6B6560` and fall back to `ui-sans-serif`, which is why the wordmarks rendered in
 * whatever the OS default was and every logo came out the same flat grey. Inline, they inherit
 * `currentColor` and the brand palette, and the wordmark is real HTML text in the heading face.
 *
 * Shared construction so the row reads as one system: 44x44 box, 2.6 stroke, round caps/joins,
 * dark structure with a single lime accent per mark.
 */

type MarkProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 44 44',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
} as const

const DARK = 'var(--color-brand-dark)'
const LIME = 'var(--color-brand-accent)'

/** Sprout breaking out of a rounded plate — "native" growth. */
function EscolaNativaMark(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4" width="36" height="36" rx="11" fill={DARK} />
      <path d="M22 32V19" stroke={LIME} strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M22 22c-1.2-4.4-4.3-6.2-8-6.2.5 4.4 3.3 6.6 8 6.2Z"
        fill={LIME}
        fillOpacity="0.55"
      />
      <path d="M22 25c1.2-5 4.6-7.2 9-7.2-.6 5-3.8 7.6-9 7.2Z" fill={LIME} />
    </svg>
  )
}

/** Beaker with a fluid line — a language "lab". */
function FluencyLabMark(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M18 6v11L9.4 31.2A4 4 0 0 0 12.8 37h18.4a4 4 0 0 0 3.4-5.8L26 17V6"
        stroke={DARK}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M15.5 6h13" stroke={DARK} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M13.2 27.5h17.6l3.8 6.2A3.4 3.4 0 0 1 31.4 37H12.6a3.4 3.4 0 0 1-3.2-3.3Z" fill={LIME} />
    </svg>
  )
}

/** Mortarboard — the academy. */
function KivoraAcademyMark(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path d="M22 9 39 17l-17 8-17-8 17-8Z" fill={DARK} />
      <path d="M22 25 39 17v4l-17 8-17-8v-4l17 8Z" fill={LIME} />
      <path d="M32 21.5v8c0 2.5-4.5 4.5-10 4.5s-10-2-10-4.5v-8" stroke={DARK} strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  )
}

/** Bolt inside a bracket pair — code plus energy. */
function TechTeensMark(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13 9 5 22l8 13" stroke={DARK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M31 9l8 13-8 13" stroke={DARK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24.5 11 16 23.5h5.5L19.5 33 28 20.5h-5.5L24.5 11Z" fill={LIME} stroke={DARK} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  )
}

/** Globe with a tilted orbit — starting out, globally. */
function GlobalStartMark(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="22" cy="22" r="13" fill={LIME} />
      <circle cx="22" cy="22" r="13" stroke={DARK} strokeWidth="2.6" />
      <path d="M22 9c4 4 4 22 0 26M22 9c-4 4-4 22 0 26" stroke={DARK} strokeWidth="2.2" />
      <path d="M9.4 18h25.2M9.4 26h25.2" stroke={DARK} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

/** Central node with spokes — a hub. */
function EnglishHubMark(props: MarkProps) {
  return (
    <svg {...base} {...props}>
      <path d="M22 22 10 12M22 22l12-10M22 22L11 33M22 22l11 11" stroke={DARK} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="10" cy="12" r="4" fill={DARK} />
      <circle cx="34" cy="12" r="4" fill={DARK} />
      <circle cx="11" cy="33" r="4" fill={DARK} />
      <circle cx="33" cy="33" r="4" fill={DARK} />
      <circle cx="22" cy="22" r="7.5" fill={LIME} stroke={DARK} strokeWidth="2.6" />
    </svg>
  )
}

export type Partner = {
  name: string
  Mark: ComponentType<MarkProps>
}

export const partners: readonly Partner[] = [
  { name: 'Escola Nativa', Mark: EscolaNativaMark },
  { name: 'Fluency Lab', Mark: FluencyLabMark },
  { name: 'Kivora Academy', Mark: KivoraAcademyMark },
  { name: 'Tech Teens', Mark: TechTeensMark },
  { name: 'Global Start', Mark: GlobalStartMark },
  { name: 'English Hub', Mark: EnglishHubMark },
] as const
