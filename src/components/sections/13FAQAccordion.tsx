'use client'

import { ChevronDown } from 'lucide-react'
import { m } from 'framer-motion'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'

const faqs = [
  {
    question: 'Preciso saber inglês para começar?',
    answer:
      'Não. O Kivora começa no seu nível atual e adapta vocabulário, velocidade e dificuldade. Você pode iniciar do zero com frases úteis e revisão diária.',
  },
  {
    question: 'Como funciona o AI Tutor?',
    answer:
      'Você conversa por texto ou voz e recebe correções em tempo real. O tutor registra erros recorrentes e transforma isso em próximas missões.',
  },
  {
    question: 'Posso cancelar o Pro quando quiser?',
    answer:
      'Sim. O plano Pro pode ser cancelado a qualquer momento, sem multa. Seu histórico continua salvo na conta.',
  },
  {
    question: 'Funciona no celular?',
    answer:
      'Sim. A experiência web é responsiva e funciona no navegador do celular. O app mobile dedicado está no nosso roadmap.',
  },
]

export default function FAQAccordion() {
  const [open, setOpen] = useState(0)
  const openRef = useRef(0)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const previousRowRects = useRef<DOMRect[]>([])
  const rowAnimations = useRef<Animation[]>([])
  const reducedMotion = useHydratedReducedMotion()

  const toggle = useCallback((index: number) => {
    const nextOpen = openRef.current === index ? -1 : index
    previousRowRects.current = rowRefs.current.map((row) => row?.getBoundingClientRect() ?? new DOMRect())
    openRef.current = nextOpen
    setOpen(nextOpen)
  }, [])

  useLayoutEffect(() => {
    const previousRects = previousRowRects.current
    if (!previousRects.length || reducedMotion) return

    rowAnimations.current.forEach((animation) => animation.cancel())
    rowAnimations.current = rowRefs.current.flatMap((row, index) => {
      if (!row) return []

      const offsetY = previousRects[index].top - row.getBoundingClientRect().top
      if (Math.abs(offsetY) < 1) return []

      return row.animate(
        [
          { transform: `translate3d(0, ${offsetY}px, 0)` },
          { transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      )
    })
    previousRowRects.current = []
  }, [open, reducedMotion])

  return (
    <LandingSectionFrame id="faq" band="default" className="scroll-mt-24 py-20 sm:py-24">
      <RevealOnScroll className="mx-auto max-w-5xl">
        <LandingSectionHeader centered badge="FAQ" title="Tem perguntas? Temos respostas!" />
        <div className="mt-10 border-y border-brand-dark/30">
          {faqs.map((faq, index) => {
            const isOpen = open === index

            return (
              <div
                key={faq.question}
                ref={(element) => {
                  rowRefs.current[index] = element
                }}
                className={`border-b border-brand-dark/20 transition-colors duration-200 [will-change:transform] last:border-b-0 ${isOpen ? 'bg-bg-card/75' : ''}`}
              >
                <button
                  id={`faq-trigger-${index}`}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 rounded-[10px] px-3 py-5 text-left font-semibold text-brand-dark transition-colors hover:bg-bg-card sm:px-4"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen ? (
                  <m.div
                    id={`faq-panel-${index}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${index}`}
                    initial={reducedMotion ? false : { clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
                    animate={{ clipPath: 'inset(0 0 0% 0)', opacity: 1 }}
                    transition={{ duration: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
                    className="[contain:layout_paint] [will-change:clip-path,opacity]"
                  >
                    <p className="px-3 pb-6 leading-7 text-brand-secondary sm:px-4">{faq.answer}</p>
                  </m.div>
                ) : null}
              </div>
            )
          })}
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
