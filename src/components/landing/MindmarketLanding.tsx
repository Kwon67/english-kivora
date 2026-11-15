'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Menu, Plus, X } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import BrandMark from '@/components/ui/BrandMark'
import LevelExplorer from './LevelExplorer'
import PracticePreview from './PracticePreview'
import styles from './MindmarketLanding.module.css'
import JourneyRibbon from './JourneyRibbon'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const links = [
  { href: '#seu-caminho', label: 'Seu caminho' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#precos', label: 'Planos' },
  { href: '#faq', label: 'Dúvidas' },
]

const faqs = [
  ['Preciso saber inglês para começar?', 'Não. Você pode começar pelo A1 ou encontrar um ponto de partida compatível com o que já sabe. As trilhas organizam seu caminho do básico ao avançado.'],
  ['O que torna as revisões inteligentes?', 'Você tenta lembrar antes de ver a resposta e informa como foi. A Kivora usa seu histórico e essa resposta para calcular o próximo intervalo: o que está difícil volta mais cedo; o que está consolidado ganha espaço.'],
  ['Como funciona o AI Tutor?', 'Escolha uma situação, como pedir um café ou participar de uma entrevista, e converse por voz ou texto. O tutor dá dicas durante a prática. Este recurso está no Pro; a entrada por voz depende do suporte do navegador.'],
  ['Posso cancelar o Pro quando quiser?', 'Sim, nas configurações da conta. Seu histórico fica salvo.'],
  ['Funciona no celular?', 'Sim. Use no navegador ou adicione à tela inicial para ter a Kivora sempre por perto.'],
]

function Spark({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 80 80" fill="currentColor" aria-hidden="true"><path d="m35 2 10 0 2 25 19-16 7 8-19 17 25 0 0 11-25-1 17 18-8 8-18-19-1 25-11-1 1-25-19 17-7-8 20-17-26-1 1-11 25 2-17-19 8-7 17 19z" /></svg>
}

function Wordmark({ light = false }: { light?: boolean }) {
  return <BrandMark showSubtitle={false} tone={light ? 'light' : 'default'} className={styles.sharedBrand} />
}

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const root = useRef<HTMLDetailsElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const animation = useRef<gsap.core.Tween | null>(null)
  const desiredOpen = useRef(false)
  const { contextSafe } = useGSAP(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finish = () => { if (query.matches) animation.current?.progress(1) }
    query.addEventListener('change', finish)
    return () => query.removeEventListener('change', finish)
  }, { scope: root })
  const toggle = contextSafe((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault()
    const details = root.current
    const content = panel.current
    if (!details || !content) return
    animation.current?.kill()
    desiredOpen.current = !desiredOpen.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      details.open = desiredOpen.current
      gsap.set(content, { clearProps: 'height,opacity,overflow' })
      return
    }
    const opening = desiredOpen.current
    if (opening && !details.open) {
      details.open = true
      gsap.set(content, { height: 0, opacity: 0, overflow: 'hidden' })
    }
    animation.current = gsap.to(content, {
      height: opening ? content.scrollHeight : 0,
      opacity: opening ? 1 : 0,
      overflow: 'hidden',
      duration: .4,
      ease: 'power2.inOut',
      onComplete: () => { details.open = opening; gsap.set(content, { clearProps: 'height,opacity,overflow' }) },
    })
  })
  return <details ref={root} className={styles.faqItem}><summary onClick={toggle}><span><small>0{index + 1}</small>{question}</span><Plus size={23} aria-hidden="true" /></summary><div ref={panel}><p>{answer}</p></div></details>
}

function Action({ href = '/register', children, className = '' }: { href?: string; children: React.ReactNode; className?: string }) {
  return <Link href={href} className={`${styles.action} ${className}`}><span>{children}</span><span className={styles.actionIcon}><ArrowUpRight size={22} strokeWidth={1.8} aria-hidden="true" /></span></Link>
}

function Eyebrow({ number, children }: { number?: string; children: React.ReactNode }) {
  return <p className={styles.eyebrow}>{number && <span>{number}</span>}{children}</p>
}

