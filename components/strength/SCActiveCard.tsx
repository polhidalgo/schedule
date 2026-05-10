'use client'

import { CheckCircle2, Clock, TrendingUp, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SCActiveProgram } from '@/lib/sc/types'
import { useSCSessionLogs } from '@/hooks/useSC'

interface SCActiveCardProps {
  program: SCActiveProgram
}

export function SCActiveCard({ program }: SCActiveCardProps) {
  const { data: logs = [] } = useSCSessionLogs(program.id, program.current_week_number)

  const currentWeek = program.weeks.find(w => w.week_number === program.current_week_number)
  const totalSessions = program.days_per_week
  const completedSessions = logs.filter(l => l.attended || !l.attended).length // all logged (attended or not)
  const attendedSessions = logs.filter(l => l.attended).length

  const progressPct = program.total_weeks > 0
    ? Math.round(((program.current_week_number - 1) / program.total_weeks) * 100)
    : 0

  // Next pending session
  const loggedSessionNums = new Set(logs.map(l => l.session_number))
  const nextPending = Array.from({ length: totalSessions }, (_, i) => i + 1)
    .find(n => !loggedSessionNums.has(n))

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Programa activo</p>
            <h2 className="font-semibold text-base leading-tight">{program.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold leading-none">{program.current_week_number}</p>
            <p className="text-xs text-muted-foreground">/ {program.total_weeks} sem</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Progreso total</span>
          <span className="text-xs font-medium">{progressPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-0 px-4 py-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg font-bold">{attendedSessions}/{totalSessions}</p>
          <p className="text-[10px] text-muted-foreground">Esta semana</p>
        </div>
        <div className="text-center border-x border-border">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg font-bold">
            {totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0}%
          </p>
          <p className="text-[10px] text-muted-foreground">Asistencia</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg font-bold">{currentWeek?.rpe_target ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground">RPE obj.</p>
        </div>
      </div>

      {/* Next pending session */}
      {nextPending !== undefined && (
        <div className="mx-4 mb-4 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary">SESIÓN {nextPending} pendiente</p>
              {currentWeek?.phase_name && (
                <p className="text-[10px] text-muted-foreground">{currentWeek.phase_name}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sessions list for current week */}
      {completedSessions > 0 && (
        <div className="px-4 pb-4 space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Esta semana</p>
          {logs.map(log => (
            <div
              key={log.id}
              className={cn(
                'flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg',
                log.attended ? 'bg-green-50 text-green-700' : 'bg-muted/50 text-muted-foreground line-through'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Sesión {log.session_number}</span>
              {!log.attended && <span className="ml-auto">No asistí</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
