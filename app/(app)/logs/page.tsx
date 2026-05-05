'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ALL_SESSIONS, TYPES } from '@/lib/schedule/data';
import type { TrainingLog, SessionStatus } from '@/lib/schedule/types';

interface EnrichedLog extends TrainingLog {
  sessionTitle: string;
  sessionType: string;
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  done: 'Hecho',
  modified: 'Modificado',
  skipped: 'Saltado',
};

const STATUS_COLORS: Record<SessionStatus, string> = {
  done: 'var(--success)',
  modified: 'var(--warn)',
  skipped: 'var(--danger)',
};

const ALL_TYPES = Object.keys(TYPES);

// Lookup map from ALL_SESSIONS
const SESSION_LOOKUP = Object.fromEntries(ALL_SESSIONS.map((s) => [s.id, s]));

export default function LogsPage() {
  const supabase = createClient();

  const [logs, setLogs] = useState<EnrichedLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<SessionStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('training_logs')
      .select(`
        *,
        extra_sessions (
          start_time,
          end_time,
          note,
          session_catalog ( name, type )
        )
      `)
      .eq('user_id', user.id)
      .not('status', 'is', null)
      .order('date', { ascending: false })
      .limit(500);

    const enriched: EnrichedLog[] = (data ?? []).map((row) => {
      let title = '—';
      let type = 'nogi';

      if (row.extra_session_id && row.extra_sessions) {
        const catalog = (row.extra_sessions as { session_catalog?: { name: string; type: string } | null }).session_catalog;
        title = catalog?.name ?? 'Sesion extra';
        type = catalog?.type ?? 'nogi';
      } else if (row.session_id) {
        const s = SESSION_LOOKUP[row.session_id];
        title = s?.title ?? row.session_id;
        type = s?.type ?? 'nogi';
      }

      return {
        ...row,
        extra_session_id: row.extra_session_id ?? null,
        sessionTitle: title,
        sessionType: type,
      };
    });

    setLogs(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Derive available months from logs
  const availableMonths = Array.from(
    new Set(logs.map((l) => l.date.slice(0, 7)))
  ).sort().reverse();

  // Apply filters
  const filtered = logs.filter((l) => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterType !== 'all' && l.sessionType !== filterType) return false;
    if (filterMonth !== 'all' && !l.date.startsWith(filterMonth)) return false;
    return true;
  });

  // Group by month
  const grouped: Record<string, EnrichedLog[]> = {};
  for (const log of filtered) {
    const month = log.date.slice(0, 7);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(log);
  }

  function formatMonth(ym: string): string {
    const [year, month] = ym.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }

  const totalDone = logs.filter((l) => l.status === 'done' || l.status === 'modified').length;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Historial de sesiones</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-dim)', fontSize: 13 }}>
          {totalDone} sesiones realizadas en total
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20,
        padding: 14, background: 'var(--bg-elev)', borderRadius: 10,
        border: '1px solid var(--border)',
      }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as SessionStatus | 'all')}
          style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: 13,
          }}
        >
          <option value="all">Todos los estados</option>
          <option value="done">Hecho</option>
          <option value="modified">Modificado</option>
          <option value="skipped">Saltado</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: 13,
          }}
        >
          <option value="all">Todos los tipos</option>
          {ALL_TYPES.filter((t) => !['work', 'commute', 'meal', 'rest'].includes(t)).map((t) => (
            <option key={t} value={t}>{TYPES[t]?.label ?? t}</option>
          ))}
        </select>

        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: 13,
          }}
        >
          <option value="all">Todos los meses</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>{formatMonth(m)}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => { setFilterStatus('all'); setFilterType('all'); setFilterMonth('all'); }}
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 10px', color: 'var(--text-dim)',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 40 }}>
          Cargando historial...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 40, color: 'var(--text-dim)',
          background: 'var(--bg-elev)', borderRadius: 10, border: '1px solid var(--border)',
        }}>
          No hay sesiones con los filtros seleccionados.
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([month, monthLogs]) => (
            <div key={month} style={{ marginBottom: 28 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: 'var(--text-faint)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                marginBottom: 10, paddingBottom: 6,
                borderBottom: '1px solid var(--border)',
              }}>
                {formatMonth(month)} · {monthLogs.filter((l) => l.status !== 'skipped').length} sesiones
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {monthLogs.map((log) => {
                  const color = TYPES[log.sessionType]?.color ?? 'var(--accent)';
                  const statusColor = STATUS_COLORS[log.status as SessionStatus] ?? 'var(--text-dim)';
                  return (
                    <div
                      key={log.id ?? `${log.date}-${log.session_id ?? log.extra_session_id}`}
                      style={{
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                        background: 'var(--bg-elev)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '10px 14px',
                        borderLeft: `3px solid ${statusColor}`,
                      }}
                    >
                      {/* Date column */}
                      <div style={{ minWidth: 80, paddingTop: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                          {log.date.slice(5).replace('-', '/')}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                          {log.date.slice(0, 4)}
                        </div>
                      </div>

                      {/* Main info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{log.sessionTitle}</span>
                          {log.extra_session_id && (
                            <span style={{
                              fontSize: 10, padding: '1px 5px', borderRadius: 3,
                              background: 'var(--bg-elev-2)', color: 'var(--text-faint)',
                              border: '1px solid var(--border)',
                            }}>extra</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 11, padding: '1px 7px', borderRadius: 4,
                            background: `${color}18`, color,
                          }}>
                            {TYPES[log.sessionType]?.label ?? log.sessionType}
                          </span>
                          <span style={{
                            fontSize: 11, padding: '1px 7px', borderRadius: 4,
                            background: `${statusColor}18`, color: statusColor,
                          }}>
                            {STATUS_LABELS[log.status as SessionStatus] ?? log.status}
                          </span>
                          {log.rpe != null && (
                            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                              RPE {log.rpe}/10
                            </span>
                          )}
                        </div>
                        {log.note && (
                          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 5, fontStyle: 'italic' }}>
                            {log.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
