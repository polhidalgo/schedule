'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AttendanceChart } from '@/components/stats/AttendanceChart'
import { RPEFatigueChart } from '@/components/stats/RPEFatigueChart'
import { SleepChart } from '@/components/stats/SleepChart'
import { WeightChart } from '@/components/stats/WeightChart'
import { CalendarHeatmap } from '@/components/stats/CalendarHeatmap'
import { SCProgressChart } from '@/components/strength/SCProgressChart'
import { SCVolumeChart } from '@/components/strength/SCVolumeChart'
import { SCAdherenceKPIs } from '@/components/strength/SCAdherenceKPIs'
import { Skeleton } from '@/components/ui/skeleton'
import { Dumbbell, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useActiveSCProgram, useSCStats } from '@/hooks/useSC'

type Range = 'week' | 'month' | '3months'

const RANGES: { value: Range; label: string }[] = [
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: '3months', label: '90d' },
]

interface StatsData {
  summary: {
    totalSessions: number
    totalAttendance: number
    attendanceRate: number
    avgRpe: number | null
    totalHours: number
    range: string
    fromDate: string
    toDate: string
  }
  attendanceByType: Record<string, { total: number; attended: number }>
  rpeByType: Record<string, number>
  fatigueByType: Record<string, number>
  sessionsPerDay: Record<string, number>
  weightData: { date: string; weight: number | null }[]
  sleepData: { date: string | null; hours: number | null }[]
  wellnessData: unknown[]
}

function useStats(range: Range) {
  return useQuery<StatsData>({
    queryKey: ['stats', range],
    queryFn: async () => {
      const res = await fetch(`/api/stats?range=${range}`)
      if (!res.ok) throw new Error('Error cargando estadísticas')
      return res.json()
    },
    staleTime: 5 * 60_000,
  })
}

type StatsTab = 'training' | 'strength'

export default function StatsPage() {
  const [range, setRange] = useState<Range>('month')
  const [statsTab, setStatsTab] = useState<StatsTab>('training')
  const { data, isLoading } = useStats(range)
  const { data: activeProgram } = useActiveSCProgram()
  const { data: scStats, isLoading: scLoading } = useSCStats(activeProgram?.id ?? null)

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 sticky top-0 z-10">
        <h1 className="font-semibold">Estadísticas</h1>
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                range === r.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border/50 px-4 bg-card/50">
        <button
          onClick={() => setStatsTab('training')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            statsTab === 'training' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Entrenamiento
        </button>
        {activeProgram && (
          <button
            onClick={() => setStatsTab('strength')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              statsTab === 'strength' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Fuerza
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 max-w-2xl mx-auto w-full space-y-4">
      {/* ── Fuerza tab ── */}
      {statsTab === 'strength' && activeProgram && (
        <>
          {scLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : scStats ? (
            <>
              <ChartCard title="KPIs" subtitle={`${scStats.programName} · ${scStats.totalWeeks} semanas`}>
                <SCAdherenceKPIs data={scStats} />
              </ChartCard>
              <ChartCard title="Progresión de peso" subtitle="Máximo levantado por semana (kg)">
                <SCProgressChart data={scStats.weightProgression} />
              </ChartCard>
              <ChartCard title="Volumen semanal" subtitle="Tonelaje total (kg × reps)">
                <SCVolumeChart data={scStats.weeklyVolume} />
              </ChartCard>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos S&C</p>
          )}
        </>
      )}

      {/* ── Training tab ── */}
      {statsTab === 'training' && (<>
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            icon={<Dumbbell className="w-4 h-4" />}
            label="Sesiones"
            value={isLoading ? null : data?.summary.totalSessions}
            unit="total"
          />
          <SummaryCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Asistencia"
            value={isLoading ? null : data?.summary.attendanceRate}
            unit="%"
            color={
              (data?.summary.attendanceRate ?? 0) >= 80 ? 'text-green-400' :
              (data?.summary.attendanceRate ?? 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
            }
          />
          <SummaryCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="RPE Promedio"
            value={isLoading ? null : data?.summary.avgRpe}
            unit="/10"
          />
          <SummaryCard
            icon={<Clock className="w-4 h-4" />}
            label="Horas"
            value={isLoading ? null : data?.summary.totalHours}
            unit="h"
          />
        </div>

        {/* Heatmap */}
        <ChartCard title="Actividad" subtitle="Sesiones por día">
          {isLoading ? <Skeleton className="h-40 w-full" /> : (
            <CalendarHeatmap
              data={data?.sessionsPerDay ?? {}}
              days={range === 'week' ? 7 : range === 'month' ? 30 : 90}
            />
          )}
        </ChartCard>

        {/* Attendance by type */}
        <ChartCard title="Asistencia por Tipo" subtitle="Sesiones asistidas vs planificadas">
          {isLoading ? <Skeleton className="h-52 w-full" /> : (
            <AttendanceChart data={data?.attendanceByType ?? {}} />
          )}
        </ChartCard>

        {/* RPE & Fatigue */}
        <ChartCard title="RPE y Cansancio" subtitle="Promedio por tipo de entrenamiento">
          <div className="flex gap-4 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />RPE
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm bg-orange-500" />Cansancio
            </div>
          </div>
          {isLoading ? <Skeleton className="h-52 w-full" /> : (
            <RPEFatigueChart
              rpeByType={data?.rpeByType ?? {}}
              fatigueByType={data?.fatigueByType ?? {}}
            />
          )}
        </ChartCard>

        {/* Sleep */}
        <ChartCard
          title="Horas de Sueño"
          subtitle="Verde = 8h objetivo · Naranja = mínimo 6h"
        >
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            <SleepChart data={data?.sleepData ?? []} />
          )}
        </ChartCard>

        {/* Weight */}
        <ChartCard title="Evolución del Peso" subtitle="Peso corporal (kg)">
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            <WeightChart data={data?.weightData ?? []} />
          )}
        </ChartCard>
      </>)}
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number | null | undefined
  unit: string
  color?: string
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      {value === null || value === undefined ? (
        <Skeleton className="h-7 w-16" />
      ) : (
        <p className={cn('text-2xl font-bold', color ?? 'text-foreground')}>
          {value}
          <span className="text-sm font-normal text-muted-foreground ml-0.5">{unit}</span>
        </p>
      )}
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
