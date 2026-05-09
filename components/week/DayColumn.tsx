'use client'

import { SessionBlock } from './SessionBlock'
import type { Session } from '@/lib/schedule/types'
import { DAY_NAMES, DAY_NAMES_FULL } from '@/lib/schedule/types'
import { isToday } from '@/lib/schedule/utils'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface DayColumnProps {
  date: string  // YYYY-MM-DD
  dayIndex: number  // 0=Monday
  sessions: Session[]
  onSessionClick: (session: Session) => void
  onAddClick: (date: string) => void
  compact?: boolean
}

export function DayColumn({
  date,
  dayIndex,
  sessions,
  onSessionClick,
  onAddClick,
  compact = false,
}: DayColumnProps) {
  const today = isToday(date)
  const dayNum = new Date(date + 'T12:00:00').getDate()

  return (
    <div
      className={cn(
        'flex flex-col min-w-0',
        today && 'ring-1 ring-primary/30 rounded-xl'
      )}
    >
      {/* Day header */}
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-2 rounded-t-xl',
          today ? 'bg-primary/10' : 'bg-card/50'
        )}
      >
        <div className="flex flex-col items-center">
          <span className={cn('text-[10px] font-medium uppercase tracking-wider', today ? 'text-primary' : 'text-muted-foreground')}>
            {compact ? DAY_NAMES[dayIndex] : DAY_NAMES[dayIndex]}
          </span>
          <span className={cn('text-lg font-bold leading-none', today ? 'text-primary' : 'text-foreground')}>
            {dayNum}
          </span>
        </div>
        {today && (
          <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-medium ml-auto">
            HOY
          </span>
        )}
      </div>

      {/* Sessions */}
      <div className={cn(
        'flex-1 p-1.5 space-y-1.5 rounded-b-xl border-x border-b min-h-20',
        today ? 'border-primary/30 bg-primary/5' : 'border-border/30 bg-card/20'
      )}>
        {sessions.map(session => (
          <SessionBlock
            key={session.id}
            session={session}
            onClick={() => onSessionClick(session)}
            compact={compact}
          />
        ))}

        {/* Add button */}
        <button
          onClick={() => onAddClick(date)}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/50 transition-colors text-xs"
        >
          <Plus className="w-3 h-3" />
          {!compact && <span>Añadir</span>}
        </button>
      </div>
    </div>
  )
}
