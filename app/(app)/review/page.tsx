'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import WeeklyReview from '@/components/WeeklyReview';
import { createClient } from '@/lib/supabase/client';
import { getWeekStart, getPastWeekStarts } from '@/lib/schedule/utils';
import type { WeeklyReview as WeeklyReviewType } from '@/lib/schedule/types';

export default function ReviewPage() {
  const supabase = createClient();
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart());
  const [review, setReview] = useState<WeeklyReviewType | null>(null);
  const [generating, setGenerating] = useState(false);
  const weekOptions = getPastWeekStarts(8);

  const loadReview = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', selectedWeek)
      .maybeSingle();
    setReview(data);
  }, [supabase, selectedWeek]);

  useEffect(() => { loadReview(); }, [loadReview]);

  async function handleGenerate() {
    setGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGenerating(false); return; }

    // Fetch raw data for the week
    const [{ data: logs }, { data: feedback }, { data: events }] = await Promise.all([
      supabase.from('training_logs').select('*').eq('user_id', user.id).gte('date', selectedWeek).lt('date', (() => {
        const d = new Date(selectedWeek); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0];
      })()),
      supabase.from('daily_feedback').select('*').eq('user_id', user.id).gte('date', selectedWeek).lt('date', (() => {
        const d = new Date(selectedWeek); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0];
      })()),
      supabase.from('events').select('*').eq('user_id', user.id).gte('date', selectedWeek).lt('date', (() => {
        const d = new Date(selectedWeek); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0];
      })()),
    ]);

    try {
      const res = await fetch('/api/groq/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart: selectedWeek, logs, feedback, events }),
      });
      if (!res.ok) throw new Error('Review generation failed');
      const data = await res.json();

      await supabase.from('weekly_reviews').upsert({
        user_id: user.id,
        week_start: selectedWeek,
        summary: data.summary,
        load_recommendation: data.load_recommendation,
        lifestyle_recommendation: data.lifestyle_recommendation,
        overtraining_alert: data.overtraining_alert ?? false,
        raw_data: { logs, feedback, events },
      }, { onConflict: 'user_id,week_start' });

      await loadReview();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main style={{ padding: 18, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Valoracion semanal</h2>
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          style={{
            background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '7px 10px', fontSize: 13, color: 'var(--text)',
          }}
        >
          {weekOptions.map((w) => (
            <option key={w} value={w}>Semana del {w}</option>
          ))}
        </select>
      </div>

      <div className="sidebar-section" style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
        <WeeklyReview
          review={review}
          weekStart={selectedWeek}
          onGenerate={handleGenerate}
          generating={generating}
        />
      </div>
    </main>
  );
}
