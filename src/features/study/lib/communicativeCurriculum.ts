import { CEFR_LEVELS, type CefrLevel } from '@/features/cefr/lib/cefrLevels'

export const COMMUNICATIVE_SKILLS = ['reception', 'production', 'interaction', 'mediation'] as const
export type CommunicativeSkill = typeof COMMUNICATIVE_SKILLS[number]
export const SKILL_LABELS: Record<CommunicativeSkill, string> = {
  reception: 'Compreensão', production: 'Produção', interaction: 'Interação', mediation: 'Mediação',
}
export type CommunicativeObjective = { id: string; level: CefrLevel; skill: CommunicativeSkill; goal: string; task: string; criteria: string[] }

// Original product objectives informed by CEFR activities. This is a starter matrix, not a CEFR certification syllabus.
const goals: Record<CefrLevel, Record<CommunicativeSkill, [string, string, string[]]>> = {
  A1: {
    reception: ['Localizar horário e lugar em um recado curto.', 'Ler um convite e identificar onde e quando encontrar alguém.', ['Identifica o horário.', 'Identifica o local.']],
    production: ['Dar informações pessoais em frases simples.', 'Escrever uma apresentação e dizer quando pode se encontrar.', ['Apresenta-se de forma compreensível.', 'Informa disponibilidade.']],
    interaction: ['Responder a um convite simples e pedir uma informação.', 'Confirmar o encontro e perguntar o local.', ['Responde ao convite.', 'Faz uma pergunta pertinente.']],
    mediation: ['Transmitir informações simples de um recado.', 'Contar a outra pessoa onde e quando será o encontro.', ['Preserva horário e local.', 'Não acrescenta informação ausente.']],
  },
  A2: {
    reception: ['Entender uma mudança em uma situação cotidiana.', 'Ler um aviso de transporte e localizar a alternativa.', ['Reconhece a mudança.', 'Identifica a alternativa.']],
    production: ['Descrever um plano simples com sequência clara.', 'Escrever como chegar ao destino depois de uma mudança.', ['Ordena as ações.', 'Usa informações do aviso.']],
    interaction: ['Resolver uma necessidade cotidiana por troca de mensagens.', 'Pedir uma confirmação sobre a nova rota.', ['Explica sua necessidade.', 'Pede confirmação específica.']],
    mediation: ['Repassar uma instrução cotidiana em linguagem simples.', 'Explicar a um visitante como chegar ao destino.', ['Preserva a instrução essencial.', 'Adapta a explicação ao visitante.']],
  },
  B1: {
    reception: ['Identificar motivo e consequência em um relato.', 'Ler uma mudança de planos e explicar por que aconteceu.', ['Identifica o motivo.', 'Distingue plano original e novo plano.']],
    production: ['Explicar uma preferência com razões conectadas.', 'Propor um novo plano para o grupo e justificá-lo.', ['Apresenta uma proposta.', 'Conecta ao menos duas razões.']],
    interaction: ['Negociar um plano e responder a uma restrição.', 'Responder ao organizador propondo uma solução e uma pergunta.', ['Considera a restrição do outro.', 'Mantém a negociação aberta.']],
    mediation: ['Resumir pontos principais para alguém que não leu o texto.', 'Explicar ao grupo a mudança e sua consequência.', ['Seleciona informações principais.', 'Distingue informação e sugestão.']],
  },
  B2: {
    reception: ['Distinguir argumentos e ressalvas em uma proposta.', 'Ler duas posições e comparar os motivos.', ['Reconhece a ressalva.', 'Compara razões sem distorcê-las.']],
    production: ['Defender uma posição considerando uma objeção.', 'Escrever uma recomendação sobre a proposta.', ['Sustenta a posição com razões.', 'Responde a uma objeção relevante.']],
    interaction: ['Negociar uma solução diante de posições diferentes.', 'Responder a um colega e propor um acordo verificável.', ['Reconhece a posição do colega.', 'Propõe condição concreta para o acordo.']],
    mediation: ['Sintetizar perspectivas para apoiar uma decisão.', 'Produzir uma síntese neutra para quem vai decidir.', ['Representa as duas posições.', 'Explicita uma questão ainda em aberto.']],
  },
  C1: {
    reception: ['Interpretar ressalvas e intenção em um argumento complexo.', 'Ler um parecer e separar evidência, inferência e condição.', ['Identifica uma ressalva implícita.', 'Distingue evidência de conclusão.']],
    production: ['Construir uma recomendação com registro e precisão adequados.', 'Redigir um parecer breve para uma equipe decisora.', ['Qualifica o grau de certeza.', 'Organiza argumento e condições de aplicação.']],
    interaction: ['Reformular uma posição para avançar uma discussão delicada.', 'Responder a uma objeção sem apagar o desacordo.', ['Reconhece a preocupação subjacente.', 'Reformula e propõe um próximo passo.']],
    mediation: ['Tornar um argumento especializado acessível sem perder ressalvas.', 'Explicar um parecer a um público não especializado.', ['Preserva limites da evidência.', 'Explica termos de forma acessível.']],
  },
  C2: {
    reception: ['Interpretar nuances de posicionamento e pressupostos.', 'Comparar duas formulações e explicar o que sugerem além do literal.', ['Explicita pressupostos.', 'Justifica a interpretação com pistas do texto.']],
    production: ['Expressar distinções sutis com precisão e flexibilidade.', 'Redigir uma resposta que diferencie eficácia, legitimidade e incerteza.', ['Mantém distinções conceituais.', 'Ajusta tom e ênfase ao destinatário.']],
    interaction: ['Reconciliar divergências complexas sem simplificação indevida.', 'Responder a dois interlocutores e formular um ponto de acordo limitado.', ['Representa as divergências com precisão.', 'Delimita o acordo e o desacordo restante.']],
    mediation: ['Integrar perspectivas complexas preservando ambiguidades relevantes.', 'Preparar uma síntese para públicos com interesses diferentes.', ['Integra argumentos sem falsa equivalência.', 'Torna explícita uma ambiguidade importante.']],
  },
}

export const COMMUNICATIVE_CURRICULUM: CommunicativeObjective[] = CEFR_LEVELS.flatMap(level =>
  COMMUNICATIVE_SKILLS.map(skill => ({ id: `${level.toLowerCase()}-${skill}-01`, level, skill,
    goal: goals[level][skill][0], task: goals[level][skill][1], criteria: goals[level][skill][2] })))

export type SkillEvidence = { objectiveId: string; source: 'self_review' | 'objective_question' | 'external_review'; achieved: boolean; taskId: string; at: string }
/** A flashcard count cannot manufacture skill evidence or a CEFR level. */
export function objectiveEvidenceStatus(objective: CommunicativeObjective, evidence: SkillEvidence[]) {
  const relevant = evidence.filter(item => item.objectiveId === objective.id && item.taskId && Number.isFinite(Date.parse(item.at)))
  if (relevant.some(item => item.source === 'external_review' && item.achieved)) return 'reviewed_evidence' as const
  return relevant.length ? 'practice_evidence' as const : 'not_observed' as const
}
