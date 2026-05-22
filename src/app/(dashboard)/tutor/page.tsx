import Link from 'next/link'
import {
  Briefcase,
  ChevronRight,
  Coffee,
  Heart,
  MessageSquare,
  Plane,
} from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import TutorHeader from '@/features/tutor/components/TutorHeader'

export const SCENARIOS = [
  {
    id: 'meet-and-greet',
    name: 'Meet and Greet',
    description: 'Practice greetings, names, where you are from, and simple daily questions.',
    icon: MessageSquare,
    color: 'bg-[#466259]',
    level: 'A1-A2',
    duration: '4 min',
    focus: 'Cumprimentos e apresentação',
    context: 'A calm beginner English class. The student is practicing basic introductions. Use very simple vocabulary, short questions, and a friendly pace.',
    assistantRole: 'Patient Beginner Tutor',
    initialMessage: "Hi! My name is Alex. What is your name?"
  },
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
      <TutorHeader />

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
