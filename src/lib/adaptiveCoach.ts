import type { ReviewQueueSummary } from '@/lib/reviewQueue'

export type AdaptiveCoachAssignment = {
  id: string
  game_mode: string
  packs: {
    name: string
    description: string | null
  } | null
}

export type AdaptiveCoachWeakCard = {
  en: string
  pt: string
  count: number
}

export type AdaptiveCoachRecentSession = {
  completed_at: string
  correct_answers: number
  wrong_answers: number
  assignments: {
    game_mode: string
    packs: {
      name: string
    } | null
  } | null
}

export type AdaptiveCoachPlan = {
  mode: 'stabilize' | 'clearance' | 'precision' | 'advance' | 'maintenance'
  trackLabel: string
  title: string
  summary: string
  detail: string
  intensityLabel: string
  estimatedMinutes: number
  focusLabel: string
  focusValue: string
  signalPills: string[]
  rewardNudge: string
  primaryAction: {
    href: string
    label: string
  }
  secondaryAction?: {
    href: string
    label: string
  }
}

type AdaptiveCoachInput = {
  reviewStats: ReviewQueueSummary
  pendingAssignments: AdaptiveCoachAssignment[]
  recentSessions: AdaptiveCoachRecentSession[]
  topWeakCards: AdaptiveCoachWeakCard[]
  dailyGoalProgress: number
}

function getAccuracy(correct: number, wrong: number) {
  const total = correct + wrong
  if (total <= 0) return null
  return Math.round((correct / total) * 100)
}

function getAverageAccuracy(sessions: AdaptiveCoachRecentSession[]) {
  const recent = sessions.slice(0, 5)
  if (recent.length === 0) return null

  let correct = 0
  let wrong = 0

  for (const session of recent) {
    correct += session.correct_answers
    wrong += session.wrong_answers
  }

  return getAccuracy(correct, wrong)
}

