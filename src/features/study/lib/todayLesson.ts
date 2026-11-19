import { z } from 'zod'
import type { CefrLevel } from '@/features/cefr/lib/cefrLevels'

export type TodayLesson = {
  id: string; title: string; preparation: string; text: string; question: string; choices: string[]; answer: number;
  explanation: string; prompt: string; example: string; criteria: string[]; shadowing: string;
  recall?: string; speakingPrompt?: string; transfer?: boolean;
}
/** All passages and examples authored for Kivora; no third-party lesson material. */
export const TODAY_LESSONS: Record<CefrLevel, TodayLesson> = {
  A1: {
    id: 'a1-meeting-01', title: 'Combinar um encontro', preparation: 'Você recebe um convite. Procure o horário e o lugar.',
    text: 'Hi! I am Maya. Let’s meet at the café at ten. The café is next to the library. See you there!',
    question: 'Onde e quando será o encontro?', choices: ['Na biblioteca, às dez.', 'No café, às dez.', 'No café, às duas.'], answer: 1,
    explanation: '“At the café” indica o lugar e “at ten” indica o horário. “Next to the library” explica onde fica o café.',
    prompt: 'Responda a Maya em inglês: apresente-se, confirme se pode ir e faça uma pergunta simples sobre o encontro.',
    example: 'Hi Maya! I am Ana. Ten is fine. Can I bring a friend?',
    criteria: ['Eu me apresentei.', 'Eu confirmei minha disponibilidade.', 'Eu fiz uma pergunta sobre o encontro.'], shadowing: 'Let’s meet at the café at ten.',
  },
  A2: {
    id: 'a2-route-01', title: 'Encontrar outra rota', preparation: 'Um ônibus mudou de trajeto. Procure a alternativa e o motivo.',
    text: 'The number 8 bus is not stopping at the museum today because the street is closed. Take the number 12 to Green Park. From there, walk along King Street for five minutes. The museum is on your left.',
    question: 'Qual é a alternativa para chegar ao museu?', choices: ['Pegar o 12 e depois caminhar.', 'Esperar o 8 na rua fechada.', 'Caminhar cinco minutos até o parque e voltar.'], answer: 0,
    explanation: 'O aviso orienta pegar o 12 até Green Park e caminhar pela King Street. O 8 não para no museu hoje.',
    prompt: 'Um visitante não leu o aviso. Explique em inglês como chegar ao museu e por que a rota mudou.',
    example: 'The street is closed today. Take bus 12 to Green Park, then walk along King Street for five minutes. The museum is on your left.',
    criteria: ['Eu expliquei por que a rota mudou.', 'Eu mantive o ônibus, o ponto e a direção corretos.', 'Eu organizei as instruções em sequência.'], shadowing: 'From there, walk along King Street for five minutes.',
  },
  B1: {
    id: 'b1-plans-01', title: 'Adaptar um plano', preparation: 'Seu grupo precisa mudar um passeio. Separe restrições e possibilidades.',
    text: 'We planned to visit the outdoor market on Saturday, but heavy rain is expected. The community centre has offered us a room in the afternoon. It is free, although we need to bring our own food. Sam can only join before three, and Jo needs a place near the bus station. The centre is a short walk from the station.',
    question: 'Qual proposta considera as restrições do grupo?', choices: ['Encontro ao ar livre à noite.', 'Encontro no centro depois das quatro.', 'Encontro no centro no início da tarde, levando comida.'], answer: 2,
    explanation: 'O centro protege da chuva, fica perto da estação e permite um encontro antes das três. O grupo precisa levar comida.',
    prompt: 'Escreva ao grupo propondo um plano, justificando duas escolhas e perguntando se todos concordam.',
    example: 'How about meeting at the centre at one? We can avoid the rain and Sam can stay for a while. It is also near the station for Jo. I can bring sandwiches. Does that work for everyone?',
    criteria: ['Minha proposta considera horário e lugar.', 'Eu expliquei duas razões.', 'Eu abri espaço para o grupo responder.'], shadowing: 'How about meeting at the centre at one?',
  },
  B2: {
    id: 'b2-trial-01', title: 'Recomendar com ressalvas', preparation: 'Leia a proposta como alguém que precisa decidir. Que evidência ainda falta?',
    text: 'A team is considering a four-day working week. Supporters argue that fewer interruptions could improve concentration and reduce staff turnover. However, the support desk must remain available five days a week. A small trial elsewhere reported higher satisfaction, but did not measure response times. One manager proposes a staggered schedule for three months, with service quality reviewed every fortnight.',
    question: 'Qual ressalva impede tratar o outro teste como prova suficiente?', choices: ['Não foram medidos os tempos de resposta.', 'Ninguém relatou maior satisfação.', 'O suporte só atende quatro dias.'], answer: 0,
    explanation: 'Satisfação e qualidade do serviço são medidas diferentes. O texto informa que os tempos de resposta não foram medidos.',
    prompt: 'Recomende ou rejeite o teste. Apresente uma razão, responda à objeção sobre o suporte e proponha um critério de revisão.',
    example: 'I would support a limited trial, provided that the desk remains staffed throughout the week. Greater satisfaction is promising, but it does not guarantee reliable service. We should track response times and reconsider the schedule if they deteriorate.',
    criteria: ['Eu sustentei uma posição.', 'Eu respondi à objeção sobre o suporte.', 'Eu propus uma medida verificável.'], shadowing: 'Greater satisfaction is promising, but it does not guarantee reliable service.',
  },
  C1: {
    id: 'c1-evidence-01', title: 'Preservar os limites da evidência', preparation: 'Um parecer pode soar positivo sem autorizar uma conclusão forte. Observe as ressalvas.',
    text: 'The pilot appears to have widened access to evening classes, although the headline attendance figure conceals substantial variation between districts. Participants who completed the course reported greater confidence; those who withdrew were not surveyed. Extending the programme may therefore be justified as an access measure, but claims about its educational impact would be premature. A revised evaluation should distinguish participation from sustained learning and include the experiences of those who left.',
    question: 'Qual conclusão preserva as ressalvas do parecer?', choices: ['O programa comprovou aprendizagem para todos.', 'Há sinais de maior acesso, mas o efeito na aprendizagem ainda precisa de avaliação.', 'As desistências provam que o programa fracassou.'], answer: 1,
    explanation: 'O parecer distingue acesso, confiança relatada e aprendizagem. A ausência de quem desistiu limita o que se pode concluir.',
    prompt: 'Explique o parecer em inglês a uma associação de moradores. Evite jargão, preserve duas limitações e sugira um próximo passo.',
    example: 'More people seem to be reaching the classes, but attendance alone does not tell us what they learned. We also know little about why some people left. Continuing the programme could make sense if the next evaluation follows learning over time and listens to those who withdrew.',
    criteria: ['Eu distingui participação de aprendizagem.', 'Eu preservei duas limitações sem exagerar a conclusão.', 'Eu adaptei a explicação ao público.'], shadowing: 'Attendance alone does not tell us what they learned.',
  },
  C2: {
    id: 'c2-deliberation-01', title: 'Distinguir consenso e consentimento', preparation: 'Compare o que cada voz afirma e o que deixa em aberto. Não tome silêncio por concordância.',
    text: 'The chair described the consultation as “a clear mandate to proceed”. The report itself was more circumspect: most respondents supported the aim, while several questioned whether the proposed safeguards could be enforced. An adviser argued that delaying action would itself distribute risks, chiefly to people absent from the consultation. A critic replied that urgency might justify a provisional measure, but could not retrospectively turn an uneven consultation into informed consent. Both accepted that doing nothing had costs; they disagreed about what that fact authorised.',
    question: 'Qual é o desacordo central, apesar do ponto de acordo?', choices: ['Se a inação tem algum custo.', 'Se todos rejeitam o objetivo.', 'O que os custos da inação justificam e se a consulta autoriza a medida.'], answer: 2,
    explanation: 'As duas vozes reconhecem custos da inação. Divergem sobre a autorização que isso oferece e sobre a legitimidade de interpretar apoio ao objetivo como consentimento à medida.',
    prompt: 'Escreva uma síntese para o conselho: represente as duas posições, delimite o acordo e proponha uma decisão provisória sem chamar silêncio ou apoio parcial de consentimento.',
    example: 'There is agreement that inaction is consequential, but no shared inference about the authority to proceed. A narrowly bounded interim measure might address urgent risks without presenting the consultation as a mandate it did not establish. Any decision should specify its expiry, enforceable safeguards and how absent voices will influence reconsideration.',
    criteria: ['Eu diferenciei custo da inação, autorização e consentimento.', 'Eu representei as posições sem criar falso consenso.', 'Eu delimitei condições e incertezas da decisão.'], shadowing: 'They disagreed about what that fact authorised.',
  },
}

