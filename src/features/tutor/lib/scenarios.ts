import {
  Briefcase,
  Coffee,
  Handshake,
  Heart,
  MessageSquare,
  Plane,
  Scale,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export type TutorScenario = {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: string
  level: string
  duration: string
  focus: string
  context: string
  assistantRole: string
  initialMessage: string
}

const scenarioIconClass =
  'border-2 border-brand-dark bg-brand-accent text-brand-dark'

export const TUTOR_SCENARIOS: TutorScenario[] = [
  {
    id: 'meet-and-greet',
    name: 'Apresentações',
    description: 'Cumprimentos, nomes, origem e perguntas simples do dia a dia.',
    icon: MessageSquare,
    color: scenarioIconClass,
    level: 'A1-A2',
    duration: '4 min',
    focus: 'Saudações e apresentações',
    context:
      'A calm beginner English class. The student is practicing basic introductions. Use very simple vocabulary, short questions, and a friendly pace.',
    assistantRole: 'Patient Beginner Tutor',
    initialMessage: 'Hi! My name is Alex. What is your name?',
  },
  {
    id: 'coffee-shop',
    name: 'Na cafeteria',
    description: 'Peça sua bebida e um lanche em uma cafeteria movimentada.',
    icon: Coffee,
    color: scenarioIconClass,
    level: 'A2-B1',
    duration: '5 min',
    focus: 'Pedidos e preferências',
    context: 'A busy Starbucks in Manhattan. The student is a customer, you are the barista.',
    assistantRole: 'Friendly NYC Barista',
    initialMessage: 'Hi there! Welcome to Starbucks. What can I get for you today?',
  },
  {
    id: 'job-interview',
    name: 'Entrevista de emprego',
    description: 'Pratique uma entrevista técnica para vaga de desenvolvedor.',
    icon: Briefcase,
    color: scenarioIconClass,
    level: 'B1-B2',
    duration: '8 min',
    focus: 'Experiência profissional',
    context:
      'A formal interview at a tech company. The student is the candidate, you are the hiring manager.',
    assistantRole: 'Senior Engineering Manager',
    initialMessage:
      'Hello! Thanks for coming in today. To start, could you tell me a bit about your experience with React and Node.js?',
  },
  {
    id: 'professional-pitch',
    name: 'Apresentação profissional',
    description: 'Apresente um projeto, resultados e impacto para stakeholders.',
    icon: Sparkles,
    color: scenarioIconClass,
    level: 'B2',
    duration: '8 min',
    focus: 'Clareza e persuasão no trabalho',
    context:
      'A quarterly business review. The student must present a project outcome to a skeptical director. Use formal but natural B2 workplace English.',
    assistantRole: 'Operations Director',
    initialMessage:
      'Thanks for joining. We only have ten minutes — walk me through the problem you solved and the measurable impact.',
  },
  {
    id: 'negotiation',
    name: 'Negociação',
    description: 'Negocie prazo, escopo ou orçamento com um cliente exigente.',
    icon: Handshake,
    color: scenarioIconClass,
    level: 'B2',
    duration: '9 min',
    focus: 'Argumentação e concessões',
    context:
      'A client wants a faster delivery date without increasing budget. The student represents the delivery team and must negotiate professionally.',
    assistantRole: 'Demanding Client',
    initialMessage:
      'We need this delivered two weeks earlier. Your current timeline is unacceptable — what can you commit to?',
  },
  {
    id: 'giving-opinion',
    name: 'Dar opinião',
    description: 'Expresse opinião fundamentada sobre um tema atual no trabalho.',
    icon: Scale,
    color: scenarioIconClass,
    level: 'B2',
    duration: '7 min',
    focus: 'Opinião e contra-argumento',
    context:
      'A team meeting about remote work policy. The student should share a nuanced opinion, support it with reasons, and respond to pushback.',
    assistantRole: 'Team Lead',
    initialMessage:
      'Before we decide, I want to hear your view. Do you think hybrid work helps or hurts productivity on our team?',
  },
  {
    id: 'workplace-problem',
    name: 'Resolver problema no trabalho',
    description: 'Explique um incidente, ações tomadas e próximos passos.',
    icon: Briefcase,
    color: scenarioIconClass,
    level: 'B2',
    duration: '8 min',
    focus: 'Situação → ação → resultado',
    context:
      'A production issue affected customers this morning. The student must explain what happened, what they did, and how they will prevent recurrence.',
    assistantRole: 'Incident Manager',
    initialMessage:
      'We had downtime for forty minutes. I need a clear summary: what broke, what you did, and what happens next.',
  },
  {
    id: 'airport',
    name: 'Check-in no aeroporto',
    description: 'Lide com problemas de bagagem e mudança de portão em Heathrow.',
    icon: Plane,
    color: scenarioIconClass,
    level: 'B1',
    duration: '6 min',
    focus: 'Situações de viagem',
    context: "Check-in counter at Heathrow. There is a problem with the student's booking.",
    assistantRole: 'Airport Staff',
    initialMessage:
      "Good morning. I'm afraid I'm having trouble finding your booking in our system. May I see your passport and booking reference again?",
  },
  {
    id: 'first-date',
    name: 'Primeiro encontro',
    description: 'Conversa casual para conhecer alguém em um restaurante.',
    icon: Heart,
    color: scenarioIconClass,
    level: 'A2-B1',
    duration: '7 min',
    focus: 'Small talk natural',
    context: 'A cozy Italian restaurant. You are on a first date with the student.',
    assistantRole: 'A friendly and curious date',
    initialMessage:
      "This place is so nice! I'm glad we decided to come here. Have you been to this restaurant before?",
  },
]

export function getTutorScenario(id: string) {
  return TUTOR_SCENARIOS.find((scenario) => scenario.id === id)
}
