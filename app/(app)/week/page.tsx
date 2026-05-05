'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import WeekGrid from '@/components/WeekGrid';
import PlanToggle from '@/components/PlanToggle';
import FilterChips from '@/components/FilterChips';
import TodayCard from '@/components/TodayCard';
import FeedbackForm from '@/components/FeedbackForm';
import SessionModal from '@/components/SessionModal';
import EventForm from '@/components/EventForm';
import Heatmap from '@/components/Heatmap';
import ExtraSessionPicker from '@/components/ExtraSessionPicker';
import MobileNav, { type MobileTab } from '@/components/MobileNav';
import DayNavigator from '@/components/DayNavigator';
import MobileDayView from '@/components/MobileDayView';
import MobileWeekOverview from '@/components/MobileWeekOverview';
import PlanningChat from '@/components/PlanningChat';
import { createClient } from '@/lib/supabase/client';
import { getSessionsByPlan, TYPES, ALL_SESSIONS } from '@/lib/schedule/data';
import { todayDayName, toDateKey, getWeekStart, getGiNogiVariant, dayNameToDateKey } from '@/lib/schedule/utils';
import { getPreferences, upsertPreferences } from '@/lib/preferences';
import { useIsMobile } from '@/hooks/useIsMobile';
import type {
  PlanId, GiNogiVariant, ScheduleSession, SessionStatus,
  TrainingLog, DailyFeedback, ScheduleEvent, ExtraSession,
} from '@/lib/schedule/types';
import type { DayName } from '@/lib/schedule/data';
import { DAYS } from '@/lib/schedule/data';

