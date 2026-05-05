'use client';

export const dynamic = 'force-dynamic';

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
import { createClient } from '@/lib/supabase/client';
import { getSessionsByPlan } from '@/lib/schedule/data';
import { todayDayName, toDateKey, getWeekStart, getGiNogiVariant } from '@/lib/schedule/utils';
import type {
  PlanId, GiNogiVariant, ScheduleSession, SessionStatus,
  TrainingLog, DailyFeedback, ScheduleEvent,
} from '@/lib/schedule/types';

const DEFAULT_HIDDEN = new Set(['work', 'commute']);

export default function WeekPage() {
  const supabase = createClient();
  const today = todayDayName();
  const todayKey = toDateKey();
  const weekStart = getWeekStart();
  const autoVariant = getGiNogiVariant(weekStart);

  // ── UI state ────────────────────────────────────────────────────────────
  const [plan, setPlan] = useState<PlanId>('A');
  const [variant, setVariant] = useState<GiNogiVariant>(autoVariant);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(DEFAULT_HIDDEN);
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);

  // ── Supabase data ────────────────────────────────────────────────────────
  const [sessionLogs, setSessionLogs] = useState<TrainingLog[]>([]);
  const [todayFeedback, setTodayFeedback] = useState<DailyFeedback | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<DailyFeedback[]>([]);
  const [allLogs, setAllLogs] = useState<TrainingLog[]>([]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const schedule = getSessionsByPlan(plan);
  const todaySessions = schedule[today] ?? [];

  const statusMap: Record<string, SessionStatus | null> = {};
  sessionLogs.forEach((l) => { statusMap[l.session_id] = l.status ?? null; });

  const selectedLog = sessionLogs.find((l) => l.session_id === selectedSession?.id) ?? null;

  // ── Streak ───────────────────────────────────────────────────────────────
  const streak = (() => {
    const doneSet = new Set(
      allLogs.filter((l) => l.status === 'done' || l.status === 'modified').map((l) => l.date)
    );
    let count = 0;
    const d = new Date();
    while (doneSet.has(toDateKey(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  // ── Session type counters for the week ───────────────────────────────────
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

  // ── Load data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load week config
    const { data: weekCfg } = await supabase
      .from('week_configs')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (weekCfg) {
      setPlan(weekCfg.plan as PlanId);
      setVariant(weekCfg.gi_nogi_variant as GiNogiVariant);
    }

    // Load today's session logs
    const { data: logs } = await supabase
      .from('training_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStart);
    setSessionLogs(logs ?? []);

    // Load today's feedback
    const { data: fb } = await supabase
      .from('daily_feedback')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayKey)
      .maybeSingle();
    setTodayFeedback(fb);

    // Load recent feedback history
    const { data: hist } = await supabase
      .from('daily_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10);
    setFeedbackHistory(hist ?? []);

    // Load all logs for heatmap/streak
    const { data: allL } = await supabase
      .from('training_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(500);
    setAllLogs(allL ?? []);
  }, [supabase, weekStart, todayKey]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handlePlanChange(newPlan: PlanId) {
    setPlan(newPlan);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('week_configs').upsert({
      user_id: user.id, week_start: weekStart, plan: newPlan, gi_nogi_variant: variant,
    }, { onConflict: 'user_id,week_start' });
  }

  async function handleVariantChange(newVariant: GiNogiVariant) {
    setVariant(newVariant);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('week_configs').upsert({
      user_id: user.id, week_start: weekStart, plan, gi_nogi_variant: newVariant,
    }, { onConflict: 'user_id,week_start' });
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

    if (!update.status) {
      await supabase.from('training_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('date', todayKey)
        .eq('session_id', selectedSession.id);
    } else {
      await supabase.from('training_logs').upsert({
        user_id: user.id,
        date: todayKey,
        session_id: selectedSession.id,
        ...update,
      }, { onConflict: 'user_id,date,session_id' });
    }
    await loadData();
  }

  async function handleFeedbackSave(fb: Omit<DailyFeedback, 'id' | 'user_id' | 'date'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('daily_feedback').upsert({
      user_id: user.id, date: todayKey, ...fb,
    }, { onConflict: 'user_id,date' });
    await loadData();
  }

  async function handleEventSave(event: Omit<ScheduleEvent, 'id' | 'user_id' | 'ai_suggestion'>): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get AI suggestion
    let suggestion: string | null = null;
    try {
      const res = await fetch('/api/groq/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, plan, variant }),
      });
      if (res.ok) {
        const data = await res.json();
        suggestion = data.suggestion ?? null;
      }
    } catch { /* ignore */ }

    await supabase.from('events').insert({
      user_id: user.id, ...event, ai_suggestion: suggestion,
    });

    return suggestion;
  }

  return (
    <div>
      {/* Controls bar */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        padding: '12px 18px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-elev)',
      }}>
        <PlanToggle current={plan} onChange={handlePlanChange} />
        <GiNogiToggle current={variant} onChange={handleVariantChange} auto />
        <FilterChips hidden={hiddenTypes} onToggle={toggleType} />
        {streak > 0 && (
          <div className="streak-badge">🔥 {streak} dias</div>
        )}
      </div>

      <main className="layout">
        <WeekGrid
          schedule={schedule}
          todayName={today}
          hiddenTypes={hiddenTypes}
          sessionStatuses={statusMap}
          onSessionClick={setSelectedSession}
        />

        <aside className="sidebar">
          {/* Today */}
          <div className="sidebar-section today-card">
            <h2>Hoy · {today}</h2>
            <TodayCard todaySessions={todaySessions} hiddenTypes={hiddenTypes} />
          </div>

          {/* Week session counts */}
          {Object.keys(weekSessionCounts).length > 0 && (
            <div className="sidebar-section">
              <h2>Esta semana</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(weekSessionCounts).map(([t, n]) => (
                  <span key={t} className="summary-chip" style={{ color: `var(--text)` }}>
                    {t} ×{n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Daily feedback */}
          <div className="sidebar-section feedback-card">
            <h2>Como me siento hoy</h2>
            <FeedbackForm
              initial={todayFeedback}
              currentPlan={plan}
              onSave={handleFeedbackSave}
            />
          </div>

          {/* Events */}
          <div className="sidebar-section">
            <h2>Agregar evento</h2>
            <EventForm onSave={handleEventSave} />
          </div>

          {/* Heatmap */}
          <div className="sidebar-section">
            <h2>Asistencia (3 meses)</h2>
            <Heatmap logs={allLogs} months={3} />
          </div>

          {/* History */}
          <div className="sidebar-section history-card">
            <h2>Historial diario</h2>
            {feedbackHistory.length === 0 ? (
              <div className="empty">Aun no has guardado feedback.</div>
            ) : (
              feedbackHistory.map((fb) => (
                <div key={fb.date} className="history-entry">
                  <div className="date">
                    <span>{fb.date} · Plan {fb.plan}</span>
                  </div>
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

      {selectedSession && (
        <SessionModal
          session={selectedSession}
          log={selectedLog}
          onClose={() => setSelectedSession(null)}
          onSave={handleSessionSave}
        />
      )}
    </div>
  );
}
