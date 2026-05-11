import { z } from 'zod'

export const scProgramExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  sets: z.number().int().min(1).max(20),
  reps_target: z.string().min(1).max(30),
  weight_target: z.number().min(0).max(1000).nullable().optional(),
  rpe_target: z.string().max(20).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  notes: z.string().max(1000).nullable().optional(),
})

export const scSessionSchema = z.object({
  session_number: z.number().int().min(1),
  exercises: z.array(scProgramExerciseSchema),
})

export const scWeekSchema = z.object({
  week_number: z.number().int().min(1).max(52),
  phase_name: z.string().max(100).nullable().optional(),
  rpe_target: z.string().max(20).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  sessions: z.array(scSessionSchema),
})

/**
 * Paso 1 del wizard (`react-hook-form`). Fecha/notas sin transform para que el Resolver no rompa tipos.
 * Vacío → se normaliza a `null` en `normalizeScProgramMeta` al guardar.
 */
export const scProgramMetaSchema = z.object({
  name: z.string().min(1).max(100),
  total_weeks: z
    .number({ error: 'Indica número de semanas válido.' })
    .int()
    .min(1)
    .max(52)
    .refine(Number.isFinite, 'Indica número de semanas válido.'),
  days_per_week: z
    .number({ error: 'Indica sesiones por semana.' })
    .int()
    .min(1)
    .max(7)
    .refine(Number.isFinite, 'Indica sesiones por semana.'),
  start_date: z
    .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
    .optional(),
  notes: z.string().max(1000).optional(),
})

export type SCProgramMetaFormValues = z.infer<typeof scProgramMetaSchema>

const scProgramPayloadCore = z.object({
  name: z.string().min(1).max(100),
  total_weeks: z.number().int().min(1).max(52),
  days_per_week: z.number().int().min(1).max(7),
  start_date: z.union([z.null(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  notes: z.union([z.null(), z.string().max(1000)]),
})

export function normalizeScProgramMeta(
  meta: SCProgramMetaFormValues
): z.infer<typeof scProgramPayloadCore> {
  return {
    name: meta.name,
    total_weeks: meta.total_weeks,
    days_per_week: meta.days_per_week,
    start_date: meta.start_date && meta.start_date !== '' ? meta.start_date : null,
    notes: meta.notes?.trim() ? meta.notes.trim() : null,
  }
}

/** Cuerpo completo válido para API y mutaciones (incl. semanas anidadas). */
export const scProgramSchema = scProgramPayloadCore.extend({
  weeks: z.array(scWeekSchema),
})

export type SCProgramInput = z.infer<typeof scProgramSchema>

export const scSetLogSchema = z.object({
  exercise_id: z.string().uuid(),
  set_number: z.number().int().min(1),
  weight_used: z.number().min(0).max(1000).nullable().optional(),
  reps_completed: z.number().int().min(0).max(1000).nullable().optional(),
  completed: z.boolean().default(true),
  notes: z.string().max(500).nullable().optional(),
})

export const scSessionLogSchema = z.object({
  program_id: z.string().uuid(),
  week_number: z.number().int().min(1),
  session_number: z.number().int().min(1),
  timetable_session_id: z.string().uuid().nullable().optional(),
  attended: z.boolean().default(true),
  notes: z.string().max(1000).nullable().optional(),
  set_logs: z.array(scSetLogSchema),
})

export type SCSessionLogInput = z.infer<typeof scSessionLogSchema>
