import {
  cefrRangeLabel,
  getBlitzDifficulty,
  type BlitzDifficulty,
} from '@/features/blitz/lib/blitzDifficulty'

/**
 * Instrução por DIFICULDADE, não por nível.
 *
 * "Fácil" cobre A1 e A2, então a orientação descreve a faixa inteira: antes existia um texto por
 * sigla e escolher um deles para representar dois níveis deixaria de fora metade do público que
 * clica em "Fácil".
 */
const BLITZ_DIFFICULTY_GUIDANCE: Record<BlitzDifficulty, string> = {
  facil:
    'vocabulário básico do dia a dia (saudações, números, rotina, compras, viagem simples), frases curtas de até 10 palavras e tempos verbais simples (presente, passado simples, futuro próximo) — comece pelo mais simples e varie até o limite dessa faixa',
  medio:
    'contextos de trabalho, estudo e viagem com maior variedade, frases de até 12 palavras, expressões idiomáticas simples e conectores comuns',
  dificil:
    'vocabulário mais rico e nuances (negócios, debates, opiniões), frases de até 14 palavras, estruturas mais complexas e colocações naturais',
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
- Cada pack deve ser 100% único. Mesmo que o usuário gere vários packs da mesma dificuldade (ex: vários "Fácil"), NUNCA repita frases, estruturas, ideias ou padrões semelhantes entre diferentes gerações.
- VARIE RADICALMENTE em cada geração:
  - Não use padrões repetitivos como "I'm from...", "My name is...", "I live in...", "I like...", "I go to... every...", "I have a...".
  - Varie o sujeito: I, you, he, she, we, they, my friend, Brazilian students, people in my city, etc.
  - Varie o tipo de frase: afirmações, perguntas, negativas, sugestões, descrições com adjetivos/advérbios.
  - Cubra temas bem diferentes: família e amigos, escola ou trabalho, lazer e hobbies, alimentação, transporte e cidade, clima e tempo, compras, saúde, animais e natureza, objetos do cotidiano, sentimentos e opiniões, planos e futuro.
- Dentro do pack atual E em comparação com qualquer outra geração anterior da mesma dificuldade, garanta que nenhuma frase seja igual ou muito parecida (ex: "I'm from Brazil" e "I'm from São Paulo" são a mesma ideia — evite).
- Maximize variedade de vocabulário e estruturas gramaticais.
- O resultado deve parecer uma coleção fresca e original, como se fosse a primeira vez gerando para esta dificuldade.`

export function buildBlitzAiPrompt(count: number, difficulty: BlitzDifficulty) {
  const { label } = getBlitzDifficulty(difficulty)
  const faixa = cefrRangeLabel(difficulty)

  return `Gere ${count} frases curtas e naturais para uma partida rápida de Blitz de inglês na dificuldade ${label} (CEFR ${faixa}).

IMPORTANTE: Esta é uma geração INDEPENDENTE e deve ser completamente original em relação a qualquer outra geração anterior para esta dificuldade.

Retorne SOMENTE um JSON válido no formato exato {"cards":[{"en":"...","pt":"..."}, ...]} sem texto adicional.

${NATURAL_TRANSLATION_RULES}

${DIVERSITY_RULES}

Critérios:
- adequado à dificuldade ${label} (CEFR ${faixa}): ${BLITZ_DIFFICULTY_GUIDANCE[difficulty]};
- frases úteis para brasileiros praticarem inglês cotidiano;
- misture situações de trabalho, viagem, estudo, conversa e rotina;
- traduções em português 100% naturais e diretas seguindo as regras acima;
- INGLÊS CORRETO para o nível, sem erros gramaticais;
- MÁXIMA VARIEDADE: nenhuma frase pode ser igual ou muito parecida com outra dentro deste pack ou com padrões comuns de outros packs.`
}