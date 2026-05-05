'use client';

import { DAYS, TYPES } from '@/lib/schedule/data';
import type { DayName } from '@/lib/schedule/data';
import type { ScheduleSession, SessionStatus } from '@/lib/schedule/types';

interface Props {
  schedule: Record<string, ScheduleSession[]>;
  todayName: DayName;
  hiddenTypes: Set<string>;
  sessionStatuses: Record<string, SessionStatus | null>;
  onDaySelect: (day: DayName) => void;
}

export default function MobileWeekOverview({
  schedule,
  todayName,
  hiddenTypes,
  sessionStatuses,
  onDaySelect,
}: Props) {
  return (
    <div className="mobile-week-scroll">
      {DAYS.map((day) => {
        const sessions = (schedule[day] ?? []).filter((s) => !hiddenTypes.has(s.type));
        const doneCount = sessions.filter((s) => {
          const st = sessionStatuses[s.id];
          return st === 'done' || st === 'modified';
        }).length;
        const skippedCount = sessions.filter((s) => sessionStatuses[s.id] === 'skipped').length;
        const isToday = day === todayName;

        // Unique types visible for this day (for color dots)
        const typeSet = [...new Set(sessions.map((s) => s.type))];

        return (
          <button
            key={day}
            className={`mobile-week-card${isToday ? ' today' : ''}`}
            onClick={() => onDaySelect(day)}
          >
            <div className="mobile-week-card-name">{day.slice(0, 3)}</div>

            {/* Color dots per session type */}
            <div className="mobile-week-card-dots">
              {typeSet.slice(0, 5).map((type) => (
                <span
                  key={type}
                  className="mobile-week-dot"
                  style={{ background: TYPES[type]?.color ?? '#888' }}
                  title={TYPES[type]?.label}
                />
              ))}
            </div>

            {/* Progress */}
            {sessions.length > 0 && (
              <div className="mobile-week-card-progress">
                {doneCount > 0 && (
                  <span style={{ color: 'var(--success)', fontSize: 10 }}>{doneCount}✓</span>
                )}
                {skippedCount > 0 && (
                  <span style={{ color: 'var(--danger)', fontSize: 10 }}>{skippedCount}✗</span>
                )}
                {doneCount === 0 && skippedCount === 0 && (
                  <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>{sessions.length}</span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