function Navigation() {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const animation = useRef<gsap.core.Timeline | null>(null)
  const closing = useRef(false)
  const [open, setOpen] = useState(false)
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
      element.close()
      closing.current = false
      gsap.set(element, { clearProps: 'transform,opacity,--menu-veil' })
      after?.()
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return }
    animation.current = gsap.timeline({ onComplete: finish })
      .to(element.querySelectorAll('[data-menu-item]'), { y: -14, opacity: 0, duration: .18, stagger: .018, ease: 'power2.in' }, 0)
      .to(element, { yPercent: -12, opacity: 0, '--menu-veil': 0, duration: .32, ease: 'power2.inOut' }, .04)
  })
  const show = contextSafe(() => {
    const element = dialog.current
    if (!element) return
    animation.current?.kill()
    closing.current = false
    element.showModal()
    setOpen(true)
    const items = element.querySelectorAll('[data-menu-item]')
    gsap.set([element, ...items], { clearProps: 'transform,opacity' })
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    animation.current = gsap.timeline()
      .fromTo(element, { yPercent: -100, '--menu-veil': 0 }, { yPercent: 0, '--menu-veil': 1, duration: .66, ease: 'power4.out', clearProps: 'transform' })
      .fromTo(items, { y: 36, opacity: 0 }, { y: 0, opacity: 1, stagger: .065, duration: .46, ease: 'power3.out', clearProps: 'transform,opacity' }, .18)
  })

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
    close(() => router.push(href))
  }

  return <>
    <header className={styles.header}>
      <nav aria-label="Navegação principal" className={styles.nav}>
        <Link href="/" aria-label="Kivora English, início" className={styles.brand}><Wordmark /></Link>
        <div className={styles.navLinks}>{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>
        <div className={styles.navActions}><Link href="/login" className={styles.login}>Entrar <ArrowUpRight size={15} aria-hidden="true" /></Link><Link href="/register" className={styles.navCta}>Começar grátis <ArrowUpRight size={17} aria-hidden="true" /></Link><button ref={trigger} className={styles.menuTrigger} aria-label="Abrir menu" aria-expanded={open} aria-controls="kivora-mobile-menu" onClick={show}><Menu size={23} aria-hidden="true" /></button></div>
      </nav>
    </header>
    <dialog ref={dialog} id="kivora-mobile-menu" aria-labelledby="mobile-menu-title" className={styles.mobileMenu} onKeyDown={event => {
      if (event.key !== 'Tab') return
      // Safari may omit links from its default Tab order; keep the modal cycle explicit.
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')).filter(item => item.tabIndex >= 0 && item.getClientRects().length > 0)
      event.preventDefault()
      if (!items.length) return
      const index = items.indexOf(document.activeElement as HTMLElement)
      items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length]?.focus()
    }} onCancel={event => { event.preventDefault(); close() }} onClose={() => { animation.current?.kill(); setOpen(false); trigger.current?.focus({ preventScroll: true }) }} onClick={event => { if (event.target === dialog.current) close() }}>
      <div className={styles.menuInner}>
        <div className={styles.menuTop}><Wordmark /><button autoFocus onClick={() => close()} aria-label="Fechar menu"><X size={25} aria-hidden="true" /></button></div>
        <p id="mobile-menu-title" className={styles.eyebrow} data-menu-item>UM MUNDO PARA DESCOBRIR</p>
        <nav aria-label="Navegação no celular" className={styles.mobileLinks}>{links.map((link, index) => <Link data-menu-item key={link.href} href={link.href} onClick={event => navigate(event, link.href)}><small>0{index + 1}</small>{link.label}<ArrowUpRight size={25} aria-hidden="true" /></Link>)}</nav>
        <div className={styles.menuBottom} data-menu-item><Link href="/login" onClick={event => navigate(event, '/login')}>Já tenho uma conta <ArrowRight size={19} aria-hidden="true" /></Link><Link href="/register" onClick={event => navigate(event, '/register')} className={styles.navCta}>Começar grátis <ArrowUpRight size={21} aria-hidden="true" /></Link></div>
        <p className={styles.menuNote} data-menu-item>Seu próximo <span lang="en">hello</span> começa aqui.</p>
      </div>
    </dialog>
  </>
}

