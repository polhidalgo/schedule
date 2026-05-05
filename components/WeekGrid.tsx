'use client';

import DayCard from './DayCard';
import { DAYS } from '@/lib/schedule/data';
import type { ScheduleSession, SessionStatus } from '@/lib/schedule/types';

interface SessionMeta { status: SessionStatus | null; rpe?: number | null; hasNote?: boolean }

interface Props {
  schedule: Record<string, ScheduleSession[]>;
  todayName: string;
  hiddenTypes: Set<string>;
  sessionStatuses: Record<string, SessionStatus | null>;
  sessionMetas?: Record<string, SessionMeta>;
  onSessionClick: (s: ScheduleSession) => void;
  onAddSession?: (day: string) => void;
}

export default function WeekGrid({
  schedule,
  todayName,
  hiddenTypes,
  sessionStatuses,
  sessionMetas,
  onSessionClick,
  onAddSession,
}: Props) {
  return (
    <section className="week-grid" aria-label="Calendario semanal">
      {DAYS.map((day) => (
        <DayCard
          key={day}
          dayName={day}
          isToday={day === todayName}
          sessions={schedule[day] ?? []}
          hiddenTypes={hiddenTypes}
          sessionStatuses={sessionStatuses}
          sessionMetas={sessionMetas}
          onSessionClick={onSessionClick}
          onAddSession={onAddSession}
        />
      ))}
    </section>
  );
}
