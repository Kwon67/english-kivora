import { gsap } from '@/lib/gsap'

const WORD_DURATION = 1.05
const WORD_STAGGER = .08
const WORD_EASE = 'power4.out'
const WORD_START_Y_PERCENT = 110
const WORD_START_OPACITY = .25

export function setupHeroMotion(container: HTMLElement) {
  const bootstrap = container.querySelector<HTMLElement>('#hero-title[data-hero-reveal]')
  if (!bootstrap) return

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const showTitle = () => {
    delete bootstrap.dataset.heroReveal
  }

  if (reducedMotion.matches || document.hidden) {
    showTitle()
    return
  }

  const context = gsap.context(() => {}, container)
  // Let StrictMode finish its setup/cleanup cycle before consuming the page's one reveal.
  const frame = requestAnimationFrame(() => {
    const firstWord = bootstrap.querySelector('[data-title-word]')
    if (!firstWord || getComputedStyle(firstWord).opacity !== '0') {
      showTitle()
      return
    }
    try {
      context.add(() => {
        const select = gsap.utils.selector(container)
        gsap.timeline()
          .fromTo(select('#hero-title [data-title-word]'),
            { yPercent: WORD_START_Y_PERCENT, opacity: WORD_START_OPACITY },
            {
              yPercent: 0, opacity: 1, duration: WORD_DURATION, stagger: WORD_STAGGER,
              ease: WORD_EASE, clearProps: 'transform,opacity',
            }, 0)
          .from(select('[data-hero-art]'), {
            y: 8, opacity: .65, duration: .72,
            ease: 'power3.out', clearProps: 'transform,opacity',
          }, .22)
          .from(select('[data-hero-card-stage]'), {
            y: 6, opacity: .78, duration: .44, ease: 'power2.out', clearProps: 'transform,opacity',
          }, .38)
          .from(select('[data-hero-copy] [data-action-icon] svg'), {
            x: -4, y: 4, duration: .36, ease: 'power3.out', clearProps: 'transform',
          }, .79)
      })
    } catch (error) {
      context.revert()
      throw error
    } finally {
      showTitle()
    }
  })

  const onMotionChange = (event: MediaQueryListEvent) => {
    if (!event.matches) return
    cancelAnimationFrame(frame)
    showTitle()
    context.revert()
  }
  reducedMotion.addEventListener('change', onMotionChange)
  return () => {
    cancelAnimationFrame(frame)
    reducedMotion.removeEventListener('change', onMotionChange)
    context.revert()
  }
}