function MotionJourney({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const observers: IntersectionObserver[] = []
      const loops: { tween: gsap.core.Tween; visible: boolean }[] = []
      gsap.utils.toArray<HTMLElement>('[data-reveal]', root.current).forEach(element => {
        gsap.from(element, { y: 48, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true }, clearProps: 'transform,opacity' })
      })
      gsap.from('[data-hero-copy] > *', { y: 46, opacity: 0, stagger: .09, duration: .95, ease: 'power3.out', clearProps: 'transform,opacity' })
      gsap.from('[data-hero-art]', { scale: .92, y: 32, opacity: 0, duration: 1.1, delay: .2, ease: 'power3.out', clearProps: 'transform,opacity' })
      gsap.utils.toArray<HTMLElement>('[data-float]', root.current).forEach((element, index) => {
        const isScene = element.hasAttribute('data-hero-scene')
        const tween = gsap.to(element, { y: isScene ? -5 : index % 2 ? 13 : -15, rotation: isScene ? .35 : index % 2 ? 3 : -3, duration: isScene ? 4 : 2.8 + index * .25, yoyo: true, repeat: -1, ease: 'sine.inOut', paused: true })
        const loop = { tween, visible: false }
        loops.push(loop)
        const observer = new IntersectionObserver(entries => { loop.visible = entries[0].isIntersecting; if (loop.visible && !document.hidden) tween.play(); else tween.pause() }, { threshold: .1 })
        observer.observe(element); observers.push(observer)
      })
      const visibility = () => loops.forEach(loop => { if (loop.visible && !document.hidden) loop.tween.play(); else loop.tween.pause() })
      document.addEventListener('visibilitychange', visibility)
      return () => { observers.forEach(observer => observer.disconnect()); document.removeEventListener('visibilitychange', visibility); loops.forEach(loop => loop.tween.kill()) }
    })
    return () => media.revert()
  }, { scope: root })

  return <div ref={root} className={styles.page}>{children}</div>
}

