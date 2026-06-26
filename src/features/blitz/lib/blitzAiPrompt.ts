import { getCefrLevelLabel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'

const BLITZ_LEVEL_GUIDANCE: Record<LearnerCefrLevel, string> = {
  A1: 'vocabulário muito básico (saudações, números, rotina simples), frases curtas de até 7 palavras e tempos verbais no presente simples',
  A2: 'situações cotidianas (compras, viagens, trabalho informal), frases de até 10 palavras e tempos verbais básicos (presente, passado simples, futuro próximo)',
  B1: 'contextos de trabalho, estudo e viagem com maior variedade, frases de até 12 palavras, expressões idiomáticas simples e conectores comuns',
  B2: 'vocabulário mais rico e nuances (negócios, debates, opiniões), frases de até 14 palavras, estruturas mais complexas e colocações naturais',
}

const NATURAL_TRANSLATION_RULES = `
REGRAS OBRIGATÓRIAS DE TRADUÇÃO (pt-BR natural):
- Use português brasileiro natural e coloquial do dia a dia, NUNCA tradução literal palavra-por-palavra.
- Expressões fixas e phrasal verbs: use o equivalente idiomático brasileiro correto.
  Exemplos CORRETOS:
  - "I take a shower every day" → "Eu tomo banho todos os dias" (NUNCA "dou um banho")
  - "I get up at 7" → "Eu acordo às 7" (NUNCA "eu levanto" ou "eu me levanto" em contextos de acordar)
  - "Have breakfast" → "Tomar café da manhã"
  - "Make a decision" → "Tomar uma decisão"
  - "Give me a hand" → "Me dar uma mão" / "Me ajudar"
  - "How are you doing?" → "Como você está?" ou "Tudo bem?"
- Prefira sempre o que um brasileiro realmente diria na situação.
- Traduções devem soar naturais quando lidas em voz alta por brasileiro.
- Evite português europeu ou formal demais para o contexto.`

export function buildBlitzAiPrompt(count: number, level: LearnerCefrLevel) {
  const levelLabel = getCefrLevelLabel(level)

  return `Gere ${count} frases curtas e naturais para uma partida rápida de Blitz de inglês no nível CEFR ${level} (${levelLabel}).
Retorne SOMENTE um JSON válido no formato exato {"cards":[{"en":"...","pt":"..."}, ...]} sem texto adicional.

${NATURAL_TRANSLATION_RULES}

Critérios:
- adequado ao nível ${level}: ${BLITZ_LEVEL_GUIDANCE[level]};
- frases úteis para brasileiros praticarem inglês cotidiano;
- misture situações de trabalho, viagem, estudo, conversa e rotina;
- traduções em português 100% naturais e diretas seguindo as regras acima;
- evite frases repetidas ou muito parecidas;
- inglês correto para o nível, sem erros gramaticais.`
}