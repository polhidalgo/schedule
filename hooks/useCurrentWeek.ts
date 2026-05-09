'use client'

import { useState } from 'react'
import { addWeeks, subWeeks } from 'date-fns'
import { getMondayOfWeek, formatDateKey } from '@/lib/schedule/utils'

export function useCurrentWeek() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek())

  const weekStartStr = formatDateKey(weekStart)

  function goToNextWeek() {
    setWeekStart(prev => addWeeks(prev, 1))
  }

  function goToPrevWeek() {
    setWeekStart(prev => subWeeks(prev, 1))
  }

  function goToCurrentWeek() {
    setWeekStart(getMondayOfWeek())
  }

  const isCurrentWeek = formatDateKey(weekStart) === formatDateKey(getMondayOfWeek())

  return { weekStart, weekStartStr, goToNextWeek, goToPrevWeek, goToCurrentWeek, isCurrentWeek }
}
