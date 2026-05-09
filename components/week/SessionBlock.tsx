'use client'

import { SESSION_COLORS } from '@/lib/schedule/utils'
import { SESSION_TYPE_LABELS } from '@/lib/schedule/types'
import type { Session } from '@/lib/schedule/types'
import { formatTime, getSessionDurationMinutes, formatDuration } from '@/lib/schedule/utils'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionBlockProps {
  session: Session
  onClick: () => void
  compact?: boolean
}

export function SessionBlock({ session, onClick, compact = false }: SessionBlockProps) {
  const colors = SESSION_COLORS[session.session_type]
  const duration = getSessionDurationMinutes(session.start_time, session.end_time)
  const log = session.session_log

  const hasLog = !!log
  const notAttended = log?.attended === false
  const isTraining = session.category === 'training'

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border p-2 transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]',
        colors.bg,
        colors.border,
        compact ? 'py-1.5' : 'py-2'
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className={cn('font-medium truncate', colors.text, compact ? 'text-xs' : 'text-xs')}>
            {session.title}
          </p>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTime(session.start_time)} · {formatDuration(duration)}
            </p>
          )}
          {compact && (
            <p className="text-[10px] text-muted-foreground">
              {formatTime(session.start_time)}
            </p>
          )}
        </div>

        {isTraining && (
          <div className="shrink-0 mt-0.5">
            {notAttended ? (
              <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
            ) : hasLog ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
            )}
          </div>
        )}
      </div>

      {!compact && hasLog && log?.rpe && (
        <div className="mt-1.5 flex gap-2">
          <span className="text-[10px] bg-black/20 rounded px-1 py-0.5 text-muted-foreground">
            RPE {log.rpe}
          </span>
          {log.fatigue && (
            <span className="text-[10px] bg-black/20 rounded px-1 py-0.5 text-muted-foreground">
              F {log.fatigue}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
