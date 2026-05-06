'use client';

import { TYPES } from '@/lib/schedule/data';
import type { DailyFeedback } from '@/lib/schedule/types';

const TRAINING_TYPES = ['nogi', 'gi', 'wrestling', 'judo', 'strength', 'conditioning', 'recovery'];

interface LogEntry {
  date: string;
  status?: string | null;
  rpe?: number | null;
  sessionType: string;
}

interface Props {
  logs: LogEntry[];
  feedback: DailyFeedback[];
  monthLabel: string;
}

export default function MonthlyStats({ logs, feedback, monthLabel }: Props) {
  const activeLogs = logs.filter((l) => l.status === 'done' || l.status === 'modified');
  const skippedCount = logs.filter((l) => l.status === 'skipped').length;
  const totalLogged = logs.length;
  const doneCount = activeLogs.length;
  const donePercent = totalLogged > 0 ? Math.round((doneCount / totalLogged) * 100) : 0;

  const rpeValues = activeLogs.filter((l) => l.rpe != null).map((l) => l.rpe as number);
  const avgRpe = rpeValues.length > 0
    ? (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1)
    : null;

  const byType: Record<string, number> = {};
  for (const log of activeLogs) {
    if (TRAINING_TYPES.includes(log.sessionType)) {
      byType[log.sessionType] = (byType[log.sessionType] ?? 0) + 1;
    }
  }
  const sortedTypes = Object.entries(byType).sort(([, a], [, b]) => b - a);
  const maxTypeCount = sortedTypes.length > 0 ? sortedTypes[0][1] : 1;

  const highRpeDays = new Set(
    activeLogs.filter((l) => (l.rpe ?? 0) >= 8).map((l) => l.date)
  ).size;

  const doneDates = [...new Set(activeLogs.map((l) => l.date))].sort();
  let maxStreak = doneDates.length > 0 ? 1 : 0;
  let curStreak = doneDates.length > 0 ? 1 : 0;
  for (let i = 1; i < doneDates.length; i++) {
    const diff =
      (new Date(doneDates[i] + 'T00:00:00').getTime() -
        new Date(doneDates[i - 1] + 'T00:00:00').getTime()) /
      86400000;
    if (diff === 1) { curStreak++; if (curStreak > maxStreak) maxStreak = curStreak; }
    else curStreak = 1;
  }

  const avgSleep =
    feedback.length > 0
      ? (feedback.reduce((a, b) => a + Number(b.sleep_hours), 0) / feedback.length).toFixed(1)
      : null;
  const avgPain =
    feedback.length > 0
      ? (feedback.reduce((a, b) => a + b.pain, 0) / feedback.length).toFixed(1)
      : null;
  const planBDays = feedback.filter((f) => f.plan === 'B').length;

  if (totalLogged === 0 && feedback.length === 0) return null;

  return (
    <div style={{
      marginBottom: 24,
      background: 'var(--bg-elev)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-faint)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
      }}>
        Estadísticas · {monthLabel}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--border)' }}>
        {[
          {
            label: 'Sesiones',
            value: totalLogged > 0 ? `${doneCount}/${totalLogged}` : '—',
            sub: totalLogged > 0 ? `${donePercent}% realizadas` : undefined,
          },
          {
            label: 'RPE promedio',
            value: avgRpe ?? '—',
            sub: rpeValues.length > 0 ? `${rpeValues.length} registros` : undefined,
          },
          {
            label: 'Sueño',
            value: avgSleep != null ? `${avgSleep}h` : '—',
            sub: feedback.length > 0 ? `${feedback.length} días` : undefined,
          },
          {
            label: 'Dolor rodilla',
            value: avgPain != null ? `${avgPain}/5` : '—',
            accent: avgPain != null && parseFloat(avgPain) >= 3 ? 'var(--danger)' : undefined,
          },
        ].map((card, i, arr) => (
          <div
            key={card.label}
            style={{
              padding: '12px 16px',
              borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 4 }}>{card.label}</div>
            <div style={{
              fontSize: 22, fontWeight: 700, lineHeight: 1,
              color: card.accent ?? 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {card.value}
            </div>
            {card.sub && (
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>{card.sub}</div>
            )}
          </div>
        ))}
      </div>

      {sortedTypes.length > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8, fontWeight: 500 }}>
            Por tipo (realizadas)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortedTypes.map(([type, count]) => {
              const color = TYPES[type]?.color ?? 'var(--accent)';
              const pct = doneCount > 0 ? Math.round((count / doneCount) * 100) : 0;
              const barWidth = Math.round((count / maxTypeCount) * 100);
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 88, fontSize: 12, color, flexShrink: 0 }}>
                    {TYPES[type]?.label ?? type}
                  </div>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${barWidth}%`,
                      background: color, borderRadius: 3,
                    }} />
                  </div>
                  <div style={{ width: 52, textAlign: 'right', fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>
                    {count} · {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ padding: '8px 16px', display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-dim)' }}>
        {maxStreak > 0 && (
          <span>
            Racha máx. <strong style={{ color: 'var(--text)' }}>{maxStreak}d</strong>
          </span>
        )}
        {highRpeDays > 0 && (
          <span>
            RPE ≥ 8 <strong style={{ color: 'var(--warn)' }}>{highRpeDays}d</strong>
          </span>
        )}
        {skippedCount > 0 && (
          <span>
            Saltadas <strong style={{ color: 'var(--danger)' }}>{skippedCount}</strong>
          </span>
        )}
        {planBDays > 0 && (
          <span>
            Plan B <strong style={{ color: 'var(--text)' }}>{planBDays}d</strong>
          </span>
        )}
      </div>
    </div>
  );
}