export function buildAdaptiveCoachPlan({
  reviewStats,
  pendingAssignments,
  recentSessions,
  topWeakCards,
  dailyGoalProgress,
}: AdaptiveCoachInput): AdaptiveCoachPlan {
  const nextAssignment = pendingAssignments[0] || null
  const typingAssignment = pendingAssignments.find((assignment) => assignment.game_mode === 'typing') || null
  const latestTypingSession = recentSessions.find((session) => session.assignments?.game_mode === 'typing') || null
  const latestTypingAccuracy = latestTypingSession
    ? getAccuracy(latestTypingSession.correct_answers, latestTypingSession.wrong_answers)
    : null
  const recentAccuracy = getAverageAccuracy(recentSessions)
  const weakCard = topWeakCards[0] || null
  const highReviewPressure = reviewStats.dueToday >= 12 || reviewStats.totalDue >= 16
  const shouldClearQueueFirst =
    reviewStats.totalDue > 0 &&
    (highReviewPressure || dailyGoalProgress < 60 || (recentAccuracy !== null && recentAccuracy < 82))
  const shouldStabilizeTyping =
    Boolean(typingAssignment) &&
    latestTypingAccuracy !== null &&
    latestTypingAccuracy < 72

  if (shouldStabilizeTyping && typingAssignment) {
    return {
      mode: 'stabilize',
      trackLabel: 'Recovery lane',
      title: 'Recupere a base antes de insistir na digitacao.',
      summary:
        'A ultima rodada de typing puxou demais. Trocar alguns minutos de pressao escrita por reconhecimento guiado tende a devolver precisao mais rapido.',
      detail:
        typingAssignment.packs?.description ||
        'Use um bloco curto em flashcards ou multipla escolha para reforcar significado, ordem e traducao antes de voltar ao teclado.',
      intensityLabel: 'Leve',
      estimatedMinutes: 6,
      focusLabel: 'Pack em risco',
      focusValue: typingAssignment.packs?.name || 'Digitacao atual',
      signalPills: [
        `${latestTypingAccuracy}% na ultima digitacao`,
        weakCard ? `Travou mais em ${weakCard.en}` : 'Erros repetidos na mesma rodada',
        `${reviewStats.totalDue} cards ainda aguardando`,
      ],
      rewardNudge: 'Fechar esse bloco leve reduz atrito e ajuda a sustentar as missoes do dia.',
      primaryAction: {
        href: `/play/${typingAssignment.id}?adaptive=flashcard`,
        label: 'Entrar em modo recuperacao',
      },
      secondaryAction: {
        href: `/play/${typingAssignment.id}?adaptive=multiple_choice`,
        label: 'Usar multipla escolha',
      },
    }
  }

  if (shouldClearQueueFirst) {
    return {
      mode: 'clearance',
      trackLabel: 'Queue first',
      title: 'Limpe a fila antes de abrir conteudo novo.',
      summary:
        'Sua carga de revisao esta alta o bastante para cobrar juros de memoria. Resolver isso agora protege a retencao e facilita as proximas licoes.',
      detail:
        reviewStats.dueToday > 0
          ? `Existem ${reviewStats.dueToday} revisoes vencidas agora e ${reviewStats.dueTomorrow} programadas para amanha.`
          : `Existem ${reviewStats.newCards} cards liberados hoje e eles vao render melhor se a fila continuar sob controle.`,
      intensityLabel: highReviewPressure ? 'Alta' : 'Moderada',
      estimatedMinutes: Math.min(18, Math.max(8, Math.ceil(reviewStats.totalDue * 0.7))),
      focusLabel: 'Fila imediata',
      focusValue: `${reviewStats.totalDue} cards para resolver`,
      signalPills: [
        `${reviewStats.dueToday} vencidos agora`,
        `${reviewStats.dueTomorrow} para amanha`,
        `${reviewStats.newCards} novos liberados`,
      ],
      rewardNudge: 'Concluir a fila cedo abre espaco para completar mais missoes sem sobrecarga no fim do dia.',
      primaryAction: {
        href: '/review',
        label: 'Abrir revisao focada',
      },
      secondaryAction: weakCard
        ? {
            href: '/problem-words',
            label: 'Ver mapa de falhas',
          }
        : undefined,
    }
  }

  if (recentAccuracy !== null && recentAccuracy < 78 && weakCard) {
    return {
      mode: 'precision',
      trackLabel: 'Precision tune',
      title: 'Ataque os pontos que ainda estao vazando.',
      summary:
        'Seu ritmo recente nao esta ruim, mas a precisao caiu o bastante para justificar um ajuste cirurgico antes de acelerar de novo.',
      detail: `${weakCard.en} (${weakCard.pt}) apareceu ${weakCard.count}x entre os erros recentes e merece uma passada dedicada.`,
      intensityLabel: 'Moderada',
      estimatedMinutes: 7,
      focusLabel: 'Principal escape',
      focusValue: weakCard.en,
      signalPills: [
        `${recentAccuracy}% de precisao recente`,
        `${weakCard.count} falhas no mesmo termo`,
        nextAssignment?.packs?.name ? `Proxima licao: ${nextAssignment.packs.name}` : 'Sem perder o ritmo',
      ],
      rewardNudge: 'Corrigir o vazamento dominante melhora a taxa de acerto das proximas sessoes e acelera as recompensas.',
      primaryAction: {
        href: '/problem-words',
        label: 'Abrir mapa de falhas',
      },
      secondaryAction: reviewStats.totalDue > 0
        ? {
            href: '/review',
            label: 'Revisar cards agora',
          }
        : undefined,
    }
  }

  if (nextAssignment) {
    const needsSofterEntry =
      nextAssignment.game_mode === 'typing' &&
      recentAccuracy !== null &&
      recentAccuracy < 82

    return {
      mode: 'advance',
      trackLabel: 'Next level',
      title: 'Voce pode subir o nivel hoje.',
      summary:
        'A base esta estavel o suficiente para avancar no plano sem sacrificar memoria. O melhor uso do momento e abrir a proxima licao.',
      detail:
        nextAssignment.packs?.description ||
        'Sessao pronta para transformar repeticao recente em conteudo novo consolidado.',
      intensityLabel: needsSofterEntry ? 'Leve' : 'Moderada',
      estimatedMinutes: needsSofterEntry ? 8 : 10,
      focusLabel: 'Proxima licao',
      focusValue: nextAssignment.packs?.name || 'Treino atual',
      signalPills: [
        recentAccuracy !== null ? `${recentAccuracy}% de precisao recente` : 'Ritmo estavel',
        `${reviewStats.totalDue} cards em fila`,
        nextAssignment.game_mode === 'typing' ? 'Entrada suave sugerida' : 'Modo normal liberado',
      ],
      rewardNudge: 'Avancar agora ajuda a fechar metas diarias sem acumular tarefa para depois.',
      primaryAction: {
        href: needsSofterEntry
          ? `/play/${nextAssignment.id}?adaptive=multiple_choice`
          : `/play/${nextAssignment.id}`,
        label: needsSofterEntry ? 'Entrar com apoio leve' : 'Abrir proxima licao',
      },
      secondaryAction: reviewStats.totalDue > 0
        ? {
            href: '/review',
            label: 'Revisar antes',
          }
        : undefined,
    }
  }

  return {
    mode: 'maintenance',
    trackLabel: 'Maintenance',
    title: 'Mantenha o motor aquecido sem forcar.',
    summary:
      'O fluxo visivel esta limpo. Em vez de abrir tarefa aleatoria, use alguns minutos para consolidar leitura de progresso e palavras instaveis.',
    detail:
      weakCard
        ? `${weakCard.en} ainda merece atencao quando voce voltar.`
        : 'Seu painel esta em ordem e a melhor jogada agora e consolidar o que ja foi feito.',
    intensityLabel: 'Leve',
    estimatedMinutes: 5,
    focusLabel: 'Melhor uso do momento',
    focusValue: weakCard ? 'Revisar fragilidades' : 'Consolidar progresso',
    signalPills: [
      `${reviewStats.totalDue} cards em fila`,
      weakCard ? `Ultimo alerta: ${weakCard.en}` : 'Sem gargalo dominante',
      'Janela boa para leitura rapida',
    ],
    rewardNudge: 'Usar o tempo em consolidacao deixa o retorno de amanha mais leve.',
    primaryAction: {
      href: weakCard ? '/problem-words' : '/history',
      label: weakCard ? 'Abrir palavras problematicas' : 'Ver historico',
    },
    secondaryAction: reviewStats.totalDue > 0
      ? {
          href: '/review',
          label: 'Passar pela revisao',
        }
      : undefined,
  }
}
