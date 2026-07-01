import { z } from 'zod'
import {
  getCefrLevelLabel,
  LEARNER_CEFR_LEVELS,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'
import type { PlacementItem } from '@/features/onboarding/lib/placementItems'

const PlacementAiItemSchema = z.object({
  prompt: z.string().min(8).max(220),
  context: z.string().min(4).max(120).optional(),
  options: z.array(z.string().min(1).max(120)).length(4),
  correctIndex: z.number().int().min(0).max(3),
})

export function buildPlacementAiPrompt(level: LearnerCefrLevel, avoidPrompts: string[]): string {
  const levelLabel = getCefrLevelLabel(level)
  const avoidBlock =
    avoidPrompts.length > 0
      ? `\nNão repita nem parafraseie estas perguntas já usadas:\n${avoidPrompts.map((prompt) => `- ${prompt}`).join('\n')}`
      : ''

  return `Crie 1 pergunta de múltipla escolha para nivelamento de inglês (CEFR ${level} — ${levelLabel}) para brasileiros.

Retorne SOMENTE JSON válido no formato:
{
  "prompt": "pergunta em inglês",
  "context": "dica curta em português (opcional)",
  "options": ["opção A", "opção B", "opção C", "opção D"],
  "correctIndex": 0
}

Regras:
- Exatamente 4 opções plausíveis, apenas 1 correta.
- Dificuldade adequada ao nível ${level}.
- Sem referências culturais obscuras.
- Frases claras e curtas.
- correctIndex é 0-based.${avoidBlock}`
}

export function parsePlacementAiItem(
  raw: string,
  level: LearnerCefrLevel,
  itemId: string
): PlacementItem | null {
  try {
    const parsed = PlacementAiItemSchema.parse(JSON.parse(raw))
    if (!LEARNER_CEFR_LEVELS.includes(level)) return null

    const options = parsed.options as [string, string, string, string]
    return {
      id: itemId,
      level,
      prompt: parsed.prompt.trim(),
      context: parsed.context?.trim(),
      options,
      correctIndex: parsed.correctIndex,
    }
  } catch {
    return null
  }
}