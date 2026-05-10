'use client'

import { SESSION_COLORS } from '@/lib/schedule/utils'
import type { Session } from '@/lib/schedule/types'
import { formatTime, getSessionDurationMinutes, formatDuration } from '@/lib/schedule/utils'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

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
  const status = hasLog ? (log!.attended ? 'done' : 'skipped') : 'pending'

  if (compact) {
    return (
      <button
        onClick={onClick}
        style={{
          textAlign: 'left',
          padding: '8px 10px',
          borderRadius: 8,
          width: '100%',
          background: colors.softBg,
          color: colors.fg,
          border: `1px solid ${colors.dot}33`,
          borderLeft: `3px solid ${colors.dot}`,
          cursor: 'pointer',
          transition: 'opacity 120ms',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <span
            className="tnum"
            style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}
          >
            {formatTime(session.start_time)}
          </span>
          {status === 'done' && <CheckCircle2 style={{ width: 12, height: 12, color: '#16a34a', flexShrink: 0 }} />}
          {status === 'skipped' && <AlertCircle style={{ width: 12, height: 12, color: '#d97706', flexShrink: 0 }} />}
        </div>
        <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: '#0a0a0a' }}>
          {session.title}
        </p>
      </button>
    )
  }

  // Mobile — SessionCardLarge style
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '14px',
        background: '#ffffff',
        border: '1px solid #e6e6e7',
        borderLeft: `3px solid ${colors.dot}`,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'background 120ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0a0a0a' }}>
              {session.title}
            </span>
            <span style={{
              background: colors.softBg,
              color: colors.fg,
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 6px',
              borderRadius: 6,
              flexShrink: 0,
            }}>
              {isTraining ? 'Training' : 'Evento'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 13, color: '#6b7280' }}>
            <span className="tnum">
              {formatTime(session.start_time)}–{formatTime(session.end_time)}
            </span>
            <span>·</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
        {status === 'done' && (
          <CheckCircle2 style={{ width: 22, height: 22, color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
        )}
        {status === 'skipped' && (
          <AlertCircle style={{ width: 22, height: 22, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
        )}
        {status === 'pending' && isTraining && (
          <Circle style={{ width: 22, height: 22, color: '#9ca3af', flexShrink: 0, marginTop: 1 }} />
        )}
      </div>

      {hasLog && !notAttended && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {log!.rpe != null && (
            <span style={{ background: '#f4f4f5', color: '#0a0a0a', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6 }}>
              RPE <strong className="tnum">{log!.rpe}</strong>
            </span>
          )}
          {log!.fatigue != null && (
            <span style={{ background: '#f4f4f5', color: '#0a0a0a', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6 }}>
              Fatiga <strong className="tnum">{log!.fatigue}</strong>
            </span>
          )}
          {log!.technical_quality != null && (
            <span style={{ background: '#f4f4f5', color: '#0a0a0a', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6 }}>
              Técnica <strong className="tnum">{log!.technical_quality}</strong>
            </span>
          )}
          {log!.intensity != null && (
            <span style={{ background: '#f4f4f5', color: '#0a0a0a', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 6 }}>
              {log!.intensity === 'low' ? 'Baja' : log!.intensity === 'medium' ? 'Media' : 'Alta'}
            </span>
          )}
        </div>
      )}

      {hasLog && notAttended && (
        <span style={{
          background: '#fef3c7',
          color: '#d97706',
          fontSize: 11,
          fontWeight: 500,
          padding: '3px 8px',
          borderRadius: 6,
          alignSelf: 'flex-start',
        }}>
          No asististe
        </span>
      )}
    </button>
  )
}
