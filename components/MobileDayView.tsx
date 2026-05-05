'use client';

import { useEffect, useState } from 'react';
import TodayCard from './TodayCard';
import SessionBlock from './SessionBlock';
import type { ScheduleSession, SessionStatus } from '@/lib/schedule/types';
import type { DayName } from '@/lib/schedule/data';

interface Props {
  dayName: DayName;
  todayName: DayName;
  sessions: ScheduleSession[];
  hiddenTypes: Set<string>;
  sessionStatuses: Record<string, SessionStatus | null>;
  onSessionClick: (s: ScheduleSession) => void;
}

export default function MobileDayView({
  dayName,
  todayName,
  sessions,
  hiddenTypes,
  sessionStatuses,
  onSessionClick,
}: Props) {
  const isToday = dayName === todayName;
  const visible = sessions.filter((s) => !hiddenTypes.has(s.type));

  return (
    <div className="mobile-day-view">
      {/* Today banner — only when viewing today */}
      {isToday && (
        <div className="mobile-today-banner">
          <TodayCard todaySessions={sessions} hiddenTypes={hiddenTypes} />
        </div>
      )}

      {/* Session list */}
      <div className="mobile-sessions-list">
        {visible.length === 0 ? (
          <div className="mobile-empty">Sin sesiones visibles este dia</div>
        ) : (
          visible.map((session) => (
            <SessionBlock
              key={session.id}
              session={session}
              status={sessionStatuses[session.id]}
              hidden={false}
              onClick={onSessionClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
