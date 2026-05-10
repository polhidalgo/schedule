'use client'

import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { SCWeightPoint } from '@/lib/sc/types'

const LINE_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2']

interface SCProgressChartProps {
  data: SCWeightPoint[]
}

export function SCProgressChart({ data }: SCProgressChartProps) {
  const exercises = useMemo(() => {
    const seen = new Map<string, string>()
    for (const p of data) seen.set(p.exercise_id, p.exercise_name)
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [data])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(exercises.slice(0, 3).map(e => e.id))
  )

  // Build chart data: each row is a week, columns are exercises
  const chartData = useMemo(() => {
    const weekMap = new Map<number, Record<string, number>>()
    for (const p of data) {
      if (!weekMap.has(p.week_number)) weekMap.set(p.week_number, {})
      weekMap.get(p.week_number)![p.exercise_id] = p.max_weight
    }
    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([wk, vals]) => ({ name: `S${wk}`, ...vals }))
  }, [data])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Sin datos de progreso aún
      </div>
    )
  }

  function toggleExercise(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      {/* Exercise filter */}
      <div className="flex flex-wrap gap-1.5">
        {exercises.map((ex, i) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => toggleExercise(ex.id)}
            style={selectedIds.has(ex.id) ? { background: LINE_COLORS[i % LINE_COLORS.length] + '15', borderColor: LINE_COLORS[i % LINE_COLORS.length], color: LINE_COLORS[i % LINE_COLORS.length] } : {}}
            className="px-2 py-0.5 rounded-full text-xs border border-border text-muted-foreground transition-colors"
          >
            {ex.name}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="kg" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(val) => [`${val}kg`, '']}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {exercises
            .filter(ex => selectedIds.has(ex.id))
            .map((ex, i) => (
              <Line
                key={ex.id}
                type="monotone"
                dataKey={ex.id}
                name={ex.name}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))
          }
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
