'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, X } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { duration, ease } from '@/lib/motion-tokens'
import { scrollToAnchor, useLandingScroll } from './JourneyMotion'
import LandingWordmark from './LandingWordmark'
import styles from './MindmarketLanding.module.css'


export default function LandingNavigation({ links }: { links: { href: string; label: string }[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const animation = useRef<gsap.core.Timeline | null>(null)
  const closing = useRef(false)
  const [open, setOpen] = useState(false)
  const [pastHeroSignup, setPastHeroSignup] = useState(false)
  const engine = useLandingScroll()
  const afterClose = useRef<(() => void) | undefined>(undefined)
  const router = useRouter()
  const { contextSafe } = useGSAP(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finish = () => { if (query.matches) animation.current?.progress(1) }
    query.addEventListener('change', finish)
    return () => query.removeEventListener('change', finish)
  }, { scope: dialog })

  const close = contextSafe((after?: () => void) => {
    const element = dialog.current
    if (!element?.open || closing.current) return
    closing.current = true
    animation.current?.kill()
    const finish = () => {
      afterClose.current = after
      element.close()
      closing.current = false
      gsap.set(element, { clearProps: 'transform,opacity,--menu-veil' })
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return }
    animation.current = gsap.timeline({ onComplete: finish })
      .to(element.querySelectorAll('[data-menu-item]'), { y: -14, opacity: 0, duration: duration.itemExit, stagger: .018, ease: ease.in }, 0)
      .to(element, { yPercent: -12, opacity: 0, '--menu-veil': 0, duration: duration.menuExit, ease: ease.inOut }, .04)
  })
  const show = contextSafe(() => {
    const element = dialog.current
    if (!element || element.open) return
    animation.current?.kill()
    closing.current = false
    engine.current?.stop()
    element.showModal()
    setOpen(true)
    const items = element.querySelectorAll('[data-menu-item]')
    const lines = element.querySelectorAll('[data-menu-line]')
    gsap.set([element, ...items, ...lines], { clearProps: 'transform,opacity,--menu-veil' })
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    animation.current = gsap.timeline()
      .fromTo(element, { yPercent: -100, '--menu-veil': 0 }, { yPercent: 0, '--menu-veil': 1, duration: duration.menuEnter, ease: ease.title, clearProps: 'transform' })
      .fromTo(items, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: duration.itemEnter, ease: ease.reveal, clearProps: 'transform,opacity' }, .13)
      .fromTo(lines, { scaleX: 0 }, { scaleX: 1, stagger: .05, duration: duration.itemEnter, ease: ease.reveal, clearProps: 'transform' }, .23)
  })

  useEffect(() => {
    const signup = document.getElementById('hero-signup')
    if (!signup) return
    const observer = new IntersectionObserver(([entry]) => {
      setPastHeroSignup(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0)
    })
    observer.observe(signup)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const query = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = () => { if (query.matches) dialog.current?.close() }
    query.addEventListener('change', closeOnDesktop)
    return () => { document.body.style.overflow = previous; query.removeEventListener('change', closeOnDesktop) }
  }, [open])

  function navigate(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    close(() => {
      if (href.startsWith('#') && engine.current && scrollToAnchor(engine.current, href)) return
      router.push(href, { transitionTypes: href === '/login' ? ['kivora-auth'] : undefined })
    })
  }

  return <>
    <header className={styles.header}>
      <nav aria-label="Navegação principal" className={styles.nav}>
        <Link href="/" aria-label="Kivora English, início" className={styles.brand}><LandingWordmark /></Link>
        <div className={styles.navLinks}>{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>
        <div className={styles.navActions}>
          <Link href="/login" transitionTypes={['kivora-auth']} className={styles.login}>Entrar <ArrowUpRight size={15} aria-hidden="true" /></Link>
          <Link href="/register" data-past-hero={pastHeroSignup} className={styles.navCta}>Começar grátis <ArrowUpRight size={17} aria-hidden="true" /></Link>
          <button ref={trigger} className={styles.menuTrigger} aria-label="Abrir menu" aria-expanded={open} aria-controls="kivora-mobile-menu" onClick={show}>Menu <span className={styles.menuGlyph} aria-hidden="true" /></button>
        </div>
      </nav>
    </header>
    <dialog data-lenis-prevent ref={dialog} id="kivora-mobile-menu" aria-labelledby="mobile-menu-title" className={styles.mobileMenu} onKeyDown={event => {
      if (event.key !== 'Tab') return
      // Safari may omit links from its default Tab order; keep the modal cycle explicit.
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')).filter(item => item.tabIndex >= 0 && item.getClientRects().length > 0)
      event.preventDefault()
      if (!items.length) return
      const index = items.indexOf(document.activeElement as HTMLElement)
      items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length]?.focus()
    }} onCancel={event => { event.preventDefault(); close() }} onClose={() => {
      animation.current?.kill()
      setOpen(false)
      trigger.current?.focus({ preventScroll: true })
      engine.current?.start()
      const navigateAfterClose = afterClose.current
      afterClose.current = undefined
      navigateAfterClose?.()
    }} onClick={event => { if (event.target === dialog.current) close() }}>
      <div className={styles.menuInner}>
        <div className={styles.menuTop} data-menu-item><LandingWordmark /><button autoFocus onClick={() => close()} aria-label="Fechar menu"><X size={25} aria-hidden="true" /></button></div>
        <p id="mobile-menu-title" className={styles.eyebrow} data-menu-item>Explorar a Kivora</p>
        <nav aria-label="Navegação no celular" className={styles.mobileLinks}>
          {links.map(link => (
            <Link data-menu-item key={link.href} href={link.href} onClick={event => navigate(event, link.href)}>
              {link.label}<ArrowUpRight size={25} aria-hidden="true" />
              <span className={styles.menuLine} data-menu-line aria-hidden="true" />
            </Link>
          ))}
        </nav>
        <div className={styles.menuBottom} data-menu-item>
          <Link href="/login" transitionTypes={['kivora-auth']} onClick={event => navigate(event, '/login')}>Já tenho uma conta <ArrowRight size={19} aria-hidden="true" /></Link>
          <Link href="/register" onClick={event => navigate(event, '/register')} className={styles.navCta}>
            Começar grátis <span className={styles.menuCtaIcon}><ArrowUpRight size={20} aria-hidden="true" /></span>
          </Link>
        </div>
        <p className={styles.menuNote} data-menu-item>Seu próximo <span lang="en">hello</span> começa aqui.</p>
      </div>
    </dialog>
  </>
}
