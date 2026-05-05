'use client';

import SessionBlock from './SessionBlock';
import type { ScheduleSession, SessionStatus } from '@/lib/schedule/types';

interface SessionMeta { status: SessionStatus | null; rpe?: number | null; hasNote?: boolean }

interface Props {
  dayName: string;
  isToday: boolean;
  sessions: ScheduleSession[];
  hiddenTypes: Set<string>;
  sessionStatuses: Record<string, SessionStatus | null>;
  sessionMetas?: Record<string, SessionMeta>;
  onSessionClick: (s: ScheduleSession) => void;
  onAddSession?: (day: string) => void;
}

export default function DayCard({
  dayName,
  isToday,
  sessions,
  hiddenTypes,
  sessionStatuses,
  sessionMetas,
  onSessionClick,
  onAddSession,
}: Props) {
  const visibleCount = sessions.filter((s) => !hiddenTypes.has(s.type)).length;

  return (
    <div className={`day-card${isToday ? ' today' : ''}`}>
      <div className="day-header">
        <span className="day-name">{dayName}</span>
        <span className="day-tag">
          {isToday ? 'Hoy' : `${visibleCount} sesiones`}
        </span>
      </div>
      <div className="sessions">
        {sessions.map((session) => {
          const meta = sessionMetas?.[session.id];
          return (
            <SessionBlock
              key={session.id}
              session={session}
              status={sessionStatuses[session.id]}
              rpe={meta?.rpe}
              hasNote={meta?.hasNote}
              hidden={hiddenTypes.has(session.type)}
              onClick={onSessionClick}
            />
          );
        })}
        {onAddSession && (
          <button
            type="button"
            onClick={() => onAddSession(dayName)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              width: '100%', padding: '6px 8px', marginTop: 4,
              background: 'transparent', border: '1px dashed var(--border)',
              borderRadius: 6, color: 'var(--text-faint)', fontSize: 12,
              cursor: 'pointer', transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-faint)'; }}
          >
            <span>+</span>
            <span>Sesion extra</span>
          </button>
        )}
      </div>
    </div>
  );
}
