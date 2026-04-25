import * as z from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Nome de usuário é obrigatório'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const packSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
})

export type PackFormData = z.infer<typeof packSchema>

export const cardSchema = z.object({
  en: z.string().min(1, 'Frase em inglês é obrigatória'),
  pt: z.string().min(1, 'Tradução em português é obrigatória'),
  order_index: z.number().int().min(0).optional(),
})

export type CardFormData = z.infer<typeof cardSchema>

export const assignmentSchema = z.object({
  user_id: z.union([z.string().uuid('Usuário inválido'), z.literal('all')]),
  pack_id: z.string().uuid('Pack inválido'),
  game_mode: z.enum(['multiple_choice', 'flashcard', 'typing', 'matching', 'listening', 'speaking']),
  assigned_date: z.string().optional(),
})

export type AssignmentFormData = z.infer<typeof assignmentSchema>
