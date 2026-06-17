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

const scenarioIconClass =
  'bg-primary-container text-primary ring-border-muted/18 bg-primary/12 text-primary dark:ring-border-accent/18'

export const SCENARIOS = [
  {
    id: 'meet-and-greet',
    name: 'Meet and Greet',
    description: 'Practice greetings, names, where you are from, and simple daily questions.',
    icon: MessageSquare,
    color: scenarioIconClass,
    level: 'A1-A2',
    duration: '4 min',
    focus: 'Greetings & introductions',
    context: 'A calm beginner English class. The student is practicing basic introductions. Use very simple vocabulary, short questions, and a friendly pace.',
    assistantRole: 'Patient Beginner Tutor',
    initialMessage: "Hi! My name is Alex. What is your name?"
  },
  {
    id: 'coffee-shop',
    name: 'At the Coffee Shop',
    description: 'Order your favorite drink and a snack in a busy NYC cafe.',
    icon: Coffee,
    color: scenarioIconClass,
    level: 'A2-B1',
    duration: '5 min',
    focus: 'Orders & preferences',
    context: 'A busy Starbucks in Manhattan. The student is a customer, you are the barista.',
    assistantRole: 'Friendly NYC Barista',
    initialMessage: "Hi there! Welcome to Starbucks. What can I get for you today?"
  },
  {
    id: 'job-interview',
    name: 'Job Interview',
    description: 'Practice a technical interview for a Software Engineer position.',
    icon: Briefcase,
    color: scenarioIconClass,
    level: 'B1-B2',
    duration: '8 min',
    focus: 'Professional experience',
    context: 'A formal interview at a tech company. The student is the candidate, you are the hiring manager.',
    assistantRole: 'Senior Engineering Manager',
    initialMessage: "Hello! Thanks for coming in today. To start, could you tell me a bit about your experience with React and Node.js?"
  },
  {
    id: 'airport',
    name: 'Airport Check-in',
    description: 'Handle luggage issues and gate changes at Heathrow Airport.',
    icon: Plane,
    color: scenarioIconClass,
    level: 'B1',
    duration: '6 min',
    focus: 'Travel situations',
    context: 'Check-in counter at Heathrow. There is a problem with the student\'s booking.',
    assistantRole: 'Airport Staff',
    initialMessage: "Good morning. I'm afraid I'm having trouble finding your booking in our system. May I see your passport and booking reference again?"
  },
  {
    id: 'first-date',
    name: 'First Date',
    description: 'Casual conversation to get to know someone at a nice restaurant.',
    icon: Heart,
    color: scenarioIconClass,
    level: 'A2-B1',
    duration: '7 min',
    focus: 'Small talk natural',
    context: 'A cozy Italian restaurant. You are on a first date with the student.',
    assistantRole: 'A friendly and curious date',
    initialMessage: "This place is so nice! I'm glad we decided to come here. Have you been to this restaurant before?"
  }
]

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'

export default function TutorPage() {
  return (
    <div className="home-mobile-optimized relative -mx-4 -my-6 overflow-hidden bg-surface px-4 py-6 pb-12 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#050704] dark:text-text">
      
      {/* Background mesh grid - Landing page style */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.14] dark:opacity-[0.14] z-0" />
      
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)] z-0" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <TutorHeader />

        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={softKicker}>Cenários</p>
              <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">Escolha uma conversa</h2>
            </div>
            <span className="rounded-full border border-border-muted/10 dark:border-border-accent/10 bg-card dark:bg-card px-3 py-1.5 text-sm font-semibold text-text-muted dark:text-text-muted shadow-sm">
              {SCENARIOS.length} modos disponíveis
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {SCENARIOS.map((scenario, index) => {
              const Icon = scenario.icon
              const centeredDesktopPosition =
                index === 3 ? 'lg:col-start-2' : index === 4 ? 'lg:col-start-4' : ''

              return (
                <Link
                  key={scenario.id}
                  href={`/tutor/${scenario.id}`}
                  transitionTypes={navForwardTransitionTypes}
                  prefetch={false}
                  className={`group ${glassTile} ${centeredDesktopPosition} flex min-h-52 flex-col p-5 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] active:scale-[0.99] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] lg:col-span-2`}
                >
                  <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
                  <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${scenario.color} shadow-sm ring-1`}>
                      <Icon className="h-7 w-7" strokeWidth={2.2} />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="inline-flex items-center rounded-full border border-border-muted/10 dark:border-border-accent/10 bg-card dark:bg-card px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-text-muted dark:text-text-muted">
                        {scenario.level}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-primary/10 dark:border-primary/10 bg-primary/5 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-primary">
                        {scenario.duration}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex-1">
                    <h3 className="font-montserrat text-xl font-bold text-text dark:text-text transition-colors group-hover:text-primary">
                      {scenario.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted dark:text-text-muted">
                      {scenario.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border-muted/15 dark:border-border-accent/15 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted/60 dark:text-text-muted/60">
                        Focus
                      </p>
                      <p className="mt-1 text-sm font-semibold text-text dark:text-text">{scenario.focus}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/10 dark:border-primary/10 transition-transform group-hover:translate-x-1">
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="content-visibility-section grid gap-4 md:grid-cols-3">
          <div className={`${glassTile} p-5`}>
            <p className={softKicker}>Ritmo</p>
            <p className="mt-4 font-montserrat text-2xl font-bold text-text dark:text-text">Turnos curtos</p>
            <p className="mt-2 text-sm leading-relaxed text-text-muted dark:text-text-muted">
              Respostas focadas para treinar fluidez sem perder contexto.
            </p>
          </div>
          <div className={`${glassTile} p-5`}>
            <p className={softKicker}>Feedback</p>
            <p className="mt-4 font-montserrat text-2xl font-bold text-text dark:text-text">Correção leve</p>
            <p className="mt-2 text-sm leading-relaxed text-text-muted dark:text-text-muted">
              Dicas aparecem junto da conversa quando há algo útil para ajustar.
            </p>
          </div>
          <div className={`${glassTile} p-5`}>
            <p className={softKicker}>Contexto</p>
            <p className="mt-4 font-montserrat text-2xl font-bold text-text dark:text-text">Roleplay real</p>
            <p className="mt-2 text-sm leading-relaxed text-text-muted dark:text-text-muted">
              Cada cenário mantém papel, objetivo e tom próprios durante a sessão.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
