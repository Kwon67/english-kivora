'use client'

import { ChevronDown } from 'lucide-react'
import { m } from 'motion/react'
import { useCallback, useState } from 'react'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'

const faqs = [
  {
    question: 'Preciso saber inglês para começar?',
    answer:
      'Não. Você pode começar pelo A1 ou encontrar um ponto de partida compatível com o que já sabe. As trilhas organizam seu caminho do básico ao avançado.',
  },
  {
    question: 'O que torna as revisões inteligentes?',
    answer:
      'Você tenta lembrar antes de ver a resposta e informa como foi. A Kivora usa seu histórico e essa resposta para calcular o próximo intervalo: o que está difícil volta mais cedo; o que está consolidado ganha espaço.',
  },
  {
    question: 'Como funciona o AI Tutor?',
    answer:
      'Escolha uma situação, como pedir um café ou participar de uma entrevista, e converse por voz ou texto. O tutor dá dicas durante a prática. Este recurso está no Pro; a entrada por voz depende do suporte do navegador.',
  },
  {
    question: 'Posso cancelar o Pro quando quiser?',
    answer:
      'Sim, nas configurações da conta. Seu histórico fica salvo.',
  },
  {
    question: 'Funciona no celular?',
    answer:
      'Sim. Use no navegador ou adicione à tela inicial.',
  },
]

export default function FAQAccordion() {
  const [open, setOpen] = useState(-1)
  const reducedMotion = useHydratedReducedMotion()

  const toggle = useCallback((index: number) => {
    setOpen((current) => (current === index ? -1 : index))
  }, [])

  return (
    <LandingSectionFrame id="faq" band="default" className="scroll-mt-24 py-20 sm:py-24">
      <RevealOnScroll className="mx-auto max-w-5xl">
        <LandingSectionHeader centered badge="ANTES DO SEU PRIMEIRO HELLO" title="Vamos tirar suas dúvidas?" />
        <div className="landing-frosted-surface landing-frosted-surface-soft mt-10 overflow-hidden rounded-[20px] border border-brand-dark/30">
          {faqs.map((faq, index) => {
            const isOpen = open === index

            return (
              <div
                key={faq.question}
                className={`border-b border-brand-dark/20 transition-colors duration-200 last:border-b-0 ${isOpen ? 'landing-frosted-subtle' : ''}`}
              >
                <button
                  id={`faq-trigger-${index}`}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 rounded-[13px] px-3 py-5 text-left font-semibold text-brand-dark transition-colors hover:bg-bg-card sm:px-4"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {/* Stays mounted when collapsed: the answers have to be in the server HTML for
                    crawlers to index them and for FAQPage rich results to be eligible. Collapsing
                    is done with height, not by unmounting. */}
                <m.div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${index}`}
                  aria-hidden={!isOpen}
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden [will-change:height,opacity]"
                >
                  <p className="px-3 pb-6 leading-7 text-brand-secondary sm:px-4">{faq.answer}</p>
                </m.div>
              </div>
            )
          })}
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