export default function MindmarketLanding() {
  return <MotionJourney>
    <Navigation />
    <div className={styles.journey} data-ribbon-journey>
    <JourneyRibbon />
    <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy} data-hero-copy>
            <Eyebrow>INGLÊS PARA A VIDA ACONTECER</Eyebrow>
            <h1 id="hero-title">Seu inglês.{' '}<br />Um mundo<br /><span className={styles.underlined}>mais aberto.<svg viewBox="0 0 570 28" preserveAspectRatio="none" aria-hidden="true"><path d="M5 18C140 3 348 3 562 15M30 26C220 13 391 14 541 22" fill="none" stroke="#8ed462" strokeWidth="7" strokeLinecap="round" /></svg></span></h1>
            <p className={styles.heroDescription}>Palavras viram conversas.{' '}<br />Pequenas práticas, novas possibilidades.</p>
            <Action>Começar grátis</Action>
            <p className={styles.heroNote}><span /> No seu ritmo. Do primeiro <span lang="en">hello</span> em diante.</p>
          </div>
          <div className={styles.heroVisual}>
            <div data-hero-art className={styles.heroArt} role="img" aria-label="Duas pessoas exploram um globo: uma aponta para o mapa enquanto a outra segura um livro.">
              <div data-hero-scene data-float className={styles.heroScene}><Image src="/images/mindmarket/discovery.png" alt="" aria-hidden="true" width={1536} height={1024} loading="eager" fetchPriority="high" unoptimized /></div>
            </div>
            <span className={`${styles.floatingWord} ${styles.hello}`} data-float lang="en">hello, world! <Spark /></span>
            <span className={`${styles.floatingWord} ${styles.discover}`} data-float lang="en">let’s discover <ArrowUpRight size={21} aria-hidden="true" /></span>
            <span className={styles.artCaption}>UM POUCO DE CURIOSIDADE LEVA LONGE.</span>
          </div>
          <Link href="#seu-caminho" className={styles.scrollHint}><span>Uma nova descoberta a cada dia</span><ArrowDown size={19} aria-hidden="true" /></Link>
        </section>

        <section id="seu-caminho" className={styles.pathSection} aria-labelledby="path-title">
          <div className={styles.sectionIntro} data-reveal><Eyebrow number="01">O MUNDO NÃO TEM LEGENDA</Eyebrow><h2 id="path-title">Mas você pode<br /><span className={styles.softText}>encontrar sua voz.</span></h2><p>Da primeira palavra à conversa que flui.<br />Um caminho de inglês que começa onde você está.</p></div>
          <div className={styles.levelWrap} data-reveal><LevelExplorer /></div>
          <div className={styles.smallManifesto}><span>Seis níveis.</span><span>Muitas descobertas.</span><span>Um caminho seu. <ArrowUpRight size={20} aria-hidden="true" /></span></div>
        </section>

        <section id="como-funciona" className={styles.practiceSection} aria-labelledby="practice-title">
          <div className={styles.practiceCopy} data-reveal><Eyebrow number="02">APRENDA COLOCANDO EM PRÁTICA</Eyebrow><h2 id="practice-title">Menos decorar.<br />Mais{' '}<span className={styles.highlightPink}>descobrir.</span></h2><p>É usando o inglês que ele começa a fazer sentido.</p><Link href="#practice-demo" className={styles.textLink}>Experimente <ArrowRight size={22} aria-hidden="true" /></Link></div>
          <div id="practice-demo" className={styles.demoWrap} data-reveal><span className={styles.demoSticker} aria-hidden="true">sua vez!</span><PracticePreview /></div>
        </section>

      <section id="revisoes" className={styles.memorySection} aria-labelledby="memory-title">
        <div className={styles.memoryArtWrap} data-reveal><span className={styles.sketchLabel}>Plante uma palavra.<br />Deixe uma ideia crescer.</span><Image src="/images/mindmarket/memory.png" alt="Uma estudante rega uma planta ao lado de um livro aberto e cartões de vocabulário." width={1536} height={1024} unoptimized className={styles.sceneArt} /><span className={styles.wordTag} lang="en">remember <ArrowUpRight size={20} strokeWidth={1.8} aria-hidden="true" /></span></div>
        <div className={styles.memoryCopy} data-reveal><Eyebrow number="03">O QUE VOCÊ APRENDE FICA</Eyebrow><h2 id="memory-title">Uma memória<br />que <span className={styles.highlightYellow}>floresce.</span></h2><p>A revisão espaçada usa suas respostas para trazer cada palavra de volta na hora certa.</p><Link href="/register" className={styles.textLink}>Cultivar meu vocabulário <ArrowUpRight size={22} aria-hidden="true" /></Link></div>
      </section>

      <section id="conversacao" className={styles.conversationSection} aria-labelledby="conversation-title">
        <div className={styles.conversationCopy} data-reveal><Eyebrow number="04">DO SEU MUNDO PARA O MUNDO</Eyebrow><h2 id="conversation-title">Uma conversa.<br /><span className={styles.blueText}>Tantas portas.</span></h2><p>Um café. Uma viagem. Uma nova oportunidade. Pratique situações reais por voz ou texto com o tutor de IA.</p><Action href="/register?plan=pro">Dar voz ao meu inglês</Action><p className={styles.featureNote}>Tutor de IA disponível no plano Pro.</p></div>
        <div className={styles.conversationVisual} data-reveal><Image src="/images/mindmarket/conversation.png" alt="Duas pessoas conversam tomando café à mesa." width={1536} height={1024} unoptimized className={styles.sceneArt} /><div className={styles.conversationBubble}><span lang="en">“I’d like a coffee, please.”</span><small>Seu próximo pedido pode ser em inglês.</small></div></div>
      </section>

      <section className={styles.blitzBand} data-reveal aria-labelledby="blitz-title"><div><Eyebrow>POUCOS MINUTOS. MUITA ENERGIA.</Eyebrow><h2 id="blitz-title">O seu inglês<br />entra no jogo<span>.</span></h2></div><div className={styles.blitzMark} aria-hidden="true"><svg viewBox="0 0 190 210"><path d="M105 8 20 119h67l-7 83 91-122h-67z" fill="#f5e211" stroke="#2c2e2a" strokeWidth="3"/><path d="m15 43 19 11M156 27l-10 19M168 158l-19-9M30 179l17-13" stroke="#fffdf5" strokeWidth="3" strokeLinecap="round"/></svg><span>BLITZ!</span></div><div className={styles.blitzCopy}><p>Desafios rápidos, combos e ranking semanal. Uma dose de diversão para manter a prática viva.</p><Link href="/register" className={styles.lightLink}>Conhecer o Blitz <ArrowUpRight size={24} aria-hidden="true" /></Link></div></section>

      <section id="precos" className={styles.pricingSection} aria-labelledby="pricing-title"><div className={styles.pricingHeading} data-reveal><Eyebrow>ESPAÇO PARA O SEU PRÓXIMO PASSO</Eyebrow><h2 id="pricing-title">Seu ritmo.<br /><span className={styles.softText}>Seu plano.</span></h2><p>Comece com o essencial.<br />Abra mais possibilidades quando quiser.</p></div><div className={styles.plans}>
        <article className={styles.plan} data-reveal data-landing-plan="standard"><div className={styles.planTop}><h3>Free</h3><span>O primeiro passo</span></div><p className={styles.price}>R$0<span>para sempre</span></p><ul>{['Modos básicos de prática', 'Flashcards com SRS', 'Ranking semanal', 'Sessões diárias'].map(feature => <li key={feature}><Check size={17} aria-hidden="true" />{feature}</li>)}</ul><Action className={styles.outlineAction}>Começar grátis</Action></article>
        <article className={`${styles.plan} ${styles.proPlan}`} data-reveal data-landing-plan="featured"><div className={styles.planTop}><h3>Pro<Spark /></h3><span>Mais possibilidades</span></div><p className={styles.price}>R$29,90<span>por mês</span></p><ul>{['Sessões ilimitadas', 'Tutor de IA avançado', 'Todos os modos de prática', 'Blitz padrão e Blitz IA', 'Progresso detalhado', 'Sem anúncios'].map(feature => <li key={feature}><Check size={17} aria-hidden="true" />{feature}</li>)}</ul><Action href="/register?plan=pro">Assinar Pro</Action></article>
      </div></section>

      <section id="faq" className={styles.faqSection} aria-labelledby="faq-title"><div><Eyebrow>A CURIOSIDADE É BEM-VINDA</Eyebrow><h2 id="faq-title">Mais alguma<br /><span className={styles.softText}>descoberta?</span></h2><svg className={styles.questionDoodle} viewBox="0 0 130 130" fill="none" aria-hidden="true"><path d="M27 39C19 2 91 1 94 37c3 26-35 24-35 48" stroke="#2c2e2a" strokeWidth="5" strokeLinecap="round"/><circle cx="59" cy="108" r="11" fill="#ff705d"/><path d="m110 32 13-5M13 58l-10 5m99 10 9 9" stroke="#2c2e2a" strokeWidth="3" strokeLinecap="round"/></svg></div><div className={styles.faqList} data-reveal>{faqs.map(([question, answer], index) => <FAQItem key={question} question={question} answer={answer} index={index} />)}</div></section>

      <section className={styles.finalCta} data-reveal aria-labelledby="final-title"><p className={styles.eyebrow}>O PRÓXIMO CAPÍTULO É SEU</p><h2 id="final-title">Um pequeno <span lang="en">hello.</span><br />Um mundo de <span className={styles.finalPossibility}>possibilidades<svg viewBox="0 0 800 34" preserveAspectRatio="none" aria-hidden="true"><path d="M8 24C231 2 548 4 790 18" stroke="#2c2e2a" strokeWidth="5" fill="none" strokeLinecap="round" /></svg></span>.</h2><Action>Começar minha jornada</Action><Spark className={styles.finalStar} /><Spark className={styles.finalSpark} /></section>
    </main>
    <footer className={styles.footer}><div className={styles.footerTop}><Link href="/" aria-label="Kivora English, início"><Wordmark light /></Link><p>Inglês para a vida acontecer.</p><Link href="#hero-title" className={styles.backTop}>Voltar ao início <ArrowUpRight size={21} aria-hidden="true" /></Link></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} Kivora English</span><div><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos de uso</Link><Link href="/login">Entrar</Link></div><span>Feito para quem tem curiosidade.</span></div></footer>
    </div>
  </MotionJourney>
}
