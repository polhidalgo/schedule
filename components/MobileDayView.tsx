'use client';

import { useEffect, useState } from 'react';
import TodayCard from './TodayCard';
import SessionBlock from './SessionBlock';
import type { ScheduleSession, SessionStatus } from '@/lib/schedule/types';
import type { DayName } from '@/lib/schedule/data';

interface SessionMeta { status: SessionStatus | null; rpe?: number | null; hasNote?: boolean }

interface Props {
  dayName: DayName;
  todayName: DayName;
  sessions: ScheduleSession[];
  hiddenTypes: Set<string>;
  sessionStatuses: Record<string, SessionStatus | null>;
  sessionMetas?: Record<string, SessionMeta>;
  onSessionClick: (s: ScheduleSession) => void;
  onAddSession?: (day: DayName) => void;
}

export default function MobileDayView({
  dayName,
  todayName,
  sessions,
  hiddenTypes,
  sessionStatuses,
  sessionMetas,
  onSessionClick,
  onAddSession,
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
          visible.map((session) => {
            const meta = sessionMetas?.[session.id];
            return (
              <SessionBlock
                key={session.id}
                session={session}
                status={sessionStatuses[session.id]}
                rpe={meta?.rpe}
                hasNote={meta?.hasNote}
                hidden={false}
                onClick={onSessionClick}
              />
            );
          })
        )}

        {onAddSession && (
          <button
            type="button"
            onClick={() => onAddSession(dayName)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '10px 0', marginTop: 8,
              background: 'transparent', border: '1px dashed var(--border)',
              borderRadius: 8, color: 'var(--text-faint)', fontSize: 13,
            }}
          >
            <span>+</span>
            <span>Agregar sesion extra</span>
          </button>
        )}
      </div>
    </div>
  );
}
