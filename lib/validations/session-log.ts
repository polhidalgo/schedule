import { z } from 'zod'

export const sessionLogSchema = z.object({
  session_id: z.string().uuid(),
  attended: z.boolean(),
  rpe: z.number().int().min(1).max(10).nullable().optional(),
  fatigue: z.number().int().min(1).max(10).nullable().optional(),
  technical_quality: z.number().int().min(1).max(10).nullable().optional(),
  intensity: z.enum(['low', 'medium', 'high']).nullable().optional(),
  injuries_notes: z.string().max(1000).nullable().optional(),
  sparring_rounds: z.number().int().min(0).max(100).nullable().optional(),
  techniques_practiced: z.string().max(1000).nullable().optional(),
  general_notes: z.string().max(2000).nullable().optional(),
})

export type SessionLogInput = z.infer<typeof sessionLogSchema>
