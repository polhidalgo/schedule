'use client'

import { useState } from 'react'
import { WeekGrid } from '@/components/week/WeekGrid'
import { TimetableToggle } from '@/components/week/TimetableToggle'
import { useSessions } from '@/hooks/useSessions'
import { useCurrentWeek } from '@/hooks/useCurrentWeek'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { DAY_NAMES, DAY_NAMES_FULL } from '@/lib/schedule/types'
import { cn } from '@/lib/utils'
import { formatDateKey } from '@/lib/schedule/utils'
import type { TimetableType } from '@/lib/schedule/types'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

function useWeekMeta(weekStart: string) {
  return useQuery({
    queryKey: ['week-meta', weekStart],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('weeks')
        .select('active_timetable, id')
        .eq('week_start', weekStart)
        .single()
      return data
    },
    staleTime: 10_000,
  })
}

export default function WeekPage() {
  const { weekStart, weekStartStr, goToNextWeek, goToPrevWeek, goToCurrentWeek, isCurrentWeek } = useCurrentWeek()
  const { data: sessions, isLoading, error } = useSessions(weekStartStr)
  const { data: weekMeta } = useWeekMeta(weekStartStr)
  const isMobile = useIsMobile()

  const [mobileDayIndex, setMobileDayIndex] = useState<number>(() => {
    const today = new Date().getDay()
    return today === 0 ? 6 : today - 1
  })

  const weekEnd = addDays(parseISO(weekStartStr), 6)
  const weekLabel = `${format(parseISO(weekStartStr), 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM yyyy', { locale: es })}`

  const today = formatDateKey(new Date())
  const activeTimetable: TimetableType = (weekMeta?.active_timetable as TimetableType) ?? 'A'

  const activeDayDate = addDays(parseISO(weekStartStr), mobileDayIndex)
  const activeDayLabel = `${DAY_NAMES_FULL[mobileDayIndex]} · ${format(activeDayDate, 'd MMM', { locale: es })}`

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPrevWeek} className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center px-1">
            <p className="text-sm font-semibold">{weekLabel}</p>
            {isCurrentWeek ? (
              <p className="text-[11px] text-primary leading-none">Semana actual</p>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-none">Otra semana</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextWeek} className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isCurrentWeek && (
            <Button variant="ghost" size="icon" onClick={goToCurrentWeek} className="h-8 w-8 text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        <TimetableToggle
          weekStart={weekStartStr}
          activeTimetable={activeTimetable}
        />
      </div>

      {/* Mobile day strip */}
      {isMobile && (
        <div className="flex border-b border-border bg-background">
          {DAY_NAMES.map((name, i) => {
            const date = formatDateKey(addDays(parseISO(weekStartStr), i))
            const isActive = mobileDayIndex === i
            const isTodayDay = date === today
            return (
              <button
                key={i}
                onClick={() => setMobileDayIndex(i)}
                aria-label={DAY_NAMES_FULL[i]}
                aria-pressed={isActive}
                className={cn(
                  'flex-1 flex flex-col items-center py-2.5 transition-colors text-xs border-b-2',
                  isActive
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground'
                )}
              >
                <span className="font-medium text-[11px]">{name}</span>
                <span className={cn(
                  'text-[15px] font-bold leading-none mt-0.5 tnum',
                  !isActive && isTodayDay && 'text-primary'
                )}>
                  {addDays(parseISO(weekStartStr), i).getDate()}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isMobile && (
          <div className="flex items-baseline justify-between mb-4 px-1">
            <h2 className="text-[17px] font-bold text-foreground">
              {activeDayLabel.split(' · ')[0]}{' '}
              <span className="font-medium text-muted-foreground">
                · {activeDayLabel.split(' · ')[1]}
              </span>
            </h2>
          </div>
        )}

        {isLoading ? (
          <WeekSkeleton isMobile={isMobile ?? false} />
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Error cargando sesiones. Intenta de nuevo.
          </div>
        ) : (
          <WeekGrid
            weekStart={weekStartStr}
            sessions={sessions ?? []}
            activeDayIndex={isMobile ? mobileDayIndex : undefined}
            mobileMode={isMobile ?? false}
          />
        )}
      </div>
    </div>
  )
}

function WeekSkeleton({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-7 gap-2.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          {Array.from({ length: i % 3 === 0 ? 2 : 1 }).map((_, j) => (
            <Skeleton key={j} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  )
}
