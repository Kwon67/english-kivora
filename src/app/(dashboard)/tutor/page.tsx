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

const glassTile =
  'relative overflow-hidden rounded-[28px] border border-zinc-200/55 bg-white/35 shadow-[0_18px_45px_rgba(24,32,29,0.08)] backdrop-blur-md'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50/65 px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-emerald-800'

export default function TutorPage() {
  return (
    <div className="relative -mx-4 -my-6 overflow-hidden bg-zinc-50 px-4 py-6 pb-12 sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.24] [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,#065f46_34%,transparent)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="animate-float-1 absolute -top-28 left-[6%] h-[280px] w-[280px] rounded-full bg-emerald-500/12 blur-[85px]" />
        <div className="animate-float-2 absolute top-[26rem] -right-20 h-[360px] w-[360px] rounded-full bg-amber-500/10 blur-[95px]" />
        <div className="animate-float-3 absolute bottom-20 left-[12%] h-[240px] w-[240px] rounded-full bg-sky-500/8 blur-[90px]" />
      </div>

    <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
      <TutorHeader />

      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={softKicker}>Cenários</p>
            <h2 className="mt-3 font-montserrat text-2xl font-bold text-zinc-900">Escolha uma conversa</h2>
          </div>
          <span className="rounded-full border border-zinc-200/60 bg-white/45 px-3 py-1.5 text-sm font-semibold text-zinc-500 shadow-sm backdrop-blur-md">
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
                className={`group ${glassTile} flex min-h-52 flex-col p-5 transition-all hover:-translate-y-1 hover:border-emerald-800/30 hover:shadow-[var(--shadow-xl)] active:scale-[0.99]`}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-transparent to-emerald-50/25" />
                <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${scenario.color} text-white shadow-lg ring-1 ring-white/45`}>
                    <Icon className="h-7 w-7" strokeWidth={2.2} />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className="inline-flex items-center rounded-full border border-zinc-200/65 bg-white/45 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-zinc-500">
                      {scenario.level}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-emerald-900/10 bg-emerald-50/70 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.08em] text-emerald-800">
                      {scenario.duration}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex-1">
                  <h3 className="font-montserrat text-xl font-bold text-zinc-900 transition-colors group-hover:text-emerald-800">
                    {scenario.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {scenario.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-200/55 pt-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                      Foco
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900">{scenario.focus}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 transition-transform group-hover:translate-x-1">
                    <ChevronRight className="h-5 w-5" />
                  </span>
                </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className={`${glassTile} p-5`}>
          <p className={softKicker}>Ritmo</p>
          <p className="mt-4 font-montserrat text-2xl font-bold text-zinc-900">Turnos curtos</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Respostas focadas para treinar fluidez sem perder contexto.
          </p>
        </div>
        <div className={`${glassTile} p-5`}>
          <p className={softKicker}>Feedback</p>
          <p className="mt-4 font-montserrat text-2xl font-bold text-zinc-900">Correção leve</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Dicas aparecem junto da conversa quando há algo útil para ajustar.
          </p>
        </div>
        <div className={`${glassTile} p-5`}>
          <p className={softKicker}>Contexto</p>
          <p className="mt-4 font-montserrat text-2xl font-bold text-zinc-900">Roleplay real</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Cada cenário mantém papel, objetivo e tom próprios durante a sessão.
          </p>
        </div>
      </section>
    </div>
    </div>
  )
}
