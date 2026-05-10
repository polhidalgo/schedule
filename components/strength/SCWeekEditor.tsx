'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCExercisePicker } from './SCExercisePicker'
import { useSCExercises } from '@/hooks/useSC'
import type { SCProgramInput } from '@/lib/validations/sc'

type WeekData = SCProgramInput['weeks'][number]
type SessionData = WeekData['sessions'][number]
type ExerciseData = SessionData['exercises'][number]

interface SCWeekEditorProps {
  weeks: WeekData[]
  daysPerWeek: number
  onChange: (weeks: WeekData[]) => void
}

export function SCWeekEditor({ weeks, daysPerWeek, onChange }: SCWeekEditorProps) {
  const [activeWeekIdx, setActiveWeekIdx] = useState(0)
  const { data: exercises = [] } = useSCExercises()

  const currentWeek = weeks[activeWeekIdx]
  if (!currentWeek) return null

  function updateWeek(idx: number, update: Partial<WeekData>) {
    const updated = weeks.map((w, i) => (i === idx ? { ...w, ...update } : w))
    onChange(updated)
  }

  function updateSession(weekIdx: number, sessionNum: number, exercises: ExerciseData[]) {
    const w = weeks[weekIdx]
    const sessions = w.sessions.map(s =>
      s.session_number === sessionNum ? { ...s, exercises } : s
    )
    updateWeek(weekIdx, { sessions })
  }

  function addExercise(weekIdx: number, sessionNum: number) {
    const w = weeks[weekIdx]
    const session = w.sessions.find(s => s.session_number === sessionNum)
    if (!session) return
    const newEx: ExerciseData = {
      exercise_id: '',
      sets: 3,
      reps_target: '5',
      weight_target: null,
      rpe_target: null,
      sort_order: session.exercises.length,
      notes: null,
    }
    updateSession(weekIdx, sessionNum, [...session.exercises, newEx])
  }

  function removeExercise(weekIdx: number, sessionNum: number, exIdx: number) {
    const w = weeks[weekIdx]
    const session = w.sessions.find(s => s.session_number === sessionNum)
    if (!session) return
    updateSession(weekIdx, sessionNum, session.exercises.filter((_, i) => i !== exIdx))
  }

  function updateExercise(weekIdx: number, sessionNum: number, exIdx: number, patch: Partial<ExerciseData>) {
    const w = weeks[weekIdx]
    const session = w.sessions.find(s => s.session_number === sessionNum)
    if (!session) return
    const updated = session.exercises.map((ex, i) => i === exIdx ? { ...ex, ...patch } : ex)
    updateSession(weekIdx, sessionNum, updated)
  }

  function copyFromPrevious(weekIdx: number) {
    if (weekIdx === 0) return
    const prev = weeks[weekIdx - 1]
    updateWeek(weekIdx, {
      phase_name: prev.phase_name,
      rpe_target: prev.rpe_target,
      notes: prev.notes,
      sessions: prev.sessions.map(s => ({
        ...s,
        exercises: s.exercises.map(ex => ({ ...ex })),
      })),
    })
  }

  return (
    <div className="space-y-4">
      {/* Week tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {weeks.map((w, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveWeekIdx(i)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-medium transition-colors border',
              i === activeWeekIdx
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/50'
            )}
          >
            S{w.week_number}
          </button>
        ))}
      </div>

      {/* Week metadata */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Semana {currentWeek.week_number}</h3>
          {activeWeekIdx > 0 && (
            <button
              type="button"
              onClick={() => copyFromPrevious(activeWeekIdx)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar semana anterior
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Fase (ej. Acumulación)</label>
            <input
              type="text"
              value={currentWeek.phase_name ?? ''}
              onChange={e => updateWeek(activeWeekIdx, { phase_name: e.target.value || null })}
              placeholder="Opcional"
              className="w-full h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">RPE objetivo (ej. 7-8)</label>
            <input
              type="text"
              value={currentWeek.rpe_target ?? ''}
              onChange={e => updateWeek(activeWeekIdx, { rpe_target: e.target.value || null })}
              placeholder="Opcional"
              className="w-full h-8 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Sessions */}
      {Array.from({ length: daysPerWeek }, (_, i) => i + 1).map(sessionNum => {
        const session = currentWeek.sessions.find(s => s.session_number === sessionNum)
        const sessionExercises = session?.exercises ?? []

        return (
          <div key={sessionNum} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
              <span className="text-sm font-medium">Sesión {sessionNum}</span>
              <button
                type="button"
                onClick={() => addExercise(activeWeekIdx, sessionNum)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir ejercicio
              </button>
            </div>

            <div className="p-3 space-y-2">
              {sessionExercises.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Sin ejercicios — pulsa &quot;Añadir ejercicio&quot;
                </p>
              )}
              {sessionExercises.map((ex, exIdx) => {
                const catalog = exercises.find(e => e.id === ex.exercise_id)
                return (
                  <div key={exIdx} className="flex items-start gap-2 p-2 rounded-lg bg-background border border-border/50">
                    <GripVertical className="w-4 h-4 mt-1.5 text-muted-foreground shrink-0" />

                    <div className="flex-1 grid grid-cols-1 gap-2">
                      <SCExercisePicker
                        value={ex.exercise_id || null}
                        onChange={e => updateExercise(activeWeekIdx, sessionNum, exIdx, { exercise_id: e?.id ?? '' })}
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-0.5">Series</label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={ex.sets}
                            onChange={e => updateExercise(activeWeekIdx, sessionNum, exIdx, { sets: parseInt(e.target.value) || 1 })}
                            className="w-full h-7 rounded border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-0.5">Reps</label>
                          <input
                            type="text"
                            value={ex.reps_target}
                            onChange={e => updateExercise(activeWeekIdx, sessionNum, exIdx, { reps_target: e.target.value })}
                            placeholder="5 ó 6-8"
                            className="w-full h-7 rounded border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        {catalog?.requires_weight !== false && (
                          <div>
                            <label className="block text-[10px] text-muted-foreground mb-0.5">Peso (kg)</label>
                            <input
                              type="number"
                              min={0}
                              step={2.5}
                              value={ex.weight_target ?? ''}
                              onChange={e => updateExercise(activeWeekIdx, sessionNum, exIdx, { weight_target: e.target.value ? parseFloat(e.target.value) : null })}
                              placeholder="—"
                              className="w-full h-7 rounded border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeExercise(activeWeekIdx, sessionNum, exIdx)}
                      className="mt-1 p-1 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
