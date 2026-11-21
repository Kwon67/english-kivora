import { gsap, SplitText } from '@/lib/gsap'
import { ease } from '@/lib/motion-tokens'
import { playLandingSound } from './landingSound'

function entrance(trigger: Element, id: string, start = 'top 86%') {
  return gsap.timeline({
    defaults: { duration: .54, ease: ease.reveal },
    // Keep passed triggers in the media context until teardown. Removing them
    // mid-refresh can invalidate ScrollTrigger's traversal on anchored loads.
    scrollTrigger: { id, trigger, start, toggleActions: 'play none none none' },
  })
}

// These timelines are owned by JourneyMotion's reduced-motion media context.
export function setupSectionMotion(root: HTMLElement) {
  const rail = root.querySelector('[data-level-rail]')
  if (rail) {
    const stops = rail.querySelectorAll('button > span')
    entrance(rail, 'kivora-level-stops')
      .fromTo(rail, { '--rail-progress': 0 }, { '--rail-progress': 1, duration: .86, ease: 'power1.inOut' }, 0)
      .from(stops, { y: -16, rotation: -9, scale: .84, transformOrigin: '50% 85%', ease: 'back.out(1.45)', stagger: .105, clearProps: 'transform' }, .04)
  }

  const practice = root.querySelector('#como-funciona')
  if (practice) {
    const copyShell = practice.querySelector('[data-story-card]')?.parentElement
    const demo = practice.querySelector('#practice-demo')
    if (copyShell && demo) {
      const sticker = demo.querySelector(':scope > [aria-hidden="true"]')
      const exercise = demo.querySelector('[data-practice-lab]')
      const pencil = practice.querySelector('[data-journey-prop] img')
      const ink = practice.querySelector('[data-mark]')
      const deal = entrance(exercise ?? demo, 'kivora-practice-cards', 'top 94%')
      deal.from(copyShell, { y: 16, rotationY: -5, transformPerspective: 900, transformOrigin: 'right center', duration: .62, clearProps: 'transform' }, 0)
      if (exercise) deal.from(exercise, { y: 20, rotationX: 5, transformPerspective: 800, transformOrigin: '50% 75%', clearProps: 'transform' }, .08)
      if (pencil) deal.from(pencil, { x: -16, y: 8, rotation: -16, duration: .5, clearProps: 'transform' }, .14)
      if (ink) deal.fromTo(ink, { '--paint': 0 }, { '--paint': 1, duration: .46 }, .18)
      if (sticker) deal.from(sticker, { scale: .7, rotation: -9, duration: .34, ease: 'back.out(1.7)', clearProps: 'transform' }, .32)
    }
  }

  const memory = root.querySelector('#revisoes')
  if (memory) {
    const growth = gsap.timeline({ defaults: { ease: ease.linear }, scrollTrigger: {
      id: 'kivora-memory-growth', trigger: memory, start: 'top 78%', end: 'bottom 65%', scrub: true,
    } })
    growth.from(memory.querySelector('[data-plant]'), { scale: .42, rotation: -8, transformOrigin: '62% 74%', duration: .72 }, 0)
      .fromTo(memory.querySelector('[data-mark]'), { '--paint': 0 }, { '--paint': 1, duration: .48 }, .52)
      .from(memory.querySelector('[data-float]'), { y: 8, rotation: -4, duration: .3 }, .59)
  }

  const conversation = root.querySelector('#conversacao')
  const phrase = conversation?.querySelector('[data-type]')
  const bubble = phrase?.parentElement
  if (conversation && phrase && bubble) {
    const words = SplitText.create(phrase, { type: 'words', tag: 'span', aria: 'auto' })
    entrance(bubble, 'kivora-conversation', 'top 89%')
      .from(bubble, { scale: .93, y: 13, rotation: -2, transformOrigin: 'bottom left', duration: .4, ease: 'back.out(1.35)', clearProps: 'transform' }, 0)
      .from(words.words, { yPercent: 26, duration: .24, stagger: .055, clearProps: 'transform' }, .12)
      .from(bubble.querySelector('small'), { x: 12, duration: .38, clearProps: 'transform' }, .34)
      .fromTo(conversation.querySelector('[data-mark]'), { '--paint': 0 }, { '--paint': 1, duration: .5 }, .38)
  }

  const ranking = root.querySelector('[data-ranking]')
  if (ranking) {
    const scores = Array.from(ranking.querySelectorAll<HTMLElement>('[data-score]'))
    const bolt = ranking.closest('section')?.querySelector('[data-float] img')
    const blitz = entrance(ranking, 'kivora-blitz-scoreboard', 'top 89%')
    if (bolt) blitz.from(bolt, { scale: 1.25, rotation: -17, duration: .32, ease: 'back.out(2)', clearProps: 'transform' }, 0)
    scores.forEach((score, i) => {
      const label = score.dataset.score!
      const beat = i * .105
      blitz.from(score.parentElement, { x: i % 2 ? 19 : -19, duration: .32, clearProps: 'transform' }, beat)
        .fromTo(score, { textContent: '000' }, { scrambleText: { text: label, chars: '0123456789' }, duration: .42, immediateRender: false }, beat)
    })
    blitz.call(() => playLandingSound('combo', false))
  }

  const plans = root.querySelector('[data-plan-stack]')
  if (plans) {
    // Keep each card and its action still. Draw the rows of ticks down each list.
    const checks = Array.from(plans.querySelectorAll('[data-landing-plan] ul'), list => list.querySelectorAll('svg'))
    const compare = entrance(plans, 'kivora-plans', 'top 91%')
    checks.forEach((ticks, column) => {
      compare.from(ticks, { scale: .6, rotation: -26, duration: .32, stagger: .07, ease: 'back.out(1.6)', clearProps: 'transform' }, column * .15)
    })
  }

  const closing = root.querySelector('#final-title')?.closest('section')
  if (closing) {
    const hello = closing.querySelector('#final-title [lang=en]')
    const possibility = closing.querySelector('#final-title [data-mark]')
    const star = closing.querySelector('[data-spin]')
    const moon = closing.querySelector('[data-float]')
    if (hello && possibility && star && moon) {
      gsap.set(hello, { display: 'inline-block' })
      entrance(closing.querySelector('#final-title')!, 'kivora-final-title')
        .from(hello, { x: -8, yPercent: 15, rotation: -8, transformOrigin: 'left bottom', duration: .48, clearProps: 'transform' }, 0)
        .from(star, { scale: .64, rotation: -70, duration: .9, ease: 'power2.out', clearProps: 'transform' }, 0)
        .from(moon, { x: 24, y: 13, rotation: 16, duration: .75, clearProps: 'transform' }, .06)
        .from(possibility, { scaleX: .9, yPercent: 12, transformOrigin: 'left center', duration: .58, ease: 'back.out(1.1)', clearProps: 'transform' }, .12)
        .fromTo(possibility, { '--paint': 0 }, { '--paint': 1, duration: .55 }, .26)
        .from(closing.querySelector('[data-action-icon] svg'), { x: -4, y: 4, duration: .32, clearProps: 'transform' }, .57)
    }
  }
}

export function setupPlanHover(root: HTMLElement) {
  const cleanups = Array.from(root.querySelectorAll<HTMLElement>('[data-landing-plan]'), card => {
    const heading = card.querySelector('h3')
    const caption = heading?.nextElementSibling
    const hover = gsap.timeline({ paused: true, defaults: { duration: .23, ease: ease.out } })
      .to(heading, { x: 4 }, 0)
    if (caption) hover.to(caption, { y: -3, scale: 1.03 }, 0)
    const sync = () => {
      if (card.matches(':hover, :focus-within')) hover.play()
      else hover.reverse()
    }
    const onBlur = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node && card.contains(event.relatedTarget)) && !card.matches(':hover')) hover.reverse()
    }
    card.addEventListener('pointerenter', sync)
    card.addEventListener('pointerleave', sync)
    card.addEventListener('focusin', sync)
    card.addEventListener('focusout', onBlur)
    return () => {
      card.removeEventListener('pointerenter', sync)
      card.removeEventListener('pointerleave', sync)
      card.removeEventListener('focusin', sync)
      card.removeEventListener('focusout', onBlur)
    }
  })
  return () => cleanups.forEach(clean => clean())
}
