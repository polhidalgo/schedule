'use client'

import { useState } from 'react'
import { DayColumn } from './DayColumn'
import { SessionModal } from './SessionModal'
import { AddSessionModal } from './AddSessionModal'
import type { Session } from '@/lib/schedule/types'
import { getWeekDates, formatDateKey } from '@/lib/schedule/utils'
import { parseISO } from 'date-fns'

interface WeekGridProps {
  weekStart: string
  sessions: Session[]
  activeDayIndex?: number  // for mobile single-day view
  mobileMode?: boolean
}

export function WeekGrid({ weekStart, sessions, activeDayIndex, mobileMode = false }: WeekGridProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [addDate, setAddDate] = useState<string | null>(null)

  const weekDates = getWeekDates(parseISO(weekStart))

  function getSessionsForDate(dateStr: string): Session[] {
    return sessions
      .filter(s => s.date === dateStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const daysToShow = mobileMode && activeDayIndex !== undefined
    ? [activeDayIndex]
    : Array.from({ length: 7 }, (_, i) => i)

  return (
    <>
      <div
        className={
          mobileMode
            ? 'block'
            : 'grid grid-cols-7 gap-2'
        }
      >
        {daysToShow.map(dayIndex => {
          const date = weekDates[dayIndex]
          const dateStr = formatDateKey(date)
          const daySessions = getSessionsForDate(dateStr)

          return (
            <DayColumn
              key={dateStr}
              date={dateStr}
              dayIndex={dayIndex}
              sessions={daySessions}
              onSessionClick={setSelectedSession}
              onAddClick={setAddDate}
              compact={!mobileMode}
            />
          )
        })}
      </div>

      <SessionModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      <AddSessionModal
        date={addDate}
        onClose={() => setAddDate(null)}
      />
    </>
  )
}