export const TodayDraftSchema = z.object({
  attemptId: z.string().uuid().nullable().default(null), accountSaved: z.boolean().default(false),
  firstChoice: z.number().int().min(0).max(2).nullable().default(null), hintsUsed: z.boolean().default(false), spoken: z.boolean().default(false),
  version: z.literal(1), lessonId: z.string(), step: z.number().int().min(0).max(4),
  response: z.string().max(6000), revision: z.string().max(6000), choice: z.number().int().min(0).max(2).nullable(),
  checked: z.array(z.boolean()).length(3), updatedAt: z.string().datetime(), completedAt: z.string().datetime().nullable(),
})
export type TodayDraft = z.infer<typeof TodayDraftSchema>
export function emptyTodayDraft(lessonId: string): TodayDraft {
  return { firstChoice: null, hintsUsed: false, spoken: false, attemptId: null, accountSaved: false, version: 1, lessonId, step: 0, response: '', revision: '', choice: null, checked: [false, false, false], updatedAt: new Date().toISOString(), completedAt: null }
}
export function restoreTodayDraft(raw: string | null, lessonId: string): TodayDraft | null {
  try {
    const draft = TodayDraftSchema.parse(JSON.parse(raw || 'null'))
    if (draft.lessonId !== lessonId || Date.parse(draft.updatedAt) > Date.now() + 300000 || (draft.step >= 2 && draft.choice === null) || (draft.step >= 3 && !draft.response.trim()) || (draft.step === 4 && (!draft.revision.trim() || !draft.completedAt))) return null
    return draft
  } catch { return null }
}

export type SavedContextAttempt = {
  attempt_id: string; lesson_id: string; response: string; revision: string; comprehension_choice: number;
  first_choice: number | null; hints_used: boolean; oral_self_report: boolean; self_checks: boolean[]; completed_at: string;
}
export function draftFromSavedAttempt(attempt: SavedContextAttempt): TodayDraft | null {
  return restoreTodayDraft(JSON.stringify({ ...emptyTodayDraft(attempt.lesson_id), step: 4,
    attemptId: attempt.attempt_id, accountSaved: true, response: attempt.response, revision: attempt.revision,
    choice: attempt.comprehension_choice, firstChoice: attempt.first_choice, hintsUsed: attempt.hints_used,
    spoken: attempt.oral_self_report, checked: attempt.self_checks, completedAt: attempt.completed_at, updatedAt: attempt.completed_at }), attempt.lesson_id)
}
