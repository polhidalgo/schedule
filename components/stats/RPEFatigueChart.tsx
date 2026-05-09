'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { SESSION_TYPE_LABELS } from '@/lib/schedule/types'
import type { SessionType } from '@/lib/schedule/types'

interface RPEFatigueChartProps {
  rpeByType: Record<string, number>
  fatigueByType: Record<string, number>
}

export function RPEFatigueChart({ rpeByType, fatigueByType }: RPEFatigueChartProps) {
  const allTypes = new Set([...Object.keys(rpeByType), ...Object.keys(fatigueByType)])

  const chartData = Array.from(allTypes)
    .map(type => ({
      name: SESSION_TYPE_LABELS[type as SessionType]?.split(' ').slice(0, 2).join(' ') ?? type,
      fullName: SESSION_TYPE_LABELS[type as SessionType] ?? type,
      rpe: rpeByType[type] ? Math.round(rpeByType[type] * 10) / 10 : null,
      fatigue: fatigueByType[type] ? Math.round(fatigueByType[type] * 10) / 10 : null,
    }))
    .filter(d => d.rpe || d.fatigue)
    .sort((a, b) => (b.rpe ?? 0) - (a.rpe ?? 0))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Sin datos de RPE/Cansancio
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 10]}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
          formatter={(value, name) => [value, name === 'rpe' ? 'RPE Promedio' : 'Cansancio Promedio']}
        />
        <Bar dataKey="rpe" fill="#3b82f6" radius={[4, 4, 0, 0]} name="rpe" />
        <Bar dataKey="fatigue" fill="#f97316" radius={[4, 4, 0, 0]} name="fatigue" />
      </BarChart>
    </ResponsiveContainer>
  )
}
