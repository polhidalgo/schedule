'use client';

import { useMemo } from 'react';
import type { TrainingLog } from '@/lib/schedule/types';
import { toDateKey } from '@/lib/schedule/utils';

interface Props {
  logs: TrainingLog[];
  months?: number;
}

function getDaysInRange(months: number): string[] {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - months + 1);
  start.setDate(1);
  const days: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export default function Heatmap({ logs, months = 3 }: Props) {
  const days = useMemo(() => getDaysInRange(months), [months]);

  const activityByDate = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => {
      if (l.status === 'done' || l.status === 'modified') {
        map[l.date] = (map[l.date] ?? 0) + 1;
      }
    });
    return map;
  }, [logs]);

  const maxActivity = Math.max(1, ...Object.values(activityByDate));

  function getLevel(count: number): string {
    if (!count) return '';
    if (count / maxActivity < 0.34) return 'level-1';
    if (count / maxActivity < 0.67) return 'level-2';
    return 'level-3';
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
        {['L','M','X','J','V','S','D'].map((d) => (
          <div key={d} style={{ fontSize: 10, color: 'var(--text-faint)', width: 14, textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      <div className="heatmap-grid" style={{ gridTemplateColumns: 'repeat(7, 14px)' }}>
        {/* Padding for first day of week alignment */}
        {Array.from({ length: (new Date(days[0]).getDay() + 6) % 7 }).map((_, i) => (
          <div key={`pad-${i}`} style={{ width: 14, height: 14 }} />
        ))}
        {days.map((date) => {
          const count = activityByDate[date] ?? 0;
          const isToday = date === toDateKey();
          return (
            <div
              key={date}
              className={`heatmap-cell ${getLevel(count)}`}
              style={{
                width: 14, height: 14,
                outline: isToday ? '1px solid var(--accent)' : undefined,
              }}
              title={`${date}: ${count} sesion${count !== 1 ? 'es' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}
