'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { SCVolumePoint } from '@/lib/sc/types'

interface SCVolumeChartProps {
  data: SCVolumePoint[]
}

export function SCVolumeChart({ data }: SCVolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Sin datos de volumen aún
      </div>
    )
  }

  const chartData = data.map(d => ({
    name: d.week_label,
    volumen: d.total_volume,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}`} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(val) => [`${Number(val).toLocaleString()} kg·rep`, 'Volumen']}
        />
        <Bar dataKey="volumen" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
