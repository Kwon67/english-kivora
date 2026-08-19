/**
 * O primeiro dia guiado.
 *
 * Problema que isto resolve: o onboarding termina atribuindo um pack, o que faz
 * `hasAssignedPack` virar true e joga o iniciante direto no dashboard completo — herói, heatmap,
 * carrossel, quests, rotina, packs. Dez coisas competindo, nenhuma dizendo "faça isto agora".
 * O único elemento guiado que existia (OnboardingChecklist) ainda mandava "escolha um pack",
 * que é justamente o que a pessoa acabou de fazer.
 *
 * A regra aqui é uma ação por vez, e cada passo só conta como feito quando o dado prova que ele
 * aconteceu de verdade — nada de marcar check por visitar uma página.
 */

/** Quantos cards novos contam como "conheci minhas primeiras frases". */
export const FIRST_DAY_NEW_CARDS = 5

export type FirstDayStepId = 'learn' | 'practice' | 'recall'

export type FirstDayInput = {
  isRecentSignup: boolean
  hasAssignedPack: boolean
  /** Cards vistos pela PRIMEIRA vez hoje. */
  introducedToday: number
  /** Todos os cards tocados hoje — inclui os novos, por isso nunca é menor que introducedToday. */
  dailyCardsReviewed: number
  /** Revisões da vida inteira. Serve para saber se o usuário já passou do dia um. */
  totalReviews: number
  pendingAssignments: number
  completedAssignments: number
}

export type FirstDayStep = {
  id: FirstDayStepId
  title: string
  description: string
  minutes: number
  href: string
  cta: string
  done: boolean
  /** Verdadeiro enquanto um passo anterior não foi concluído. */
  locked: boolean
}

export type FirstDayPlan = {
  /** Se falso, a Home mostra o dashboard normal. */
  active: boolean
  steps: FirstDayStep[]
  /** O único passo que o usuário deve fazer agora. Null quando tudo terminou. */
  nextStep: FirstDayStep | null
  doneCount: number
  totalMinutes: number
  complete: boolean
}

/**
 * Cards que VOLTARAM hoje: tocados hoje menos os que eram estreia.
 *
 * `dailyCardsReviewed` conta tudo que foi respondido hoje, inclusive as estreias, então ele
 * sozinho não distingue "aprendi" de "revisei" — um passo de revisão medido por ele se marcaria
 * como feito no mesmo instante do passo de aprender. A diferença é o que realmente prova que a
 * repetição espaçada rodou: no primeiro dia, um card só reaparece pela escada de 1 e 10 minutos.
 */
export function countRecalledToday(input: Pick<FirstDayInput, 'introducedToday' | 'dailyCardsReviewed'>): number {
  return Math.max(0, input.dailyCardsReviewed - input.introducedToday)
}

function buildSteps(input: FirstDayInput): FirstDayStep[] {
  const learnDone = input.introducedToday >= FIRST_DAY_NEW_CARDS
  const practiceDone = input.completedAssignments > 0
  const recallDone = countRecalledToday(input) > 0

  return [
    {
      id: 'learn',
      title: 'Conheça suas primeiras frases',
      description: `${FIRST_DAY_NEW_CARDS} frases novas do seu pack, no seu ritmo.`,
      minutes: 2,
      href: '/review',
      cta: 'Começar',
      done: learnDone,
      locked: false,
    },
    {
      id: 'practice',
      title: 'Jogue uma rodada',
      description: 'A mesma frase, agora sem a resposta à vista.',
      minutes: 2,
      href: '/study',
      cta: 'Jogar',
      done: practiceDone,
      locked: !learnDone,
    },
    {
      id: 'recall',
      title: 'Reencontre o que aprendeu',
      description: 'As frases de hoje voltam em minutos. Lembrar delas é o que fixa.',
      minutes: 1,
      href: '/review',
      cta: 'Revisar',
      done: recallDone,
      locked: !learnDone,
    },
  ]
}

export function getFirstDayPlan(input: FirstDayInput): FirstDayPlan {
  const steps = buildSteps(input)
  const doneCount = steps.filter((step) => step.done).length
  const complete = doneCount === steps.length

  // Sai de cena quando o dia um terminou, quando a conta não é mais nova, ou quando o usuário
  // já acumulou histórico suficiente para claramente não estar no primeiro dia. Sem pack não há
  // o que guiar — esse caso continua com o checklist de escolher um pack.
  const active =
    input.isRecentSignup &&
    input.hasAssignedPack &&
    !complete &&
    input.totalReviews < FIRST_DAY_NEW_CARDS * 4

  return {
    active,
    steps,
    nextStep: steps.find((step) => !step.done && !step.locked) ?? null,
    doneCount,
    totalMinutes: steps.reduce((sum, step) => sum + step.minutes, 0),
    complete,
  }
}
