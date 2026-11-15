'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Headphones, Layers3, MessageCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import MotionSurface from '@/components/motion/MotionSurface'

const modes = [
  { title: 'Fale. Sem travar.', label: 'Conversação', detail: 'Voz ou texto. A conversa é sua.', icon: MessageCircle, className: 'conversation', phrase: 'Let’s talk.', href: '/register' },
  { title: 'Faça ficar.', label: 'Revisão', detail: 'Reveja no momento certo.', icon: Layers3, className: 'revision', phrase: 'Learn. Keep.', href: '/register' },
  { title: 'Entre no ritmo.', label: 'Listening', detail: 'Ouça. Reconheça. Entenda.', icon: Headphones, className: 'listening', phrase: 'Tune in.', href: '/register' },
  { title: 'Teste seu reflexo.', label: 'Blitz', detail: 'Inglês em desafios rápidos.', icon: Zap, className: 'blitz', phrase: 'Ready, go!', href: '/register' },
] as const

export default function HowItWorks() {
  const rail = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [atEnd, setAtEnd] = useState(false)
  useEffect(() => {
    const root = rail.current
    if (!root) return
    const update = () => setAtEnd(root.scrollLeft >= root.scrollWidth - root.clientWidth - 2)
    const observer = new ResizeObserver(update)
    observer.observe(root)
    update()
    return () => observer.disconnect()
  }, [])
  function go(index: number) {
    const root = rail.current
    const card = root?.children[index] as HTMLElement | undefined
    if (!root || !card) return
    root.scrollTo({ left: card.offsetLeft - (root.firstElementChild as HTMLElement).offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  return <section id="como-funciona" className="editorial-section editorial-practice">
    <div id="para-quem" className="editorial-section-heading">
      <div><p className="editorial-eyebrow">Seu jeito de aprender</p><h2>Menos teoria.<br />Mais prática.</h2></div>
      <div className="editorial-rail-controls" aria-label="Controles das práticas">
        <button type="button" aria-label="Prática anterior" disabled={active === 0} onClick={() => go(Math.max(0, active - 1))}><ArrowLeft size={20} /></button>
        <button type="button" aria-label="Próxima prática" disabled={atEnd} onClick={() => go(Math.min(modes.length - 1, active + 1))}><ArrowRight size={20} /></button>
      </div>
    </div>
    <MotionSurface onScroll>
      <div ref={rail} className="editorial-mode-rail" data-contained-carousel role="region" aria-roledescription="carrossel" aria-label="Formas de praticar" tabIndex={0}
        onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); go(Math.max(0, Math.min(modes.length - 1, active + (event.key === 'ArrowRight' ? 1 : -1)))) } }}
        onScroll={() => { const root = rail.current; if (!root) return; setAtEnd(root.scrollLeft >= root.scrollWidth - root.clientWidth - 2); const cardWidth = (root.firstElementChild as HTMLElement).offsetWidth + 20; setActive(Math.min(modes.length - 1, Math.round(root.scrollLeft / cardWidth))) }}>
        {modes.map((mode, index) => <article key={mode.label} className={`editorial-mode ${mode.className}`} aria-label={`${index + 1} de ${modes.length}: ${mode.label}`}>
          <div className="editorial-mode-art" aria-hidden="true"><mode.icon size={30} /><span>{mode.phrase}</span><div className="editorial-mode-lines">{[1,2,3,4,5,6,7,8,9].map(n => <i key={n} style={{height: `${20 + (n * 17 % 60)}%`}} />)}</div></div>
          <div className="editorial-mode-content"><span className="editorial-small">{mode.label}</span><h3>{mode.title}</h3><p>{mode.detail}</p><Link href={mode.href} aria-label={`Começar: ${mode.label}`}><ArrowUpRight size={21} /></Link></div>
        </article>)}
      </div>
    </MotionSurface>
    <p className="editorial-rail-status" aria-live="polite">{String(active + 1).padStart(2, '0')} <span>/ 04</span></p>
  </section>
}
