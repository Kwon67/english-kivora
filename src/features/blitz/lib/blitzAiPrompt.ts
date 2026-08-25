import {
  blitzLevelCeiling,
  planBlitzAiLevels,
} from '@/features/blitz/lib/blitzLevelScope'
import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'

/**
 * Instrução por NÍVEL CEFR, não por dificuldade escolhida na tela.
 *
 * Antes existia um texto por dificuldade ("Fácil" cobria A1 e A2 num parágrafo só). Agora a
 * partida mistura vários níveis de uma vez, então cada nível precisa da própria descrição — é ela
 * que diz à IA o que muda de um degrau para o outro dentro da MESMA geração.
 */
const BLITZ_LEVEL_GUIDANCE: Record<LearnerCefrLevel, string> = {
  A1: 'vocabulário essencial (saudações, números, família, rotina básica), frases de até 8 palavras, presente simples',
  A2: 'situações cotidianas concretas (compras, transporte, comida, clima, viagem simples), frases de até 10 palavras, presente e passado simples e futuro próximo',
  B1: 'trabalho, estudo e viagem com mais variedade, frases de até 12 palavras, conectores comuns e expressões idiomáticas simples',
  B2: 'opinião, nuance e argumentação (negócios, debates, hipóteses), frases de até 14 palavras, estruturas complexas e colocações naturais',
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
- Cada pack deve ser 100% único. Mesmo que o usuário gere vários packs no mesmo nível, NUNCA repita frases, estruturas, ideias ou padrões semelhantes entre diferentes gerações.
- VARIE RADICALMENTE em cada geração:
  - Não use padrões repetitivos como "I'm from...", "My name is...", "I live in...", "I like...", "I go to... every...", "I have a...".
  - Varie o sujeito: I, you, he, she, we, they, my friend, Brazilian students, people in my city, etc.
  - Varie o tipo de frase: afirmações, perguntas, negativas, sugestões, descrições com adjetivos/advérbios.
  - Cubra temas bem diferentes: família e amigos, escola ou trabalho, lazer e hobbies, alimentação, transporte e cidade, clima e tempo, compras, saúde, animais e natureza, objetos do cotidiano, sentimentos e opiniões, planos e futuro.
- Dentro do pack atual E em comparação com qualquer outra geração anterior do mesmo nível, garanta que nenhuma frase seja igual ou muito parecida (ex: "I'm from Brazil" e "I'm from São Paulo" são a mesma ideia — evite).
- Maximize variedade de vocabulário e estruturas gramaticais.
- O resultado deve parecer uma coleção fresca e original, como se fosse a primeira vez gerando para este nível.`

/**
 * `userLevel` é o teto da partida. Nada acima dele pode aparecer — é a regra que substituiu os
 * botões de dificuldade, e ela vale tanto para o que a IA gera quanto para o que o modo padrão
 * busca no banco.
 */
export function buildBlitzAiPrompt(count: number, userLevel: LearnerCefrLevel | null) {
  const teto = blitzLevelCeiling(userLevel)
  const plano = planBlitzAiLevels(count, userLevel)
  const total = plano.reduce((soma, item) => soma + item.count, 0)
  const faixa = plano.length > 1 ? `${plano[plano.length - 1].level}–${teto}` : teto

  const distribuicao = plano
    .map((item) => `- ${item.count} frases de ${item.level}: ${BLITZ_LEVEL_GUIDANCE[item.level]};`)
    .join('\n')

  return `Gere ${total} frases curtas e naturais para uma partida rápida de Blitz de inglês de um aluno brasileiro cujo nível de inglês é ${teto} (CEFR).

REGRA ABSOLUTA DE NÍVEL: ${teto} é o TETO da partida. NUNCA gere frases acima de ${teto} — nada de vocabulário, estruturas ou nuances de níveis superiores. Frases mais fáceis são bem-vindas dentro da faixa ${faixa}, frases mais difíceis que ${teto} são erro grave.

DISTRIBUIÇÃO OBRIGATÓRIA POR NÍVEL (some exatamente ${total} frases):
${distribuicao}

IMPORTANTE: Esta é uma geração INDEPENDENTE e deve ser completamente original em relação a qualquer outra geração anterior para este nível.

Retorne SOMENTE um JSON válido no formato exato {"cards":[{"en":"...","pt":"..."}, ...]} sem texto adicional.

${NATURAL_TRANSLATION_RULES}

${DIVERSITY_RULES}

Critérios:
- respeite a distribuição por nível acima, sem passar do teto ${teto};
- frases úteis para brasileiros praticarem inglês cotidiano;
- misture situações de trabalho, viagem, estudo, conversa e rotina;
- traduções em português 100% naturais e diretas seguindo as regras acima;
- INGLÊS CORRETO para o nível, sem erros gramaticais;
- MÁXIMA VARIEDADE: nenhuma frase pode ser igual ou muito parecida com outra dentro deste pack ou com padrões comuns de outros packs.`
}
