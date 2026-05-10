'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SCSetRow, type SetRowValue } from './SCSetRow'
import { useUpsertSCSessionLog } from '@/hooks/useSC'
import type { SCActiveProgram } from '@/lib/sc/types'
import type { Session } from '@/lib/schedule/types'

interface SCSessionLoggerProps {
  session: Session
  program: SCActiveProgram
  onSuccess?: () => void
}

type ExerciseSetState = SetRowValue[]

export function SCSessionLogger({ session, program, onSuccess }: SCSessionLoggerProps) {
  const upsert = useUpsertSCSessionLog()

  const [attended, setAttended] = useState(true)
  const [notes, setNotes] = useState('')
  const [selectedSessionNum, setSelectedSessionNum] = useState<number>(1)
  const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(new Set())

  // Get current week's data
  const currentWeek = program.weeks.find(w => w.week_number === program.current_week_number)
  const sessionNums = Array.from(new Set(
    (currentWeek?.exercises ?? []).map(e => e.session_number)
  )).sort()

  // Get exercises for the selected session, sorted
  const sessionExercises = useMemo(() => {
    return (currentWeek?.exercises ?? [])
      .filter(e => e.session_number === selectedSessionNum)
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [currentWeek, selectedSessionNum])

  // Initialize set state for each exercise
  const [setStates, setSetStates] = useState<Record<string, ExerciseSetState>>(() => {
    const initial: Record<string, ExerciseSetState> = {}
    for (const ex of sessionExercises) {
      initial[ex.id] = Array.from({ length: ex.sets }, () => ({
        weight_used: ex.weight_target ?? null,
        reps_completed: null,
        completed: false,
      }))
    }
    return initial
  })

  // Reinitialize when exercises change (session selection changes)
  const exerciseKey = sessionExercises.map(e => e.id).join(',')
  const [prevKey, setPrevKey] = useState(exerciseKey)
  if (exerciseKey !== prevKey) {
    setPrevKey(exerciseKey)
    const fresh: Record<string, ExerciseSetState> = {}
    for (const ex of sessionExercises) {
      fresh[ex.id] = Array.from({ length: ex.sets }, () => ({
        weight_used: ex.weight_target ?? null,
        reps_completed: null,
        completed: false,
      }))
    }
    setSetStates(fresh)
  }

  function updateSet(exerciseId: string, setIdx: number, val: SetRowValue) {
    setSetStates(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) => i === setIdx ? val : s),
    }))
  }

  function toggleCollapse(exId: string) {
    setCollapsedExercises(prev => {
      const next = new Set(prev)
      if (next.has(exId)) next.delete(exId)
      else next.add(exId)
      return next
    })
  }

  async function handleSave() {
    const setLogs = attended
      ? sessionExercises.flatMap(ex =>
          (setStates[ex.id] ?? []).map((s, i) => ({
            exercise_id: ex.exercise_id,
            set_number: i + 1,
            weight_used: s.weight_used,
            reps_completed: s.reps_completed,
            completed: s.completed,
            notes: null,
          }))
        )
      : []

    try {
      await upsert.mutateAsync({
        program_id: program.id,
        week_number: program.current_week_number,
        session_number: selectedSessionNum,
        timetable_session_id: session.id,
        attended,
        notes: notes || null,
        set_logs: setLogs,
      })
      toast.success(attended ? 'Sesión registrada' : 'Sesión marcada como no asistida')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const completedSets = Object.values(setStates).flat().filter(s => s.completed).length
  const totalSets = Object.values(setStates).flat().length

  return (
    <div className="space-y-4">
      {/* Program context */}
      <div className="rounded-xl bg-muted/50 border border-border px-3 py-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{program.name}</span>
          {' · '}Semana {program.current_week_number}/{program.total_weeks}
          {currentWeek?.phase_name && ` · ${currentWeek.phase_name}`}
        </p>
      </div>

      {/* Session selector */}
      {sessionNums.length > 1 && (
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Sesión</label>
          <div className="flex gap-2">
            {sessionNums.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setSelectedSessionNum(n)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  selectedSessionNum === n
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/50'
                )}
              >
                Sesión {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attended toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setAttended(true)}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors',
            attended
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
          )}
        >
          <CheckCircle2 className="w-4 h-4" /> Asistí
        </button>
        <button
          type="button"
          onClick={() => setAttended(false)}
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors',
            !attended
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
          )}
        >
          <XCircle className="w-4 h-4" /> No asistí
        </button>
      </div>

      {/* Exercise list */}
      {attended && (
        <>
          {sessionExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin ejercicios planificados para esta sesión
            </p>
          ) : (
            <div className="space-y-3">
              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Series completadas</span>
                <span className="font-medium">{completedSets}/{totalSets}</span>
              </div>

              {sessionExercises.map(ex => {
                const sets = setStates[ex.id] ?? []
                const doneCount = sets.filter(s => s.completed).length
                const isCollapsed = collapsedExercises.has(ex.id)
                const catalog = ex.exercise
                const requiresWeight = catalog?.requires_weight !== false

                return (
                  <div key={ex.id} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(ex.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{catalog?.name ?? ex.exercise_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.sets}×{ex.reps_target}
                          {ex.weight_target ? ` · ${ex.weight_target}kg` : ''}
                          {ex.rpe_target ? ` · RPE ${ex.rpe_target}` : ''}
                        </p>
                      </div>
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        doneCount === ex.sets ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                      )}>
                        {doneCount}/{ex.sets}
                      </span>
                      {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {!isCollapsed && (
                      <div className="px-3 pb-3 space-y-1.5 border-t border-border">
                        {/* Column labels */}
                        <div className="flex items-center gap-3 px-3 pt-2 text-[10px] text-muted-foreground uppercase tracking-wide">
                          <span className="w-5">#</span>
                          {requiresWeight && <span className="w-20">Peso</span>}
                          <span className="w-16">Reps</span>
                          <span className="ml-auto">✓</span>
                        </div>
                        {sets.map((setVal, setIdx) => (
                          <SCSetRow
                            key={setIdx}
                            setNumber={setIdx + 1}
                            targetWeight={ex.weight_target}
                            targetReps={ex.reps_target}
                            requiresWeight={requiresWeight}
                            value={setVal}
                            onChange={val => updateSet(ex.id, setIdx, val)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Notas de la sesión</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Observaciones, sensaciones…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={upsert.isPending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        {upsert.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        Guardar sesión
      </button>
    </div>
  )
}
