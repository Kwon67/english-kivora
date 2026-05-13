import Link from 'next/link'
import Image from 'next/image'
import {
  Briefcase,
  ChevronRight,
  Coffee,
  Heart,
  Mic,
  Plane,
  Sparkles,
  Volume2,
} from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

export const SCENARIOS = [
  {
    id: 'coffee-shop',
    name: 'At the Coffee Shop',
    description: 'Order your favorite drink and a snack in a busy NYC cafe.',
    icon: Coffee,
    color: 'bg-[#c65f2f]',
    level: 'A2-B1',
    duration: '5 min',
    focus: 'Pedidos e preferências',
    context: 'A busy Starbucks in Manhattan. The student is a customer, you are the barista.',
    assistantRole: 'Friendly NYC Barista',
    initialMessage: "Hi there! Welcome to Starbucks. What can I get for you today?"
  },
  {
    id: 'job-interview',
    name: 'Job Interview',
    description: 'Practice a technical interview for a Software Engineer position.',
    icon: Briefcase,
    color: 'bg-[#315c88]',
    level: 'B1-B2',
    duration: '8 min',
    focus: 'Experiência profissional',
    context: 'A formal interview at a tech company. The student is the candidate, you are the hiring manager.',
    assistantRole: 'Senior Engineering Manager',
    initialMessage: "Hello! Thanks for coming in today. To start, could you tell me a bit about your experience with React and Node.js?"
  },
  {
    id: 'airport',
    name: 'Airport Check-in',
    description: 'Handle luggage issues and gate changes at Heathrow Airport.',
    icon: Plane,
    color: 'bg-[#5a587f]',
    level: 'B1',
    duration: '6 min',
    focus: 'Problemas de viagem',
    context: 'Check-in counter at Heathrow. There is a problem with the student\'s booking.',
    assistantRole: 'Airport Staff',
    initialMessage: "Good morning. I'm afraid I'm having trouble finding your booking in our system. May I see your passport and booking reference again?"
  },
  {
    id: 'first-date',
    name: 'First Date',
    description: 'Casual conversation to get to know someone at a nice restaurant.',
    icon: Heart,
    color: 'bg-[#a44f6f]',
    level: 'A2-B1',
    duration: '7 min',
    focus: 'Small talk natural',
    context: 'A cozy Italian restaurant. You are on a first date with the student.',
    assistantRole: 'A friendly and curious date',
    initialMessage: "This place is so nice! I'm glad we decided to come here. Have you been to this restaurant before?"
  }
]

export default function TutorPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
      <header className="premium-card relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="stitch-pill bg-[var(--color-primary-container)] text-[var(--color-primary)]">
                Beta
              </span>
              <p className="section-kicker">Conversação guiada</p>
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl">
              Tutor de Voz IA
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              Pratique inglês em cenas curtas com resposta por voz, correção contextual e ritmo de conversa real.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1rem] bg-[var(--color-surface-container-low)] px-4 py-3">
                <Mic className="h-4 w-4 text-[var(--color-primary)]" />
                <p className="mt-2 text-sm font-black text-[var(--color-text)]">Voz ativa</p>
                <p className="mt-1 text-xs text-[var(--color-text-subtle)]">Reconhecimento em inglês</p>
              </div>
              <div className="rounded-[1rem] bg-[var(--color-surface-container-low)] px-4 py-3">
                <Volume2 className="h-4 w-4 text-[var(--color-primary)]" />
                <p className="mt-2 text-sm font-black text-[var(--color-text)]">Resposta falada</p>
                <p className="mt-1 text-xs text-[var(--color-text-subtle)]">Áudio natural por turno</p>
              </div>
              <div className="rounded-[1rem] bg-[var(--color-surface-container-low)] px-4 py-3">
                <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
                <p className="mt-2 text-sm font-black text-[var(--color-text)]">Dicas rápidas</p>
                <p className="mt-1 text-xs text-[var(--color-text-subtle)]">Correções sem interromper</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-sm items-center justify-center rounded-[1.75rem] bg-[var(--color-surface-container-low)] p-5">
            <Image
              src="/images/home/undraw-online-learning.svg"
              alt="Ilustração unDraw de conversa online em inglês"
              width={692}
              height={500}
              unoptimized
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </header>

      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Cenários</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Escolha uma conversa</h2>
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-subtle)]">
            {SCENARIOS.length} modos disponíveis
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SCENARIOS.map((scenario) => {
            const Icon = scenario.icon
            return (
              <Link
                key={scenario.id}
                href={`/tutor/${scenario.id}`}
                transitionTypes={navForwardTransitionTypes}
                className="group premium-card relative flex min-h-52 flex-col overflow-hidden p-5 transition-all hover:border-[var(--color-primary)]/40 hover:shadow-[var(--shadow-xl)] active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] ${scenario.color} text-white shadow-lg`}>
                    <Icon className="h-7 w-7" strokeWidth={2.2} />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className="stitch-pill bg-[var(--color-surface-container-low)] text-[var(--color-text-subtle)]">
                      {scenario.level}
                    </span>
                    <span className="stitch-pill bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                      {scenario.duration}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex-1">
                  <h3 className="text-xl font-extrabold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                    {scenario.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {scenario.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--color-border)]/35 pt-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
                      Foco
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{scenario.focus}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-container-low)] text-[var(--color-primary)] transition-transform group-hover:translate-x-1">
                    <ChevronRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="stitch-panel p-5">
          <p className="section-kicker">Ritmo</p>
          <p className="mt-4 text-2xl font-black text-[var(--color-text)]">Turnos curtos</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Respostas focadas para treinar fluidez sem perder contexto.
          </p>
        </div>
        <div className="stitch-panel p-5">
          <p className="section-kicker">Feedback</p>
          <p className="mt-4 text-2xl font-black text-[var(--color-text)]">Correção leve</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Dicas aparecem junto da conversa quando há algo útil para ajustar.
          </p>
        </div>
        <div className="stitch-panel p-5">
          <p className="section-kicker">Contexto</p>
          <p className="mt-4 text-2xl font-black text-[var(--color-text)]">Roleplay real</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Cada cenário mantém papel, objetivo e tom próprios durante a sessão.
          </p>
        </div>
      </section>
    </div>
  )
}
