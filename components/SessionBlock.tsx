'use client';

import { TYPES } from '@/lib/schedule/data';
import type { ScheduleSession, SessionStatus } from '@/lib/schedule/types';

interface Props {
  session: ScheduleSession;
  status?: SessionStatus | null;
  rpe?: number | null;
  hasNote?: boolean;
  hidden?: boolean;
  onClick: (s: ScheduleSession) => void;
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  done: 'Hecho',
  modified: 'Modif.',
  skipped: 'Saltado',
};

export default function SessionBlock({ session, status, rpe, hasNote, hidden, onClick }: Props) {
  const typeInfo = TYPES[session.type];
  const color = typeInfo?.color ?? '#888';

  if (hidden) return null;

  const showRpe = rpe != null && (status === 'done' || status === 'modified');

  return (
    <button
      className={`session${status ? ` ${status}` : ''}`}
      style={{ '--type-color': color } as React.CSSProperties}
      onClick={() => onClick(session)}
    >
      {/* Top row: status tag + badges */}
      {(status || showRpe || hasNote) && (
        <div className="session-top-row">
          {status && (
            <span className={`session-status-tag status-${status}`}>
              {STATUS_LABELS[status]}
            </span>
          )}
          <div className="session-badges">
            {showRpe && (
              <span className="session-rpe-badge" style={{ background: `${color}30`, color }}>
                RPE {rpe}
              </span>
            )}
            {hasNote && (
              <span className="session-note-dot" title="Tiene nota">
                ✎
              </span>
            )}
          </div>
        </div>
      )}
      <div className="session-time">{session.start} - {session.end}</div>
      <div className="session-title">{session.title}</div>
      <span className="session-type">{typeInfo?.label ?? session.type}</span>
    </button>
  );
}
