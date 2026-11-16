'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Plus, X } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import BrandMark from '@/components/ui/BrandMark'
import LevelExplorer from './LevelExplorer'
import PracticePreview from './PracticePreview'
import styles from './MindmarketLanding.module.css'
import JourneyRibbon from './JourneyRibbon'
import JourneyMotion from './JourneyMotion'
import { ConversationScene, DiscoveryScene, JourneyMotif, MemoryScene } from './JourneyArt'

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
  ['Como funciona o AI Tutor?', 'Escolha uma situação, como pedir um café ou participar de uma entrevista, e converse por voz ou texto. O tutor dá dicas durante a prática. A entrada por voz depende do suporte do navegador.'],
  ['Posso assinar o Pro agora?', 'As novas assinaturas estão indisponíveis. Você pode criar uma conta gratuita e usar as ferramentas de estudo.'],
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
        <div className={styles.navActions}><Link href="/login" className={styles.login}>Entrar <ArrowUpRight size={15} aria-hidden="true" /></Link><Link href="/register" className={styles.navCta}>Começar grátis <ArrowUpRight size={17} aria-hidden="true" /></Link><button ref={trigger} className={styles.menuTrigger} aria-label="Abrir menu" aria-expanded={open} aria-controls="kivora-mobile-menu" onClick={show}><span className={styles.menuGlyph} aria-hidden="true" /></button></div>
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

