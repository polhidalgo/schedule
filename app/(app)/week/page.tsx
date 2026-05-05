'use client';

import { useCallback, useEffect, useState } from 'react';
import WeekGrid from '@/components/WeekGrid';
import PlanToggle from '@/components/PlanToggle';
import GiNogiToggle from '@/components/GiNogiToggle';
import FilterChips from '@/components/FilterChips';
import TodayCard from '@/components/TodayCard';
import FeedbackForm from '@/components/FeedbackForm';
import SessionModal from '@/components/SessionModal';
import EventForm from '@/components/EventForm';
import Heatmap from '@/components/Heatmap';
import MobileNav, { type MobileTab } from '@/components/MobileNav';
import DayNavigator from '@/components/DayNavigator';
import MobileDayView from '@/components/MobileDayView';
import MobileWeekOverview from '@/components/MobileWeekOverview';
import PlanningChat from '@/components/PlanningChat';
import { createClient } from '@/lib/supabase/client';
import { getSessionsByPlan, TYPES } from '@/lib/schedule/data';
import { todayDayName, toDateKey, getWeekStart, getGiNogiVariant, dayNameToDateKey } from '@/lib/schedule/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import type {
  PlanId, GiNogiVariant, ScheduleSession, SessionStatus,
  TrainingLog, DailyFeedback, ScheduleEvent,
} from '@/lib/schedule/types';
import type { DayName } from '@/lib/schedule/data';

const DEFAULT_HIDDEN = new Set(['work', 'commute']);

