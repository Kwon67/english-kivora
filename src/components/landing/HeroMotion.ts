import { gsap, SplitText } from '@/lib/gsap'

function animateHeadline(container: HTMLElement, onComplete: () => void) {
  const select = gsap.utils.selector(container)
  const lines = select('#hero-title [data-title-line]')
  const letters = select('[data-hero-letters]')[0]
  if (!letters || lines.length !== 3) return

  const first = SplitText.create(lines[0], { type: 'words', tag: 'span', aria: 'none' })
  const world = SplitText.create(lines[1], { type: 'chars', tag: 'span', aria: 'none' })
  const word = SplitText.create(letters, { type: 'chars', tag: 'span', aria: 'none' })
  const center = (word.chars.length - 1) / 2
  const intro = gsap.timeline({
    id: 'kivora-hero-intro',
    defaults: { ease: 'power3.out', clearProps: 'transform' },
    onComplete: () => { first.revert(); world.revert(); word.revert(); onComplete() },
  })
  intro.addLabel('world', .22).addLabel('open', .63)
    .from(first.words, {
      scaleX: .68, scaleY: 1.38, rotation: i => i ? 7 : -8,
      transformOrigin: '50% 82%', stagger: .075,
      duration: .52, ease: 'back.out(1.8)',
    }, 0)
    .from(world.chars, {
      rotationX: -84, transformPerspective: 440, transformOrigin: '50% 74%',
      stagger: .042, duration: .61, ease: 'back.out(1.25)',
    }, 'world')
    // Fold the letters inward, then fan them out from the middle of the word.
    .from(word.chars, {
      x: index => `${(center - index) * .27}em`,
      rotation: index => (index - center) * -10,
      scaleX: .56, scaleY: .8, transformOrigin: '50% 95%',
      stagger: { from: 'center', amount: .21 }, duration: .68, ease: 'back.out(1.35)',
    }, 'open')
    .from(select('[data-hero-underline]'), { scaleX: 0, duration: .53, ease: 'power3.inOut' }, .99)
    .from(select('[data-hero-art]'), {
      scale: .86, transformOrigin: '51% 51%', duration: 1.30,
      ease: 'power2.inOut', clearProps: 'transform,transformOrigin',
    }, 'world')
    .from(select('[data-hero-description]'), { y: 7, duration: .43 }, .57)
    .from(select('[data-hero-copy] [data-action-icon] svg, [data-hero-dock] [data-action-icon] svg'), {
      x: -4, y: 4, duration: .36,
    }, .79)

  return intro
}

export function setupHeroMotion(container: HTMLElement) {
  const title = container.querySelector('#hero-title')
  const replay = container.querySelector<HTMLButtonElement>('[data-replay-title]')
  const toggle = container.querySelector<HTMLButtonElement>('[data-pause-title]')
  if (!title || !replay || !toggle) return
  const welcome = container.querySelector<HTMLElement>('#kivora-intro')
  let visible = false
  let playback: gsap.Context | undefined
  let timeline: gsap.core.Timeline | undefined

  let paused = false

  function updateControl() {
    toggle!.setAttribute('aria-pressed', String(paused))
  }
  function play() {
    playback?.revert()
    paused = false
    updateControl()
    playback = gsap.context(() => {
      // This second timeline acts on the intact lines after SplitText restores the text.
      const lines = container.querySelectorAll('#hero-title [data-title-line]')
      const keyword = container.querySelector('[data-hero-keyword]')
      const wave = gsap.timeline({
        paused: true, repeat: -1, repeatDelay: 1.1,
        defaults: { ease: 'sine.inOut', repeat: 1, yoyo: true },
      })
        .to(lines[0], { scaleX: .93, rotation: -2, skewX: -4, duration: .42 }, 0)
        .to(lines[1], { rotationX: 38, transformPerspective: 440, duration: .48 }, .24)
        .to(keyword, { scaleX: 1.10, rotation: -4, duration: .52 }, .52)
      timeline = animateHeadline(container, () => {
        timeline = wave
        sync()
      })
    }, container)
  }
  function sync() {
    if (paused || document.hidden || !visible || welcome?.dataset.intro) {
      timeline?.pause()
    } else if (timeline) {
      timeline.resume()
    } else {
      play()
    }
  }
  function toggleMotion() {
    if (paused) {
      play()
    } else {
      paused = true
      playback?.revert()
      timeline = undefined
      playback = undefined
      updateControl()
    }
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    sync()
  })
  observer.observe(title)
  welcome?.addEventListener('kivora-intro-finished', sync)
  document.addEventListener('visibilitychange', sync)
  replay.addEventListener('click', play)
  toggle.addEventListener('click', toggleMotion)
  toggle.hidden = false
  replay.hidden = false
  return () => {
    observer.disconnect()
    welcome?.removeEventListener('kivora-intro-finished', sync)
    document.removeEventListener('visibilitychange', sync)
    replay.removeEventListener('click', play)
    toggle.removeEventListener('click', toggleMotion)
    toggle.hidden = true
    toggle.removeAttribute('aria-pressed')
    replay.hidden = true
    playback?.revert()
  }
}
