'use client'

import { Dumbbell, Target, CheckCircle2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SCStatsData } from '@/lib/sc/types'

interface SCAdherenceKPIsProps {
  data: SCStatsData
}

function KPICard({ icon, label, value, unit, color }: {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  color?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', color ?? 'text-foreground')}>
        {value}
        <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  )
}

export function SCAdherenceKPIs({ data }: SCAdherenceKPIsProps) {
  const attendanceColor =
    data.adherenceRate >= 80 ? 'text-green-500' :
    data.adherenceRate >= 60 ? 'text-yellow-500' : 'text-red-500'

  const setsColor =
    data.setAdherenceRate >= 80 ? 'text-green-500' :
    data.setAdherenceRate >= 60 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          icon={<Dumbbell className="w-4 h-4" />}
          label="Sesiones"
          value={data.sessionsCompleted}
          unit={`/ ${data.sessionsTotal}`}
        />
        <KPICard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Asistencia"
          value={data.adherenceRate}
          unit="%"
          color={attendanceColor}
        />
        <KPICard
          icon={<Target className="w-4 h-4" />}
          label="Series"
          value={data.setsCompleted}
          unit={`/ ${data.setsTotal}`}
        />
        <KPICard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Adhes. series"
          value={data.setAdherenceRate}
          unit="%"
          color={setsColor}
        />
      </div>

      {/* Per-exercise adherence */}
      {data.exerciseAdherence.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Por ejercicio</p>
          {data.exerciseAdherence
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 6)
            .map(ex => (
              <div key={ex.exercise_id} className="flex items-center gap-2">
                <span className="text-xs flex-1 truncate">{ex.name}</span>
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', ex.rate >= 80 ? 'bg-green-500' : ex.rate >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
                    style={{ width: `${Math.min(ex.rate, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{ex.rate}%</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
