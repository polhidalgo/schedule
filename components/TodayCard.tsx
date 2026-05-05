'use client';

import { useEffect, useState } from 'react';
import { TYPES } from '@/lib/schedule/data';
import { nowMinutes, timeToMin } from '@/lib/schedule/utils';
import type { ScheduleSession } from '@/lib/schedule/types';

interface Props {
  todaySessions: ScheduleSession[];
  hiddenTypes: Set<string>;
}

export default function TodayCard({ todaySessions, hiddenTypes }: Props) {
  const [now, setNow] = useState(nowMinutes());

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  const visible = todaySessions.filter((s) => !hiddenTypes.has(s.type));
  const current = visible.find((s) => timeToMin(s.start) <= now && timeToMin(s.end) > now);
  const upcoming = visible.find((s) => timeToMin(s.start) > now);
  const next = current ?? upcoming;

  const counts: Record<string, number> = {};
  visible.forEach((s) => { counts[s.type] = (counts[s.type] ?? 0) + 1; });

  return (
    <>
      {next ? (
        <div
          className="next-session"
          style={{ borderLeftColor: TYPES[next.type]?.color ?? 'var(--accent)' }}
        >
          <div className="next-label">
            {current ? 'En curso' : 'Siguiente'} · {TYPES[next.type]?.label}
          </div>
          <div className="next-title">{next.title}</div>
          <div className="next-time">
            {next.start} - {next.end}
            {next.location ? ` · ${next.location}` : ''}
          </div>
        </div>
      ) : (
        <div className="next-session">
          <div className="next-label">Hoy ya terminado</div>
          <div className="next-title">Sin proximas sesiones</div>
        </div>
      )}

      <div className="summary">
        {Object.entries(counts).length === 0 ? (
          <span className="summary-chip">Dia tranquilo</span>
        ) : (
          Object.entries(counts).map(([t, n]) => (
            <span
              key={t}
              className="summary-chip"
              style={{ color: TYPES[t]?.color }}
            >
              {TYPES[t]?.label} x{n}
            </span>
          ))
        )}
      </div>
    </>
  );
}
