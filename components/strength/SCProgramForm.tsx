'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  normalizeScProgramMeta,
  scProgramMetaSchema,
  scProgramSchema,
  type SCProgramInput,
  type SCProgramMetaFormValues,
} from '@/lib/validations/sc'
import { SCWeekEditor } from './SCWeekEditor'
import { useCreateSCProgram, useUpdateSCProgram } from '@/hooks/useSC'
import type { SCProgramFull } from '@/lib/sc/types'
import type { SCImportResult } from '@/lib/sc/import'

const STEPS = ['Datos generales', 'Configurar semanas', 'Ejercicios por sesión']

interface SCProgramFormProps {
  existing?: SCProgramFull
  initialData?: SCImportResult
  onSuccess?: () => void
  onCancel?: () => void
}

function buildDefaultWeeks(totalWeeks: number, daysPerWeek: number): SCProgramInput['weeks'] {
  return Array.from({ length: totalWeeks }, (_, i) => ({
    week_number: i + 1,
    phase_name: null,
    rpe_target: null,
    notes: null,
    sessions: Array.from({ length: daysPerWeek }, (_, j) => ({
      session_number: j + 1,
      exercises: [],
    })),
  }))
}

function programToMetaFields(p: SCProgramFull): SCProgramMetaFormValues {
  const full = programToFormData(p)
  return {
    name: full.name,
    total_weeks: full.total_weeks,
    days_per_week: full.days_per_week,
    start_date: full.start_date ?? '',
    notes: full.notes ?? undefined,
  }
}

function programToFormData(p: SCProgramFull): SCProgramInput {
  return {
    name: p.name,
    total_weeks: p.total_weeks,
    days_per_week: p.days_per_week,
    start_date: p.start_date ?? null,
    notes: p.notes ?? null,
    weeks: p.weeks.map(w => ({
      week_number: w.week_number,
      phase_name: w.phase_name ?? null,
      rpe_target: w.rpe_target ?? null,
      notes: w.notes ?? null,
      sessions: (() => {
        // Group exercises by session_number
        const sessMap: Record<number, SCProgramInput['weeks'][number]['sessions'][number]> = {}
        for (const ex of (w.exercises ?? [])) {
          if (!sessMap[ex.session_number]) {
            sessMap[ex.session_number] = { session_number: ex.session_number, exercises: [] }
          }
          sessMap[ex.session_number].exercises.push({
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps_target: ex.reps_target,
            weight_target: ex.weight_target ?? null,
            rpe_target: ex.rpe_target ?? null,
            sort_order: ex.sort_order,
            notes: ex.notes ?? null,
          })
        }
        return Object.values(sessMap).sort((a, b) => a.session_number - b.session_number)
      })(),
    })),
  }
}

