import { z } from 'zod'
export const TutorMessageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000), audioPermit:z.string().max(100).optional(), tip: z.string().max(4000).nullable().optional() })
export type TutorMessage = z.infer<typeof TutorMessageSchema>
const DraftSchema = z.object({version:z.literal(1),messages:z.array(TutorMessageSchema).max(24),input:z.string().max(2000)})
export function restoreTutorDraft(raw:string|null){try{return DraftSchema.parse(JSON.parse(raw||'null'))}catch{return null}}
