'use client'

import { SessionBlock } from './SessionBlock'
import type { Session } from '@/lib/schedule/types'
import { DAY_NAMES_FULL } from '@/lib/schedule/types'
import { isToday } from '@/lib/schedule/utils'
import { Plus } from 'lucide-react'

interface DayColumnProps {
  date: string       // YYYY-MM-DD
  dayIndex: number   // 0=Monday
  sessions: Session[]
  onSessionClick: (session: Session) => void
  onAddClick: (date: string) => void
  compact?: boolean  // true = desktop column, false = mobile full card list
}

export function DayColumn({
  date,
  dayIndex,
  sessions,
  onSessionClick,
  onAddClick,
  compact = false,
}: DayColumnProps) {
  const todayCol = isToday(date)
  const dayNum = new Date(date + 'T12:00:00').getDate()

  if (compact) {
    // Desktop: day header block + compact session blocks
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          padding: '10px 12px',
          borderRadius: 10,
          background: todayCol ? '#0a0a0a' : '#f4f4f5',
          color: todayCol ? '#ffffff' : '#0a0a0a',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{DAY_NAMES_FULL[dayIndex]}</span>
          <span className="tnum" style={{ fontSize: 13, fontWeight: 700 }}>{dayNum}</span>
        </div>

        {sessions.length === 0 ? (
          <div style={{
            padding: '16px 8px',
            borderRadius: 8,
            border: '1px dashed #d4d4d8',
            color: '#9ca3af',
            fontSize: 11,
            textAlign: 'center',
          }}>
            Libre
          </div>
        ) : (
          sessions.map(session => (
            <SessionBlock
              key={session.id}
              session={session}
              onClick={() => onSessionClick(session)}
              compact
            />
          ))
        )}

        <button
          onClick={() => onAddClick(date)}
          aria-label={`Añadir sesión`}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '6px',
            borderRadius: 8,
            border: '1px dashed #e6e6e7',
            color: '#9ca3af',
            fontSize: 11,
            background: 'transparent',
            cursor: 'pointer',
            transition: 'color 120ms, border-color 120ms',
          }}
        >
          <Plus style={{ width: 12, height: 12 }} />
        </button>
      </div>
    )
  }

  // Mobile: just the sessions list (day heading is rendered by the page)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sessions.length === 0 ? (
        <div style={{
          border: '1px dashed #d4d4d8',
          borderRadius: 12,
          padding: '28px 16px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: 13,
        }}>
          Día libre — sin sesiones programadas.
        </div>
      ) : (
        sessions.map(session => (
          <SessionBlock
            key={session.id}
            session={session}
            onClick={() => onSessionClick(session)}
            compact={false}
          />
        ))
      )}

      <button
        onClick={() => onAddClick(date)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px',
          borderRadius: 10,
          border: '1px dashed #e6e6e7',
          color: '#6b7280',
          fontSize: 13,
          background: 'transparent',
          cursor: 'pointer',
          marginTop: 4,
        }}
      >
        <Plus style={{ width: 16, height: 16 }} />
        Añadir sesión
      </button>
    </div>
  )
}