export default function WeekPage() {
  const supabase = createClient();
  const today = todayDayName();
  const todayKey = toDateKey();
  const weekStart = getWeekStart();
  const autoVariant = getGiNogiVariant(weekStart);
  const isMobile = useIsMobile();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [plan, setPlan] = useState<PlanId>('A');
  const [variant, setVariant] = useState<GiNogiVariant>(autoVariant);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(DEFAULT_HIDDEN);
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);

  // Mobile-specific state
  const [mobileTab, setMobileTab] = useState<MobileTab>('hoy');
  const [mobileDay, setMobileDay] = useState<DayName>(today);

  // ── Supabase data ─────────────────────────────────────────────────────────
  const [sessionLogs, setSessionLogs] = useState<TrainingLog[]>([]);
  const [todayFeedback, setTodayFeedback] = useState<DailyFeedback | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<DailyFeedback[]>([]);
  const [allLogs, setAllLogs] = useState<TrainingLog[]>([]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const schedule = getSessionsByPlan(plan);
  const todaySessions = schedule[today] ?? [];
  const mobileSessions = schedule[mobileDay] ?? [];

  // Enriched map: status + rpe + hasNote per session_id
  const metaMap: Record<string, { status: SessionStatus | null; rpe?: number | null; hasNote?: boolean }> = {};
  sessionLogs.forEach((l) => {
    metaMap[l.session_id] = { status: l.status ?? null, rpe: l.rpe, hasNote: !!l.note };
  });

  // Simple status-only map for components that only need status
  const statusMap: Record<string, SessionStatus | null> = {};
  Object.entries(metaMap).forEach(([id, m]) => { statusMap[id] = m.status; });

  const selectedLog = sessionLogs.find((l) => l.session_id === selectedSession?.id) ?? null;

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
    const weekDoneIds = new Set(
      sessionLogs.filter((l) => l.status === 'done' || l.status === 'modified').map((l) => l.session_id)
    );
    Object.values(schedule).flat().forEach((s) => {
      if (weekDoneIds.has(s.id)) counts[s.type] = (counts[s.type] ?? 0) + 1;
    });
    return counts;
  })();

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: weekCfg } = await supabase
      .from('week_configs').select('*')
      .eq('user_id', user.id).eq('week_start', weekStart).maybeSingle();
    if (weekCfg) { setPlan(weekCfg.plan as PlanId); setVariant(weekCfg.gi_nogi_variant as GiNogiVariant); }

    const { data: logs } = await supabase
      .from('training_logs').select('*')
      .eq('user_id', user.id).gte('date', weekStart);
    setSessionLogs(logs ?? []);

    const { data: fb } = await supabase
      .from('daily_feedback').select('*')
      .eq('user_id', user.id).eq('date', todayKey).maybeSingle();
    setTodayFeedback(fb);

    const { data: hist } = await supabase
      .from('daily_feedback').select('*')
      .eq('user_id', user.id).order('date', { ascending: false }).limit(10);
    setFeedbackHistory(hist ?? []);

    // High limit covers ~3 sessions/day × 365 days = ~1095; 5000 ensures years of history
    const { data: allL } = await supabase
      .from('training_logs').select('*')
      .eq('user_id', user.id).order('date', { ascending: false }).limit(5000);
    setAllLogs(allL ?? []);
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

  async function handleVariantChange(newVariant: GiNogiVariant) {
    setVariant(newVariant);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('week_configs').upsert(
      { user_id: user.id, week_start: weekStart, plan, gi_nogi_variant: newVariant },
      { onConflict: 'user_id,week_start' }
    );
  }

  function toggleType(type: string) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }

  async function handleSessionSave(update: {
    status?: SessionStatus | null; rpe?: number | null; note?: string | null;
  }) {
    if (!selectedSession) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Use the actual date of the session's day in this week, not always today
    const sessionDate = dayNameToDateKey(selectedSession.day_name, weekStart);
    if (!update.status) {
      await supabase.from('training_logs').delete()
        .eq('user_id', user.id).eq('date', sessionDate).eq('session_id', selectedSession.id);
    } else {
      await supabase.from('training_logs').upsert(
        { user_id: user.id, date: sessionDate, session_id: selectedSession.id, ...update },
        { onConflict: 'user_id,date,session_id' }
      );
    }
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

  // ── Shared props ──────────────────────────────────────────────────────────
  const sharedProps = {
    plan, variant, hiddenTypes, statusMap, metaMap, streak, weekSessionCounts,
    schedule, today, todaySessions, todayFeedback, feedbackHistory, allLogs,
    handlePlanChange, handleVariantChange, toggleType,
    handleSessionSave, handleFeedbackSave, handleEventSave,
    setSelectedSession,
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
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop Layout (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
function DesktopLayout({
  plan, variant, hiddenTypes, statusMap, metaMap, streak, weekSessionCounts,
  schedule, today, todaySessions, todayFeedback, feedbackHistory, allLogs,
  handlePlanChange, handleVariantChange, toggleType,
  handleFeedbackSave, handleEventSave, setSelectedSession,
}: SharedProps) {
  return (
    <div>
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        padding: '12px 18px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-elev)',
      }}>
        <PlanToggle current={plan} onChange={handlePlanChange} />
        <GiNogiToggle current={variant} onChange={handleVariantChange} auto />
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
  handlePlanChange, handleVariantChange, toggleType,
  handleFeedbackSave, handleEventSave, setSelectedSession,
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
        <GiNogiToggle current={variant} onChange={handleVariantChange} auto />
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
  handleVariantChange: (v: GiNogiVariant) => void;
  toggleType: (t: string) => void;
  handleSessionSave: (u: { status?: SessionStatus | null; rpe?: number | null; note?: string | null }) => Promise<void>;
  handleFeedbackSave: (fb: Omit<DailyFeedback, 'id' | 'user_id' | 'date'>) => Promise<void>;
  handleEventSave: (e: Omit<ScheduleEvent, 'id' | 'user_id' | 'ai_suggestion'>) => Promise<string | null>;
  setSelectedSession: (s: ScheduleSession | null) => void;
}

interface MobileProps {
  mobileTab: MobileTab;
  setMobileTab: (t: MobileTab) => void;
  mobileDay: DayName;
  setMobileDay: (d: DayName) => void;
  mobileSessions: ScheduleSession[];
}
