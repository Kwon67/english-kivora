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
import FlightPaths from '@/components/landing/FlightPaths'

export const SCENARIOS = [
  {
    id: 'meet-and-greet',
    name: 'Meet and Greet',
    description: 'Practice greetings, names, where you are from, and simple daily questions.',
    icon: MessageSquare,
    color: 'bg-[#466259]',
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
    color: 'bg-[#c65f2f]',
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
    color: 'bg-[#315c88]',
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
    color: 'bg-[#5a587f]',
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
  'render-contained relative overflow-hidden rounded-[32px] border border-[#172113]/15 dark:border-[#d5e6a9]/15 bg-[#fbfcf2]/65 dark:bg-[#11160e]/65 shadow-[0_22px_64px_rgba(31,43,18,0.08)] dark:shadow-[0_22px_64px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-[#183b16]/10 dark:border-[#b8ff5c]/10 bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#183b16] dark:text-[#b8ff5c]'

export default function TutorPage() {
  return (
    <div className="relative -mx-4 -my-6 overflow-hidden bg-[#f4f5e8] dark:bg-[#050704] text-[#10130f] dark:text-[#f4f7e9] px-4 py-6 pb-12 sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 transition-colors duration-300">
      
      {/* Background mesh grid - Landing page style */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.14] dark:opacity-[0.14] z-0" />
      
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)] z-0" />

      {/* Decorative flight-path background */}
      <FlightPaths />

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <TutorHeader />

        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={softKicker}>Cenários</p>
              <h2 className="mt-3 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">Escolha uma conversa</h2>
            </div>
            <span className="rounded-full border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#fbfcf2]/65 dark:bg-[#11160e]/65 px-3 py-1.5 text-sm font-semibold text-[#425039] dark:text-[#b9c3a4] shadow-sm backdrop-blur-md">
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
                  className={`group ${glassTile} ${centeredDesktopPosition} flex min-h-52 flex-col p-5 hover:-translate-y-1 hover:border-[#183b16]/30 dark:hover:border-[#b8ff5c]/30 hover:shadow-[0_28px_80px_rgba(24,59,22,0.13)] dark:hover:shadow-[0_28px_80px_rgba(0,0,0,0.4)] active:scale-[0.99] lg:col-span-2`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fbfcf2]/45 via-transparent to-[#183b16]/5 dark:to-[#b8ff5c]/5" />
                  <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${scenario.color} text-white shadow-lg ring-1 ring-[#fbfcf2]/45`}>
                      <Icon className="h-7 w-7" strokeWidth={2.2} />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span className="inline-flex items-center rounded-full border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#fbfcf2]/50 dark:bg-[#11160e]/50 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#425039] dark:text-[#b9c3a4]">
                        {scenario.level}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-[#183b16]/10 dark:border-[#b8ff5c]/10 bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#183b16] dark:text-[#b8ff5c]">
                        {scenario.duration}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex-1">
                    <h3 className="font-montserrat text-xl font-bold text-[#10130f] dark:text-[#f4f7e9] transition-colors group-hover:text-[#183b16] dark:group-hover:text-[#b8ff5c]">
                      {scenario.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#425039] dark:text-[#b9c3a4]">
                      {scenario.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#172113]/15 dark:border-[#d5e6a9]/15 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#425039]/60 dark:text-[#b9c3a4]/60">
                        Focus
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#10130f] dark:text-[#f4f7e9]">{scenario.focus}</p>
                    </div>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c] border border-[#183b16]/10 dark:border-[#b8ff5c]/10 transition-transform group-hover:translate-x-1">
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
            <p className="mt-4 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">Turnos curtos</p>
            <p className="mt-2 text-sm leading-relaxed text-[#425039] dark:text-[#b9c3a4]">
              Respostas focadas para treinar fluidez sem perder contexto.
            </p>
          </div>
          <div className={`${glassTile} p-5`}>
            <p className={softKicker}>Feedback</p>
            <p className="mt-4 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">Correção leve</p>
            <p className="mt-2 text-sm leading-relaxed text-[#425039] dark:text-[#b9c3a4]">
              Dicas aparecem junto da conversa quando há algo útil para ajustar.
            </p>
          </div>
          <div className={`${glassTile} p-5`}>
            <p className={softKicker}>Contexto</p>
            <p className="mt-4 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">Roleplay real</p>
            <p className="mt-2 text-sm leading-relaxed text-[#425039] dark:text-[#b9c3a4]">
              Cada cenário mantém papel, objetivo e tom próprios durante a sessão.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
