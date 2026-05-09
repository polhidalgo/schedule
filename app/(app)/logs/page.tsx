'use client'

import { useState } from 'react'
import { DailyLogForm } from '@/components/logs/DailyLogForm'
import { SleepTracker } from '@/components/logs/SleepTracker'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatDateKey } from '@/lib/schedule/utils'

export default function LogsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()))

  const isToday = selectedDate === formatDateKey(new Date())

  function goToPrev() {
    setSelectedDate(formatDateKey(subDays(parseISO(selectedDate), 1)))
  }

  function goToNext() {
    if (!isToday) {
      setSelectedDate(formatDateKey(addDays(parseISO(selectedDate), 1)))
    }
  }

  const dayLabel = format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={goToPrev} className="h-8 w-8">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold capitalize">{dayLabel}</p>
          {isToday && <p className="text-xs text-primary">Hoy</p>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={isToday}
          className="h-8 w-8 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 max-w-lg mx-auto w-full space-y-4">
        <SleepTracker />
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <h2 className="text-sm font-semibold mb-4">Registro del Día</h2>
          <DailyLogForm date={selectedDate} />
        </div>
      </div>
    </div>
  )
}
