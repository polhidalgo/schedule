import { z } from 'zod'

export const dailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stress_level: z.number().int().min(1).max(10).nullable().optional(),
  fatigue_level: z.number().int().min(1).max(10).nullable().optional(),
  mood: z.enum(['very_low', 'low', 'neutral', 'good', 'very_good']).nullable().optional(),
  sleep_quality: z.number().int().min(1).max(10).nullable().optional(),
  pain_level: z.number().int().min(1).max(10).nullable().optional(),
  body_weight: z.number().min(20).max(300).nullable().optional(),
  hydration_liters: z.number().min(0).max(20).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  is_draft: z.boolean().optional(),
})

export type DailyLogInput = z.infer<typeof dailyLogSchema>

export const sessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  session_type: z.enum([
    'bjj_fundamentals', 'bjj_intermediate', 'bjj_advanced',
    'grappling_fundamentals', 'grappling_intermediate', 'grappling_advanced',
    'grappling_competition', 'open_mat', 'judo', 'wrestling_gi_nogi',
    'positional_training', 'strength_training', 'conditioning_training',
    'trayecto', 'trabajo', 'medico', 'fisio',
  ]),
  title: z.string().min(1).max(100),
  category: z.enum(['training', 'event']),
})

export type SessionInput = z.infer<typeof sessionSchema>
