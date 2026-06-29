'use client'

import { ChevronDown } from 'lucide-react'
import { AnimatePresence, m } from 'framer-motion'
import { useState } from 'react'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'

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

  return (
    <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-5xl">
        <SectionBadge label="FAQ" className="mx-auto" />
        <h2 className="mt-8 text-center font-heading text-3xl font-bold text-brand-dark sm:text-5xl">
          Tem perguntas? Temos respostas!
        </h2>
        <div className="mt-10 border-y-2 border-brand-dark">
          {faqs.map((faq, index) => (
            <div key={faq.question} className="border-b-2 border-brand-dark last:border-b-0">
              <button
                onClick={() => setOpen(open === index ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left font-semibold text-brand-dark"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 ${open === index ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === index && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 leading-7 text-brand-secondary">{faq.answer}</p>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </RevealOnScroll>
    </section>
  )
}
