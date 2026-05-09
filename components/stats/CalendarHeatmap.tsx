'use client'

import { useMemo } from 'react'
import { format, eachDayOfInterval, parseISO, subDays, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface CalendarHeatmapProps {
  data: Record<string, number>  // date -> count
  days?: number
}

export function CalendarHeatmap({ data, days = 90 }: CalendarHeatmapProps) {
  const today = new Date()
  const startDate = subDays(today, days)

  const allDays = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: today })
  }, [days])

  const maxCount = Math.max(...Object.values(data), 1)

  function getIntensity(count: number): string {
    if (count === 0) return 'bg-secondary/30'
    const ratio = count / maxCount
    if (ratio <= 0.25) return 'bg-primary/20'
    if (ratio <= 0.5)  return 'bg-primary/40'
    if (ratio <= 0.75) return 'bg-primary/70'
    return 'bg-primary'
  }

  // Group by week
  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  // Pad first week
  const firstDayOfWeek = getDay(allDays[0]) === 0 ? 6 : getDay(allDays[0]) - 1 // 0=Mon
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(new Date(0)) // placeholder
  }

  for (const day of allDays) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(new Date(0))
    weeks.push(currentWeek)
  }

  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map(d => (
            <div key={d} className="w-4 h-4 flex items-center justify-center text-[9px] text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Heatmap grid - rotated to columns = weeks */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                if (day.getTime() === 0) {
                  return <div key={di} className="w-4 h-4" />
                }
                const dateStr = format(day, 'yyyy-MM-dd')
                const count = data[dateStr] ?? 0
                return (
                  <div
                    key={di}
                    title={`${format(day, 'd MMM', { locale: es })}: ${count} sesión(es)`}
                    className={cn('w-4 h-4 rounded-sm transition-colors', getIntensity(count))}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Menos</span>
        {['bg-secondary/30', 'bg-primary/20', 'bg-primary/40', 'bg-primary/70', 'bg-primary'].map(c => (
          <div key={c} className={cn('w-3 h-3 rounded-sm', c)} />
        ))}
        <span>Más</span>
      </div>
    </div>
  )
}
