'use client';

import DayCard from './DayCard';
import { DAYS } from '@/lib/schedule/data';
import type { ScheduleSession, SessionStatus } from '@/lib/schedule/types';

interface Props {
  schedule: Record<string, ScheduleSession[]>;
  todayName: string;
  hiddenTypes: Set<string>;
  sessionStatuses: Record<string, SessionStatus | null>;
  onSessionClick: (s: ScheduleSession) => void;
}

export default function WeekGrid({
  schedule,
  todayName,
  hiddenTypes,
  sessionStatuses,
  onSessionClick,
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
          onSessionClick={onSessionClick}
        />
      ))}
    </section>
  );
}
