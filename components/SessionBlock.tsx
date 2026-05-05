'use client';

import { TYPES } from '@/lib/schedule/data';
import type { ScheduleSession, SessionStatus } from '@/lib/schedule/types';

interface Props {
  session: ScheduleSession;
  status?: SessionStatus | null;
  hidden?: boolean;
  onClick: (s: ScheduleSession) => void;
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  done: 'Hecho',
  modified: 'Modif.',
  skipped: 'Saltado',
};

export default function SessionBlock({ session, status, hidden, onClick }: Props) {
  const typeInfo = TYPES[session.type];
  const color = typeInfo?.color ?? '#888';

  if (hidden) return null;

  return (
    <button
      className={`session${status ? ` ${status}` : ''}`}
      style={{ '--type-color': color } as React.CSSProperties}
      onClick={() => onClick(session)}
    >
      {status && (
        <span className={`session-status-tag status-${status}`}>
          {STATUS_LABELS[status]}
        </span>
      )}
      <div className="session-time">{session.start} - {session.end}</div>
      <div className="session-title">{session.title}</div>
      <span className="session-type">{typeInfo?.label ?? session.type}</span>
    </button>
  );
}