export function SCProgramForm({ existing, initialData, onSuccess, onCancel }: SCProgramFormProps) {
  const [step, setStep] = useState(0)
  const [weeks, setWeeks] = useState<SCProgramInput['weeks']>(() => {
    if (existing) return programToFormData(existing).weeks
    if (initialData) return initialData.weeks
    return []
  })

  const isEdit = !!existing
  const createProgram = useCreateSCProgram()
  const updateProgram = useUpdateSCProgram(existing?.id ?? '')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SCProgramMetaFormValues>({
    resolver: zodResolver(scProgramMetaSchema),
    defaultValues: existing
      ? programToMetaFields(existing)
      : initialData
        ? {
            name: initialData.program.name,
            total_weeks: initialData.program.total_weeks,
            days_per_week: initialData.program.days_per_week,
            start_date: initialData.program.start_date ?? '',
            notes: initialData.program.notes ?? undefined,
          }
        : {
            name: '',
            total_weeks: 8,
            days_per_week: 2,
            start_date: '',
            notes: undefined,
          },
  })

  const totalWeeks = watch('total_weeks') || 1
  const daysPerWeek = watch('days_per_week') || 1

  function ensureWeeks(tw: number, dpw: number) {
    setWeeks(prev => {
      const result = Array.from({ length: tw }, (_, i) => {
        const existing = prev.find(w => w.week_number === i + 1)
        if (existing) {
          // Adjust sessions count
          const sessions = Array.from({ length: dpw }, (_, j) => {
            return existing.sessions.find(s => s.session_number === j + 1) ?? {
              session_number: j + 1,
              exercises: [],
            }
          })
          return { ...existing, sessions }
        }
        return buildDefaultWeeks(1, dpw)[0] && {
          week_number: i + 1,
          phase_name: null,
          rpe_target: null,
          notes: null,
          sessions: Array.from({ length: dpw }, (_, j) => ({ session_number: j + 1, exercises: [] })),
        }
      }).filter(Boolean) as SCProgramInput['weeks']
      return result
    })
  }

  function goNext() {
    if (step === 0) {
      ensureWeeks(totalWeeks, daysPerWeek)
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  function goPrev() {
    setStep(s => Math.max(s - 1, 0))
  }

  function toastFirstMetaError(errors: import('react-hook-form').FieldErrors<SCProgramMetaFormValues>) {
    for (const key of Object.keys(errors) as (keyof SCProgramMetaFormValues)[]) {
      const err = errors[key]
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        toast.error(err.message)
        return
      }
    }
    toast.error('Revisa los datos del programa (paso 1).')
  }

  async function onSubmit(data: SCProgramMetaFormValues) {
    const payload: SCProgramInput = { ...normalizeScProgramMeta(data), weeks }
    const parsed = scProgramSchema.safeParse(payload)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const path = issue.path.join('.') || 'datos'
      toast.error(`${path}: ${issue.message}`)
      return
    }
    try {
      if (isEdit) {
        await updateProgram.mutateAsync(parsed.data)
        toast.success('Programa actualizado')
      } else {
        await createProgram.mutateAsync(parsed.data)
        toast.success('Programa creado')
      }
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const isBusy = createProgram.isPending || updateProgram.isPending

  return (
    <form
      onSubmit={handleSubmit(onSubmit, toastFirstMetaError)}
      className="flex flex-col flex-1 min-h-0"
    >
      {/* Step indicators */}
      <div className="flex shrink-0 items-center gap-2 px-4 pt-4 pb-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
              i < step ? 'bg-primary text-white' : i === step ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
            )}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={cn('text-xs truncate', i === step ? 'font-medium' : 'text-muted-foreground hidden sm:block')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-border shrink-0" />}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-4 touch-pan-y">
        {/* Step 1: Info */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre del programa *</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Ej. Bloque Fuerza Base 1"
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Semanas totales *</label>
                <input
                  {...register('total_weeks', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={52}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.total_weeks && <p className="text-xs text-destructive mt-1">{errors.total_weeks.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Sesiones / semana *</label>
                <input
                  {...register('days_per_week', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={7}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.days_per_week && <p className="text-xs text-destructive mt-1">{errors.days_per_week.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Fecha de inicio</label>
              <input
                {...register('start_date')}
                type="date"
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Notas</label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Objetivo del bloque, observaciones…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Week metadata */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configura la fase y RPE objetivo de cada semana.
            </p>
            {weeks.map((week, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold w-8">S{week.week_number}</span>
                  <input
                    type="text"
                    value={week.phase_name ?? ''}
                    onChange={e => {
                      const updated = weeks.map((w, j) => j === i ? { ...w, phase_name: e.target.value || null } : w)
                      setWeeks(updated)
                    }}
                    placeholder="Fase (ej. Acumulación)"
                    className="flex-1 h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={week.rpe_target ?? ''}
                    onChange={e => {
                      const updated = weeks.map((w, j) => j === i ? { ...w, rpe_target: e.target.value || null } : w)
                      setWeeks(updated)
                    }}
                    placeholder="RPE (ej. 7-8)"
                    className="w-24 h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Exercises */}
        {step === 2 && (
          <SCWeekEditor
            weeks={weeks}
            daysPerWeek={daysPerWeek}
            onChange={setWeeks}
          />
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3 border-t border-border bg-card">
        <button
          type="button"
          onClick={step === 0 ? onCancel : goPrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
        >
          {step === 0 ? 'Cancelar' : <><ChevronLeft className="w-4 h-4" /> Anterior</>}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isBusy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isEdit ? 'Guardar cambios' : 'Crear programa'}
          </button>
        )}
      </div>
    </form>
  )
}
