import Link from 'next/link'
import { Coffee, Briefcase, Plane, Heart, MessageSquare, Sparkles, ChevronRight } from 'lucide-react'

export const SCENARIOS = [
  {
    id: 'coffee-shop',
    name: 'At the Coffee Shop',
    description: 'Order your favorite drink and a snack in a busy NYC cafe.',
    icon: Coffee,
    color: 'bg-orange-500',
    context: 'A busy Starbucks in Manhattan. The student is a customer, you are the barista.',
    assistantRole: 'Friendly NYC Barista',
    initialMessage: "Hi there! Welcome to Starbucks. What can I get for you today?"
  },
  {
    id: 'job-interview',
    name: 'Job Interview',
    description: 'Practice a technical interview for a Software Engineer position.',
    icon: Briefcase,
    color: 'bg-blue-600',
    context: 'A formal interview at a tech company. The student is the candidate, you are the hiring manager.',
    assistantRole: 'Senior Engineering Manager',
    initialMessage: "Hello! Thanks for coming in today. To start, could you tell me a bit about your experience with React and Node.js?"
  },
  {
    id: 'airport',
    name: 'Airport Check-in',
    description: 'Handle luggage issues and gate changes at Heathrow Airport.',
    icon: Plane,
    color: 'bg-indigo-500',
    context: 'Check-in counter at Heathrow. There is a problem with the student\'s booking.',
    assistantRole: 'Airport Staff',
    initialMessage: "Good morning. I'm afraid I'm having trouble finding your booking in our system. May I see your passport and booking reference again?"
  },
  {
    id: 'first-date',
    name: 'First Date',
    description: 'Casual conversation to get to know someone at a nice restaurant.',
    icon: Heart,
    color: 'bg-pink-500',
    context: 'A cozy Italian restaurant. You are on a first date with the student.',
    assistantRole: 'A friendly and curious date',
    initialMessage: "This place is so nice! I'm glad we decided to come here. Have you been to this restaurant before?"
  }
]

export default function TutorPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-12 animate-fade-in">
      <header className="premium-card p-6 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <MessageSquare className="h-64 w-64 text-[var(--color-primary)]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="stitch-pill bg-[var(--color-primary-container)] text-[var(--color-primary)] font-black uppercase tracking-widest text-[10px]">
              Beta
            </span>
            <p className="section-kicker">Conversação em Tempo Real</p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[var(--color-text)] tracking-tight">
            Tutor de Voz IA
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--color-text-muted)] leading-relaxed">
            Pratique sua fala em situações do dia a dia. Escolha um cenário abaixo e converse naturalmente com nossa IA. Ela corrigirá sua gramática e te ajudará a soar como um nativo.
          </p>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-subtle)]">
              <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
              Powered by Llama 3.3
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-subtle)]">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Processamento instantâneo
            </div>
          </div>
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-8 flex items-center gap-3">
          Escolha seu Cenário
        </h2>
        
        <div className="grid gap-6 sm:grid-cols-2">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon
            return (
              <Link 
                key={scenario.id} 
                href={`/tutor/${scenario.id}`}
                className="group premium-card p-6 flex gap-6 hover:shadow-2xl hover:border-[var(--color-primary)]/40 transition-all duration-300 active:scale-[0.98]"
              >
                <div className={`h-16 w-16 rounded-2xl ${scenario.color} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="h-8 w-8" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                      {scenario.name}
                    </h3>
                    <ChevronRight className="h-5 w-5 text-[var(--color-text-subtle)] group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {scenario.description}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] opacity-60">
                      Nível sugerido: Intermediário
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <footer className="rounded-3xl bg-[var(--color-surface-container-low)] p-8 border border-[var(--color-border)]/40">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="h-16 w-16 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0">
            <Sparkles className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-[var(--color-text)]">Como funciona?</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-2xl">
              Nossa IA falará com você usando vozes naturais. Quando for sua vez, basta falar no microfone. 
              O sistema transcreve sua voz automaticamente e gera a resposta da IA. No final de cada frase, você receberá dicas de gramática se cometer algum erro.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