export default function MindmarketLanding({ riveAssets }: { riveAssets: Partial<Record<'discovery' | 'memory' | 'conversation', string>> }) {
  return <JourneyMotion>
    <Navigation />
    <div className={styles.journey} data-ribbon-journey>
    <JourneyRibbon />
    <main id="main-content">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy} data-hero-copy>
            <Eyebrow>INGLÊS PARA A VIDA ACONTECER</Eyebrow>
            <h1 id="hero-title"><span className={styles.titleClip}><span data-title-line>Seu inglês.</span></span>{' '}<span className={styles.titleClip}><span data-title-line>Um mundo</span></span>{' '}<span className={styles.titleClip}><span data-title-line>mais aberto.</span></span></h1>
            <p className={styles.heroDescription}>Palavras viram conversas.{' '}<br />Pequenas práticas, novas possibilidades.</p>
            <Action>Começar grátis</Action>
            <p className={styles.heroNote}><span /> No seu ritmo. Do primeiro <span lang="en">hello</span> em diante.</p>
          </div>
          <div className={styles.heroVisual} data-hero-parallax>
            <div data-hero-art className={styles.heroArt}><DiscoveryScene riveSrc={riveAssets.discovery} /></div>
            <span className={`${styles.floatingWord} ${styles.hello}`} data-float lang="en">hello, world! <Spark /></span>
            <span className={`${styles.floatingWord} ${styles.discover}`} data-float lang="en">let’s discover <ArrowUpRight size={21} aria-hidden="true" /></span>
          </div>
          <Link href="#seu-caminho" className={styles.scrollHint}><span>Uma nova descoberta a cada dia</span><ArrowDown size={19} aria-hidden="true" /></Link>
        </section>

        <section id="seu-caminho" className={styles.pathSection} aria-labelledby="path-title">
          <div className={styles.sectionIntro} data-reveal><Eyebrow number="01">O MUNDO NÃO TEM LEGENDA</Eyebrow><h2 id="path-title">Mas você pode<br /><span className={styles.softText}>encontrar sua voz.</span></h2><p>Da primeira palavra à conversa que flui.<br />Um caminho de inglês que começa onde você está.</p></div>
          <div className={styles.levelWrap} data-reveal><LevelExplorer /></div>
          <div className={styles.smallManifesto}><span>Seis níveis.</span><span>Muitas descobertas.</span><span>Um caminho seu. <ArrowUpRight size={20} aria-hidden="true" /></span></div>
        </section>

        <section id="como-funciona" className={styles.practiceSection} aria-labelledby="practice-title">
          <div className={styles.storyCardShell}><div className={styles.practiceCopy} data-story-card><Eyebrow number="02">APRENDA COLOCANDO EM PRÁTICA</Eyebrow><h2 id="practice-title">Menos decorar.<br />Mais{' '}<span className={styles.highlightPink}>descobrir.</span></h2><p>É usando o inglês que ele começa a fazer sentido.</p><Link href="#practice-demo" className={styles.textLink}>Experimente <ArrowRight size={22} aria-hidden="true" /></Link></div></div>
          <JourneyMotif kind="plane" className={styles.practiceProp} /><div id="practice-demo" className={styles.demoWrap} data-reveal><span className={styles.demoSticker} aria-hidden="true">sua vez!</span><PracticePreview /></div>
        </section>

      <section id="revisoes" className={styles.memorySection} aria-labelledby="memory-title">
        <div className={styles.memoryArtWrap} data-scene-travel><MemoryScene riveSrc={riveAssets.memory} /><span className={styles.wordTag} data-float lang="en">remember <ArrowUpRight size={20} strokeWidth={1.8} aria-hidden="true" /></span></div>
        <div className={styles.storyCardShell}><div className={styles.memoryCopy} data-story-card><Eyebrow number="03">O QUE VOCÊ APRENDE FICA</Eyebrow><h2 id="memory-title">Uma memória<br />que <span className={styles.highlightYellow}>floresce.</span></h2><p>A revisão espaçada usa suas respostas para trazer cada palavra de volta na hora certa.</p><Link href="/register" className={styles.textLink}>Cultivar meu vocabulário <ArrowUpRight size={22} aria-hidden="true" /></Link></div></div>
        <JourneyMotif kind="spark" className={styles.memoryProp} />
      </section>

      <section id="conversacao" className={styles.conversationSection} aria-labelledby="conversation-title">
        <div className={styles.storyCardShell}><div className={styles.conversationCopy} data-story-card><Eyebrow number="04">DO SEU MUNDO PARA O MUNDO</Eyebrow><h2 id="conversation-title">Uma conversa.<br /><span className={styles.blueText}>Tantas portas.</span></h2><p>Um café. Uma viagem. Uma nova oportunidade. Pratique situações reais por voz ou texto com o tutor de IA.</p><Action>Dar voz ao meu inglês</Action></div></div>
        <div className={styles.conversationVisual} data-scene-travel><ConversationScene riveSrc={riveAssets.conversation} /><div className={styles.conversationBubble} data-float><span lang="en">“I’d like a coffee, please.”</span><small>Seu próximo pedido pode ser em inglês.</small></div></div>
        <JourneyMotif kind="chat" className={styles.conversationProp} />
      </section>

      <section className={styles.blitzBand} data-reveal aria-labelledby="blitz-title"><div><Eyebrow>POUCOS MINUTOS. MUITA ENERGIA.</Eyebrow><h2 id="blitz-title">O seu inglês<br />entra no jogo<span>.</span></h2></div><div className={styles.blitzMark} data-float aria-hidden="true"><svg viewBox="0 0 190 210"><path d="M105 8 20 119h67l-7 83 91-122h-67z" fill="#f5e211" stroke="#2c2e2a" strokeWidth="3"/><path d="m15 43 19 11M156 27l-10 19M168 158l-19-9M30 179l17-13" stroke="#fffdf5" strokeWidth="3" strokeLinecap="round"/></svg><span>BLITZ!</span></div><div className={styles.blitzCopy}><p>Desafios rápidos, combos e ranking semanal. Uma dose de diversão para manter a prática viva.</p><Link href="/register" className={styles.lightLink}>Conhecer o Blitz <ArrowUpRight size={24} aria-hidden="true" /></Link></div></section>

      <section id="precos" className={styles.pricingSection} aria-labelledby="pricing-title"><div className={styles.pricingHeading} data-reveal><Eyebrow>ESPAÇO PARA O SEU PRÓXIMO PASSO</Eyebrow><h2 id="pricing-title">Seu ritmo.<br /><span className={styles.softText}>Seu plano.</span></h2><p>Crie sua conta e use as ferramentas de estudo.</p></div><div className={styles.plans} data-plan-stack>
        <article className={styles.plan} data-landing-plan="standard"><div className={styles.planTop}><h3>Free</h3><span>O primeiro passo</span></div><p className={styles.price}>R$0<span>para sempre</span></p><ul>{['Modos de prática e flashcards', 'Tutor e Blitz com IA', 'Coleções e progresso de estudo', 'Ranking semanal'].map(feature => <li key={feature}><Check size={17} aria-hidden="true" />{feature}</li>)}</ul><Action className={styles.outlineAction}>Começar grátis</Action></article>
        <article className={`${styles.plan} ${styles.proPlan}`} data-landing-plan="featured"><div className={styles.planTop}><h3>Pro<Spark /></h3></div><p className={styles.featureNote}>Novas assinaturas indisponíveis no momento.</p></article>
      </div></section>

      <section id="faq" className={styles.faqSection} aria-labelledby="faq-title"><div><Eyebrow>A CURIOSIDADE É BEM-VINDA</Eyebrow><h2 id="faq-title">Mais alguma<br /><span className={styles.softText}>descoberta?</span></h2><svg className={styles.questionDoodle} viewBox="0 0 130 130" fill="none" aria-hidden="true"><path d="M27 39C19 2 91 1 94 37c3 26-35 24-35 48" stroke="#2c2e2a" strokeWidth="5" strokeLinecap="round"/><circle cx="59" cy="108" r="11" fill="#ff705d"/><path d="m110 32 13-5M13 58l-10 5m99 10 9 9" stroke="#2c2e2a" strokeWidth="3" strokeLinecap="round"/></svg></div><div className={styles.faqList} data-reveal>{faqs.map(([question, answer], index) => <FAQItem key={question} question={question} answer={answer} index={index} />)}</div></section>

      <section className={styles.finalCta} data-reveal aria-labelledby="final-title"><p className={styles.eyebrow}>O PRÓXIMO CAPÍTULO É SEU</p><h2 id="final-title">Um pequeno <span lang="en">hello.</span><br />Um mundo de <span className={styles.finalPossibility}>possibilidades<svg viewBox="0 0 800 34" preserveAspectRatio="none" aria-hidden="true"><path d="M8 24C231 2 548 4 790 18" stroke="#2c2e2a" strokeWidth="5" fill="none" strokeLinecap="round" data-draw-line /></svg></span>.</h2><Action>Começar minha jornada</Action><div className={styles.finalStar} data-float><Spark /></div><div className={styles.finalSpark} data-float><Spark /></div></section>
    </main>
    <footer className={styles.footer}><div className={styles.wordBelt} aria-hidden="true"><div data-word-belt>{[0, 1].map(copy => <div key={copy}><span>hello, world</span><Spark /><span>um mundo mais aberto</span><Spark /></div>)}</div></div><div className={styles.footerTop}><Link href="/" aria-label="Kivora English, início"><Wordmark /></Link><p>Inglês para a vida acontecer.</p><Link href="#hero-title" className={styles.backTop}>Voltar ao início <ArrowUpRight size={21} aria-hidden="true" /></Link></div><div className={styles.footerExplore}>
      <div>
        <h2>Inglês para o seu dia a dia.</h2>
        <p>Pratique com frases reais, volte ao que está aprendendo e ganhe confiança para conversar.</p>
        <Action>Começar grátis</Action>
      </div>
      <nav aria-label="Explore a Kivora">
        {links.map(link => <Link key={link.href} href={link.href}>{link.label}<ArrowUpRight size={18} aria-hidden="true" /></Link>)}
      </nav>
    </div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} Kivora English</span><div><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos de uso</Link><Link href="/login">Entrar</Link></div><span>Feito para quem tem curiosidade.</span></div></footer>
    </div>
  </JourneyMotion>
}
