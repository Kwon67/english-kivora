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

const DIVERSITY_RULES = `
REGRAS CRÍTICAS DE DIVERSIDADE E ORIGINALIDADE (NUNCA REPITA IDEIAS):
- Cada pack deve ser 100% único. Mesmo que o usuário gere vários packs do mesmo nível (ex: vários A1), NUNCA repita frases, estruturas, ideias ou padrões semelhantes entre diferentes gerações.
- VARIE RADICALMENTE em cada geração:
  - Não use padrões repetitivos como "I'm from...", "My name is...", "I live in...", "I like...", "I go to... every...", "I have a...".
  - Varie o sujeito: I, you, he, she, we, they, my friend, Brazilian students, people in my city, etc.
  - Varie o tipo de frase: afirmações, perguntas, negativas, sugestões, descrições com adjetivos/advérbios.
  - Cubra temas bem diferentes: família e amigos, escola ou trabalho, lazer e hobbies, alimentação, transporte e cidade, clima e tempo, compras, saúde, animais e natureza, objetos do cotidiano, sentimentos e opiniões, planos e futuro.
- Dentro do pack atual E em comparação com qualquer outra geração anterior do mesmo nível, garanta que nenhuma frase seja igual ou muito parecida (ex: "I'm from Brazil" e "I'm from São Paulo" são a mesma ideia — evite).
- Maximize variedade de vocabulário e estruturas gramaticais.
- O resultado deve parecer uma coleção fresca e original, como se fosse a primeira vez gerando para este nível.`

export function buildBlitzAiPrompt(count: number, level: LearnerCefrLevel) {
  const levelLabel = getCefrLevelLabel(level)

  return `Gere ${count} frases curtas e naturais para uma partida rápida de Blitz de inglês no nível CEFR ${level} (${levelLabel}).

IMPORTANTE: Esta é uma geração INDEPENDENTE e deve ser completamente original em relação a qualquer outra geração anterior para este nível.

Retorne SOMENTE um JSON válido no formato exato {"cards":[{"en":"...","pt":"..."}, ...]} sem texto adicional.

${NATURAL_TRANSLATION_RULES}

${DIVERSITY_RULES}

Critérios:
- adequado ao nível ${level}: ${BLITZ_LEVEL_GUIDANCE[level]};
- frases úteis para brasileiros praticarem inglês cotidiano;
- misture situações de trabalho, viagem, estudo, conversa e rotina;
- traduções em português 100% naturais e diretas seguindo as regras acima;
- INGLÊS CORRETO para o nível, sem erros gramaticais;
- MÁXIMA VARIEDADE: nenhuma frase pode ser igual ou muito parecida com outra dentro deste pack ou com padrões comuns de outros packs.`
}