'use client';

import SessionBlock from './SessionBlock';
import type { ScheduleSession, SessionStatus } from '@/lib/schedule/types';

interface Props {
  dayName: string;
  isToday: boolean;
  sessions: ScheduleSession[];
  hiddenTypes: Set<string>;
  sessionStatuses: Record<string, SessionStatus | null>;
  onSessionClick: (s: ScheduleSession) => void;
}

export default function DayCard({
  dayName,
  isToday,
  sessions,
  hiddenTypes,
  sessionStatuses,
  onSessionClick,
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
        {sessions.map((session) => (
          <SessionBlock
            key={session.id}
            session={session}
            status={sessionStatuses[session.id]}
            hidden={hiddenTypes.has(session.type)}
            onClick={onSessionClick}
          />
        ))}
      </div>
    </div>
  );
}
