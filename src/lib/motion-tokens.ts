// Times in seconds. GSAP power2.out is a cubic deceleration.
export const duration = {
  title: 1.05, reveal: 0.8, panel: 0.5, question: 0.4, feedback: 0.3, faq: 0.22,
  illustration: 2.4, float: 3.2, belt: 28,
  menuEnter: 0.66, menuExit: 0.32, itemEnter: 0.46, itemExit: 0.18,
} as const

export const ease = {
  title: 'power4.out', reveal: 'power3.out', out: 'power2.out', in: 'power2.in',
  inOut: 'power2.inOut', loop: 'sine.inOut', linear: 'none',
  motionOut: (progress: number) => 1 - (1 - progress) ** 3,
} as const
