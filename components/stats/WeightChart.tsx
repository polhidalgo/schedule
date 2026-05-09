'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface WeightChartProps {
  data: { date: string; weight: number | null }[]
}

export function WeightChart({ data }: WeightChartProps) {
  const chartData = data
    .filter(d => d.weight)
    .map(d => ({
      label: format(parseISO(d.date), 'd MMM', { locale: es }),
      weight: d.weight,
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Sin datos de peso
      </div>
    )
  }

  const weights = chartData.map(d => d.weight ?? 0).filter(Boolean)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length

  return (
    <div className="space-y-2">
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Mín: <span className="text-foreground font-medium">{min.toFixed(1)}kg</span></span>
        <span>Máx: <span className="text-foreground font-medium">{max.toFixed(1)}kg</span></span>
        <span>Prom: <span className="text-foreground font-medium">{avg.toFixed(1)}kg</span></span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min - 1, max + 1]}
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
            formatter={(value) => [`${value}kg`, 'Peso']}
          />
          <ReferenceLine y={avg} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.4} />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
