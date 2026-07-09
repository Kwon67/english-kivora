'use client'

import { ChevronDown } from 'lucide-react'
import { AnimatePresence, m } from 'framer-motion'
import { useState } from 'react'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'

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
    <LandingSectionFrame id="faq" band="default" className="scroll-mt-24 py-20 sm:py-24">
      <RevealOnScroll className="mx-auto max-w-5xl">
        <LandingSectionHeader centered badge="FAQ" title="Tem perguntas? Temos respostas!" />
        <div className="mt-10 border-y border-brand-dark/30">
          {faqs.map((faq, index) => {
            const isOpen = open === index

            return (
              <div
                key={faq.question}
                className={`border-b border-brand-dark/20 transition-colors duration-200 last:border-b-0 ${isOpen ? 'bg-bg-card/75' : ''}`}
              >
                <button
                  id={`faq-trigger-${index}`}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 rounded-[10px] px-3 py-5 text-left font-semibold text-brand-dark transition-colors hover:bg-bg-card sm:px-4"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.div
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={accordionSpring}
                      className="overflow-hidden"
                    >
                      <p className="px-3 pb-6 leading-7 text-brand-secondary sm:px-4">{faq.answer}</p>
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
