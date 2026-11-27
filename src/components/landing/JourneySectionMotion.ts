import { gsap, SplitText } from '@/lib/gsap'
import { ease } from '@/lib/motion-tokens'

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
  const birds = root.querySelector('[data-hero-birds]')
  if (birds) {
    gsap.to(birds, {
      x: 8, y: -3, duration: 3.6, repeat: -1, yoyo: true, ease: 'sine.inOut',
      scrollTrigger: { trigger: birds, start: 'top bottom', end: 'bottom top', toggleActions: 'play pause resume pause' },
    })
  }

  const rail = root.querySelector('[data-level-rail]')
  if (rail) {
    const stops = rail.querySelectorAll('button > span')
    entrance(rail, 'kivora-level-stops')
      .fromTo(rail, { '--rail-progress': 0 }, { '--rail-progress': 1, duration: .86, ease: 'power1.inOut' }, 0)
      .from(stops, { y: -16, rotation: -9, scale: .84, transformOrigin: '50% 85%', ease: 'back.out(1.45)', stagger: .105, clearProps: 'transform' }, .04)
  }

  const notebook = root.querySelector('[data-practice-notebook]')
  const cover = notebook?.querySelector('[data-notebook-cover]')
  if (notebook && cover) {
    entrance(notebook, 'kivora-practice-desk', 'top 74%')
      .fromTo(cover, { autoAlpha: 1, rotationY: 0 }, {
        rotationY: -102, duration: .9, ease: 'power2.inOut', transformPerspective: 1350,
      })
      .set(cover, { autoAlpha: 0 })
  }

  const footerTop = root.querySelector('#rodape .tpf-top')
  if (footerTop) {
    entrance(footerTop, 'kivora-footer', 'top bottom')
      .from(footerTop, { y: 8, immediateRender: false, clearProps: 'transform' })
  }

  const memory = root.querySelector('#revisoes')
  if (memory) {
    const growth = gsap.timeline({ defaults: { ease: ease.linear }, scrollTrigger: {
      id: 'kivora-memory-growth', trigger: memory, start: 'top 78%', end: 'bottom 65%', scrub: true,
    } })
    growth.from(memory.querySelector('[data-plant]'), { scale: .42, rotation: -8, transformOrigin: '62% 74%', duration: .72 }, 0)
      .fromTo(memory.querySelector('[data-mark]'), { '--paint': 0 }, { '--paint': 1, duration: .48 }, .52)
  }

  const conversation = root.querySelector('#conversacao')
  const phrase = conversation?.querySelector('[data-type]')
  const bubble = phrase?.parentElement
  if (conversation && phrase && bubble) {
    const text = SplitText.create(phrase, { type: 'chars', tag: 'span', aria: 'auto' })
    entrance(bubble, 'kivora-conversation', 'top 89%')
      .from(bubble, { scale: .93, y: 13, rotation: -2, transformOrigin: 'bottom left', duration: .4, ease: 'back.out(1.35)', clearProps: 'transform' }, 0)
      .from(text.chars, { opacity: 0, duration: .01, stagger: .036 }, .12)
      .fromTo(conversation.querySelector('[data-mark]'), { '--paint': 0 }, { '--paint': 1, duration: .5 }, .38)
  }
}
