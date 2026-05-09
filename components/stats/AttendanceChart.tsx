'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { SESSION_TYPE_LABELS } from '@/lib/schedule/types'
import type { SessionType } from '@/lib/schedule/types'

interface AttendanceChartProps {
  data: Record<string, { total: number; attended: number }>
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#f97316',
  '#10b981', '#6366f1', '#ec4899', '#14b8a6',
]

export function AttendanceChart({ data }: AttendanceChartProps) {
  const chartData = Object.entries(data)
    .map(([type, val]) => ({
      name: SESSION_TYPE_LABELS[type as SessionType]?.split(' ').slice(0, 2).join(' ') ?? type,
      fullName: SESSION_TYPE_LABELS[type as SessionType] ?? type,
      attended: val.attended,
      missed: val.total - val.attended,
      total: val.total,
      rate: val.total > 0 ? Math.round((val.attended / val.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Sin datos de asistencia
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
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: 12,
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value, name) => [
            value,
            name === 'attended' ? 'Asistidas' : 'No asistidas',
          ]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
        />
        <Bar dataKey="attended" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} name="attended" />
        <Bar dataKey="missed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="missed" />
      </BarChart>
    </ResponsiveContainer>
  )
}
