import { getCefrLevelLabel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'

const BLITZ_LEVEL_GUIDANCE: Record<LearnerCefrLevel, string> = {
  A1: 'vocabulário muito básico (saudações, números, rotina simples), frases curtas de até 7 palavras e tempos verbais no presente simples',
  A2: 'situações cotidianas (compras, viagens, trabalho informal), frases de até 10 palavras e tempos verbais básicos (presente, passado simples, futuro próximo)',
  B1: 'contextos de trabalho, estudo e viagem com maior variedade, frases de até 12 palavras, expressões idiomáticas simples e conectores comuns',
  B2: 'vocabulário mais rico e nuances (negócios, debates, opiniões), frases de até 14 palavras, estruturas mais complexas e colocações naturais',
}

export function buildBlitzAiPrompt(count: number, level: LearnerCefrLevel) {
  const levelLabel = getCefrLevelLabel(level)

  return `Gere ${count} frases curtas e naturais para uma partida rápida de Blitz de inglês no nível CEFR ${level} (${levelLabel}).
Retorne somente JSON no formato {"cards":[{"en":"...","pt":"..."}]}.
Critérios:
- adequado ao nível ${level}: ${BLITZ_LEVEL_GUIDANCE[level]};
- frases úteis para brasileiros praticarem inglês cotidiano;
- misture situações de trabalho, viagem, estudo, conversa e rotina;
- traduções em português naturais e diretas;
- evite frases repetidas ou muito parecidas.`
}