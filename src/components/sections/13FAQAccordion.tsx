'use client'

import { ChevronDown } from 'lucide-react'
import { AnimatePresence, m } from 'framer-motion'
import { useState } from 'react'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingSectionTitleClass } from '@/lib/landingTypography'

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

const accordionSpring = { type: 'spring' as const, stiffness: 380, damping: 32 }

export default function FAQAccordion() {
  const [open, setOpen] = useState(0)

  return (
    <LandingSectionFrame id="faq" band="default">
      <RevealOnScroll className="mx-auto max-w-5xl">
        <SectionBadge label="FAQ" className="mx-auto" />
        <h2 className={`mt-8 text-center ${landingSectionTitleClass}`}>
          Tem perguntas? Temos respostas!
        </h2>
        <div data-landing-circuit-target="faq" className="mt-10 border-y border-brand-dark">
          {faqs.map((faq, index) => {
            const isOpen = open === index

            return (
              <div
                key={faq.question}
                className={`border-b border-brand-dark transition-colors duration-200 last:border-b-0 ${isOpen ? 'bg-bg-primary/60' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-1 py-5 text-left font-semibold text-brand-dark"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={accordionSpring}
                      className="overflow-hidden"
                    >
                      <p className="px-1 pb-6 leading-7 text-brand-secondary">{faq.answer}</p>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