export default function WeekPage() {
  const supabase = createClient();
  const today = todayDayName();
  const todayKey = toDateKey();
  const weekStart = getWeekStart();
  const autoVariant = getGiNogiVariant(weekStart);
  const isMobile = useIsMobile();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [plan, setPlan] = useState<PlanId>('A');
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set(['work', 'commute']));
  const variant = autoVariant;
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);

  // Extra session picker state
  const [pickerDay, setPickerDay] = useState<DayName | null>(null);

  // Mobile-specific state
  const [mobileTab, setMobileTab] = useState<MobileTab>('hoy');
  const [mobileDay, setMobileDay] = useState<DayName>(today);

  // ── Supabase data ─────────────────────────────────────────────────────────
  const [sessionLogs, setSessionLogs] = useState<TrainingLog[]>([]);
  const [todayFeedback, setTodayFeedback] = useState<DailyFeedback | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<DailyFeedback[]>([]);
  const [allLogs, setAllLogs] = useState<TrainingLog[]>([]);
  const [extraSessions, setExtraSessions] = useState<ExtraSession[]>([]);

  // Debounce ref for saving preferences
  const prefsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived: merge extra sessions into schedule ───────────────────────────
  const baseSchedule = getSessionsByPlan(plan, variant);

  const mergedSchedule: Record<string, ScheduleSession[]> = { ...baseSchedule };
  for (const day of DAYS) {
    const extras = extraSessions
      .filter((es) => {
        // Find which day this date corresponds to
        const d = new Date(es.date + 'T00:00:00');
        const idx = (d.getDay() + 6) % 7;
        return DAYS[idx] === day;
      })
      .map((es): ScheduleSession => ({
        id: `extra-${es.id}`,
        plan,
        day_name: day,
        start: es.start_time?.slice(0, 5) ?? '',
        end: es.end_time?.slice(0, 5) ?? '',
        title: es.session_catalog?.name ?? 'Sesion extra',
        type: (es.session_catalog?.type as ScheduleSession['type']) ?? 'nogi',
        note: es.note ?? undefined,
        isExtra: true,
        extraSessionId: es.id,
        sort_order: 999,
      }));
    mergedSchedule[day] = [...(baseSchedule[day] ?? []), ...extras];
  }

  const todaySessions = mergedSchedule[today] ?? [];
  const mobileSessions = mergedSchedule[mobileDay] ?? [];

  // Enriched map: status + rpe + hasNote per session_id or extra_session_id
  const metaMap: Record<string, { status: SessionStatus | null; rpe?: number | null; hasNote?: boolean }> = {};
  sessionLogs.forEach((l) => {
    const key = l.extra_session_id ? `extra-${l.extra_session_id}` : l.session_id;
    if (key) metaMap[key] = { status: l.status ?? null, rpe: l.rpe, hasNote: !!l.note };
  });

  const statusMap: Record<string, SessionStatus | null> = {};
  Object.entries(metaMap).forEach(([id, m]) => { statusMap[id] = m.status; });

  const selectedLog = sessionLogs.find((l) => {
    if (selectedSession?.isExtra) return l.extra_session_id === selectedSession.extraSessionId;
    return l.session_id === selectedSession?.id;
  }) ?? null;

  // ── Streak ────────────────────────────────────────────────────────────────
  const streak = (() => {
    const doneSet = new Set(
      allLogs.filter((l) => l.status === 'done' || l.status === 'modified').map((l) => l.date)
    );
    let count = 0;
    const d = new Date();
    while (doneSet.has(toDateKey(d))) { count++; d.setDate(d.getDate() - 1); }
    return count;
  })();

  // ── Week session counters ─────────────────────────────────────────────────
  const weekSessionCounts = (() => {
    const counts: Record<string, number> = {};
    const weekDoneKeys = new Set(
      sessionLogs
        .filter((l) => l.status === 'done' || l.status === 'modified')
        .map((l) => l.extra_session_id ? `extra-${l.extra_session_id}` : l.session_id)
        .filter(Boolean) as string[]
    );
    Object.values(mergedSchedule).flat().forEach((s) => {
      if (weekDoneKeys.has(s.id)) counts[s.type] = (counts[s.type] ?? 0) + 1;
    });
    return counts;
  })();

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load week config
    const { data: weekCfg } = await supabase
      .from('week_configs').select('*')
      .eq('user_id', user.id).eq('week_start', weekStart).maybeSingle();
    if (weekCfg) setPlan(weekCfg.plan as PlanId);

    // Load preferences (filter settings)
    const prefs = await getPreferences(supabase, user.id);
    setHiddenTypes(new Set(prefs.hidden_types));

    // Load weekly training logs
    const { data: logs } = await supabase
      .from('training_logs').select('*')
      .eq('user_id', user.id).gte('date', weekStart);
    setSessionLogs(logs ?? []);

    // Load today feedback
    const { data: fb } = await supabase
      .from('daily_feedback').select('*')
      .eq('user_id', user.id).eq('date', todayKey).maybeSingle();
    setTodayFeedback(fb);

    // Load feedback history
    const { data: hist } = await supabase
      .from('daily_feedback').select('*')
      .eq('user_id', user.id).order('date', { ascending: false }).limit(10);
    setFeedbackHistory(hist ?? []);

    // Load all logs for heatmap/streak
    const { data: allL } = await supabase
      .from('training_logs').select('*')
      .eq('user_id', user.id).order('date', { ascending: false }).limit(5000);
    setAllLogs(allL ?? []);

    // Load extra sessions for this week (joined with session_catalog)
    const { data: extras } = await supabase
      .from('extra_sessions')
      .select('*, session_catalog(*)')
      .eq('user_id', user.id)
      .eq('week_start', weekStart);
    setExtraSessions(extras ?? []);
  }, [supabase, weekStart, todayKey]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handlePlanChange(newPlan: PlanId) {
    setPlan(newPlan);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('week_configs').upsert(
      { user_id: user.id, week_start: weekStart, plan: newPlan, gi_nogi_variant: variant },
      { onConflict: 'user_id,week_start' }
    );
  }

  function toggleType(type: string) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);

      // Debounced save to DB
      if (prefsSaveTimer.current) clearTimeout(prefsSaveTimer.current);
      prefsSaveTimer.current = setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await upsertPreferences(supabase, user.id, { hidden_types: Array.from(next) });
      }, 600);

      return next;
    });
  }

  async function handleSessionSave(update: {
    status?: SessionStatus | null; rpe?: number | null; note?: string | null;
  }) {
    if (!selectedSession) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sessionDate = dayNameToDateKey(selectedSession.day_name, weekStart);

    if (selectedSession.isExtra && selectedSession.extraSessionId) {
      const extraId = selectedSession.extraSessionId;
      // Delete existing log for this extra session
      await supabase.from('training_logs').delete()
        .eq('user_id', user.id).eq('date', sessionDate).eq('extra_session_id', extraId);

      if (update.status) {
        await supabase.from('training_logs').insert({
          user_id: user.id,
          date: sessionDate,
          session_id: null,
          extra_session_id: extraId,
          ...update,
        });
      }
    } else {
      if (!update.status) {
        await supabase.from('training_logs').delete()
          .eq('user_id', user.id).eq('date', sessionDate).eq('session_id', selectedSession.id);
      } else {
        await supabase.from('training_logs').upsert(
          { user_id: user.id, date: sessionDate, session_id: selectedSession.id, ...update },
          { onConflict: 'user_id,date,session_id' }
        );
      }
    }
    await loadData();
  }

  async function handleExtraSessionDelete() {
    if (!selectedSession?.isExtra || !selectedSession.extraSessionId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('extra_sessions').delete()
      .eq('id', selectedSession.extraSessionId).eq('user_id', user.id);
    await loadData();
  }

  async function handleFeedbackSave(fb: Omit<DailyFeedback, 'id' | 'user_id' | 'date'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('daily_feedback').upsert(
      { user_id: user.id, date: todayKey, ...fb },
      { onConflict: 'user_id,date' }
    );
    await loadData();
  }

  async function handleEventSave(event: Omit<ScheduleEvent, 'id' | 'user_id' | 'ai_suggestion'>): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    let suggestion: string | null = null;
    try {
      const res = await fetch('/api/groq/suggest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, plan, variant }),
      });
      if (res.ok) { const data = await res.json(); suggestion = data.suggestion ?? null; }
    } catch { /* ignore */ }
    await supabase.from('events').insert({ user_id: user.id, ...event, ai_suggestion: suggestion });
    return suggestion;
  }

  function openExtraPicker(dayName: string) {
    setPickerDay(dayName as DayName);
  }

  // ── Shared props ──────────────────────────────────────────────────────────
  const sharedProps = {
    plan, variant, hiddenTypes, statusMap, metaMap, streak, weekSessionCounts,
    schedule: mergedSchedule, today, todaySessions, todayFeedback, feedbackHistory, allLogs,
    handlePlanChange, toggleType,
    handleSessionSave, handleFeedbackSave, handleEventSave,
    setSelectedSession, openExtraPicker,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {isMobile
        ? <MobileLayout
            {...sharedProps}
            mobileTab={mobileTab}
            setMobileTab={setMobileTab}
            mobileDay={mobileDay}
            setMobileDay={setMobileDay}
            mobileSessions={mobileSessions}
          />
        : <DesktopLayout {...sharedProps} />
      }

      {selectedSession && (
        <SessionModal
          session={selectedSession}
          log={selectedLog}
          onClose={() => setSelectedSession(null)}
          onSave={handleSessionSave}
          onDelete={selectedSession.isExtra ? handleExtraSessionDelete : undefined}
        />
      )}

      {pickerDay && (
        <ExtraSessionPicker
          day={pickerDay}
          weekStart={weekStart}
          onClose={() => setPickerDay(null)}
          onSaved={loadData}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop Layout
// ─────────────────────────────────────────────────────────────────────────────
function DesktopLayout({
  plan, variant, hiddenTypes, statusMap, metaMap, streak, weekSessionCounts,
  schedule, today, todaySessions, todayFeedback, feedbackHistory, allLogs,
  handlePlanChange, toggleType,
  handleFeedbackSave, handleEventSave, setSelectedSession, openExtraPicker,
}: SharedProps) {
  return (
    <div>
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        padding: '12px 18px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-elev)',
      }}>
        <PlanToggle current={plan} onChange={handlePlanChange} />
        <span className={`variant-badge variant-${variant}`}>
          {variant === 'nogi' ? 'NoGi' : 'Gi'}
        </span>
        <FilterChips hidden={hiddenTypes} onToggle={toggleType} />
        {streak > 0 && <div className="streak-badge">🔥 {streak} dias</div>}
      </div>

      <main className="layout">
        <WeekGrid
          schedule={schedule}
          todayName={today}
          hiddenTypes={hiddenTypes}
          sessionStatuses={statusMap}
          sessionMetas={metaMap}
          onSessionClick={setSelectedSession}
          onAddSession={openExtraPicker}
        />

        <aside className="sidebar">
          <div className="sidebar-section today-card">
            <h2>Hoy · {today}</h2>
            <TodayCard todaySessions={todaySessions} hiddenTypes={hiddenTypes} />
          </div>

          {Object.keys(weekSessionCounts).length > 0 && (
            <div className="sidebar-section">
              <h2>Esta semana</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(weekSessionCounts).map(([t, n]) => (
                  <span key={t} className="summary-chip" style={{ color: TYPES[t]?.color }}>
                    {TYPES[t]?.label ?? t} ×{n}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="sidebar-section feedback-card">
            <h2>Como me siento hoy</h2>
            <FeedbackForm initial={todayFeedback} currentPlan={plan} onSave={handleFeedbackSave} />
          </div>

          <div className="sidebar-section">
            <h2>Agregar evento</h2>
            <EventForm onSave={handleEventSave} />
          </div>

          <div className="sidebar-section">
            <h2>Asistencia (3 meses)</h2>
            <Heatmap logs={allLogs} months={3} />
          </div>

          <div className="sidebar-section history-card">
            <h2>Historial diario</h2>
            {feedbackHistory.length === 0 ? (
              <div className="empty">Aun no has guardado feedback.</div>
            ) : (
              feedbackHistory.map((fb) => (
                <div key={fb.date} className="history-entry">
                  <div className="date"><span>{fb.date} · Plan {fb.plan}</span></div>
                  <div className="stats">
                    <span>Energia {fb.energy}/5</span>
                    <span>Dolor {fb.pain}/5</span>
                    <span>Sueno {fb.sleep_hours}h</span>
                    {fb.fatigue && <span>Fatiga {fb.fatigue}/5</span>}
                  </div>
                  {fb.notes && <div className="note">{fb.notes}</div>}
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Layout
// ─────────────────────────────────────────────────────────────────────────────
function MobileLayout({
  plan, variant, hiddenTypes, statusMap, metaMap, streak, weekSessionCounts,
  schedule, today, todayFeedback, feedbackHistory, allLogs,
  handlePlanChange, toggleType,
  handleFeedbackSave, handleEventSave, setSelectedSession, openExtraPicker,
  mobileTab, setMobileTab, mobileDay, setMobileDay, mobileSessions,
}: SharedProps & MobileProps) {
  function handleDaySelect(day: DayName) {
    setMobileDay(day);
    setMobileTab('hoy');
  }

  return (
    <div className="mobile-content">
      {/* Controls strip */}
      <div className="mobile-controls-strip">
        <PlanToggle current={plan} onChange={handlePlanChange} />
        <span className={`variant-badge variant-${variant}`}>
          {variant === 'nogi' ? 'NoGi' : 'Gi'}
        </span>
        {streak > 0 && <div className="streak-badge">🔥 {streak}</div>}
      </div>

      {/* Tab content */}
      <div className="mobile-tab-content">
        {mobileTab === 'hoy' && (
          <>
            <DayNavigator selected={mobileDay} today={today} onChange={setMobileDay} />
            <MobileDayView
              dayName={mobileDay}
              todayName={today}
              sessions={mobileSessions}
              hiddenTypes={hiddenTypes}
              sessionStatuses={statusMap}
              sessionMetas={metaMap}
              onSessionClick={setSelectedSession}
              onAddSession={openExtraPicker}
            />
          </>
        )}

        {mobileTab === 'semana' && (
          <div style={{ padding: '12px 0' }}>
            <MobileWeekOverview
              schedule={schedule}
              todayName={today}
              hiddenTypes={hiddenTypes}
              sessionStatuses={statusMap}
              onDaySelect={handleDaySelect}
            />
            <div style={{ padding: '0 14px' }}>
              <FilterChips hidden={hiddenTypes} onToggle={toggleType} />
            </div>
          </div>
        )}

        {mobileTab === 'log' && (
          <div style={{ padding: 14 }}>
            <Link
              href="/logs"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', marginBottom: 14,
                background: 'var(--bg-elev)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--accent)', textDecoration: 'none',
                fontSize: 13, fontWeight: 500,
              }}
            >
              <span>Ver historial completo de sesiones</span>
              <span>→</span>
            </Link>

            <div className="sidebar-section feedback-card" style={{ marginBottom: 14 }}>
              <h2>Como me siento hoy</h2>
              <FeedbackForm initial={todayFeedback} currentPlan={plan} onSave={handleFeedbackSave} />
            </div>

            {Object.keys(weekSessionCounts).length > 0 && (
              <div className="sidebar-section" style={{ marginBottom: 14 }}>
                <h2>Esta semana</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(weekSessionCounts).map(([t, n]) => (
                    <span key={t} className="summary-chip" style={{ color: TYPES[t]?.color }}>
                      {TYPES[t]?.label ?? t} ×{n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="sidebar-section" style={{ marginBottom: 14 }}>
              <h2>Agregar evento</h2>
              <EventForm onSave={handleEventSave} />
            </div>

            <div className="sidebar-section" style={{ marginBottom: 14 }}>
              <h2>Asistencia (3 meses)</h2>
              <Heatmap logs={allLogs} months={3} />
            </div>

            <div className="sidebar-section history-card" style={{ marginBottom: 14 }}>
              <h2>Historial sesiones</h2>
              <MobileSessionLogHistory logs={allLogs} schedule={schedule} />
            </div>

            <div className="sidebar-section history-card">
              <h2>Historial diario</h2>
              {feedbackHistory.length === 0 ? (
                <div className="empty">Aun no has guardado feedback.</div>
              ) : (
                feedbackHistory.map((fb) => (
                  <div key={fb.date} className="history-entry">
                    <div className="date"><span>{fb.date} · Plan {fb.plan}</span></div>
                    <div className="stats">
                      <span>Energia {fb.energy}/5</span>
                      <span>Dolor {fb.pain}/5</span>
                      <span>Sueno {fb.sleep_hours}h</span>
                      {fb.fatigue && <span>Fatiga {fb.fatigue}/5</span>}
                    </div>
                    {fb.notes && <div className="note">{fb.notes}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {mobileTab === 'chat' && (
          <div style={{ padding: 14, height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
            <PlanningChat />
          </div>
        )}
      </div>

      <MobileNav active={mobileTab} onChange={setMobileTab} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline training log history for mobile log tab
// ─────────────────────────────────────────────────────────────────────────────
function MobileSessionLogHistory({
  logs,
  schedule,
}: {
  logs: TrainingLog[];
  schedule: Record<string, ScheduleSession[]>;
}) {
  const sessionById = Object.fromEntries(ALL_SESSIONS.map((s) => [s.id, s]));
  const extraById = Object.fromEntries(
    Object.values(schedule).flat()
      .filter((s) => s.isExtra)
      .map((s) => [s.extraSessionId ?? '', s])
  );

  const doneLogs = logs
    .filter((l) => l.status === 'done' || l.status === 'modified')
    .slice(0, 10);

  if (doneLogs.length === 0) {
    return <div className="empty">Aun no hay sesiones registradas.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {doneLogs.map((log) => {
        const session = log.extra_session_id
          ? extraById[log.extra_session_id]
          : sessionById[log.session_id ?? ''];
        if (!session) return null;
        const color = TYPES[session.type]?.color ?? 'var(--accent)';
        return (
          <div key={log.id ?? `${log.date}-${log.session_id}`} style={{
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{log.date}</span>
              <span style={{ fontSize: 11, color, background: `${color}20`, padding: '1px 6px', borderRadius: 4 }}>
                {TYPES[session.type]?.label ?? session.type}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{session.title}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{log.status}</span>
              {log.rpe && <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>RPE {log.rpe}</span>}
            </div>
            {log.note && <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>{log.note}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Prop types
// ─────────────────────────────────────────────────────────────────────────────
interface SessionMeta { status: SessionStatus | null; rpe?: number | null; hasNote?: boolean }

interface SharedProps {
  plan: PlanId;
  variant: GiNogiVariant;
  hiddenTypes: Set<string>;
  statusMap: Record<string, SessionStatus | null>;
  metaMap: Record<string, SessionMeta>;
  streak: number;
  weekSessionCounts: Record<string, number>;
  schedule: Record<string, ScheduleSession[]>;
  today: DayName;
  todaySessions: ScheduleSession[];
  todayFeedback: DailyFeedback | null;
  feedbackHistory: DailyFeedback[];
  allLogs: TrainingLog[];
  handlePlanChange: (p: PlanId) => void;
  toggleType: (t: string) => void;
  handleSessionSave: (u: { status?: SessionStatus | null; rpe?: number | null; note?: string | null }) => Promise<void>;
  handleFeedbackSave: (fb: Omit<DailyFeedback, 'id' | 'user_id' | 'date'>) => Promise<void>;
  handleEventSave: (e: Omit<ScheduleEvent, 'id' | 'user_id' | 'ai_suggestion'>) => Promise<string | null>;
  setSelectedSession: (s: ScheduleSession | null) => void;
  openExtraPicker: (day: string) => void;
}

interface MobileProps {
  mobileTab: MobileTab;
  setMobileTab: (t: MobileTab) => void;
  mobileDay: DayName;
  setMobileDay: (d: DayName) => void;
  mobileSessions: ScheduleSession[];
}
