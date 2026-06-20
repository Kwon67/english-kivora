/**
 * Shared dashboard / auth shell backgrounds — grid + full-height ambient glow.
 * Keep light and dark fades vertical so long pages fade smoothly (no hard cut at 30rem).
 */

export const pageBgGrid =
  'home-bg-grid pointer-events-none absolute inset-0 z-0 opacity-[0.14] [background-image:linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.14]'

export const pageBgGlow =
  'pointer-events-none absolute inset-0 z-0 min-h-[30rem] bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42)_0%,rgba(244,245,232,0.55)_38%,rgba(244,245,232,0.12)_62%,transparent_82%)] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.18),transparent_32%),linear-gradient(180deg,rgba(24,59,22,0.42)_0%,rgba(24,59,22,0.2)_28%,rgba(24,59,22,0.08)_48%,rgba(5,7,4,0.02)_68%,transparent_88%)]'

export const pageBgGridExplore =
  'home-bg-grid pointer-events-none absolute inset-0 z-0 opacity-[0.14] [background-image:linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.07]'

/** AMOLED explore shells (#0a0a0a) — subtle top glow only, no full-page green wash. */
export const pageBgGlowExplore =
  'pointer-events-none absolute inset-x-0 top-0 z-0 h-[36rem] max-h-[70vh] bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42)_0%,rgba(244,245,232,0.55)_38%,rgba(244,245,232,0.12)_62%,transparent_82%)] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.07),transparent_26%),linear-gradient(180deg,rgba(24,59,22,0.14)_0%,rgba(24,59,22,0.05)_40%,transparent_72%)]'