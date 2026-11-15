import { z } from 'zod'
export const QuickWordSchema = z.object({
  cardId: z.string().uuid(),
  packId: z.string().uuid(),
  createCollection: z.boolean(),
  en: z.string().trim().min(1, 'Escreva a palavra em inglês.').max(200),
  pt: z.string().trim().min(1, 'Escreva o significado.').max(240),
})
export type QuickWordInput = z.infer<typeof QuickWordSchema>
