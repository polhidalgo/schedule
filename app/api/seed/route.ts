import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ALL_SESSIONS } from '@/lib/schedule/data';

/**
 * POST /api/seed
 * Seeds the schedule_sessions table from the TypeScript data.
 * Safe to call multiple times — uses upsert.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = ALL_SESSIONS.map((s) => ({
      id: s.id,
      plan: s.plan,
      day_name: s.day_name,
      start_time: s.start,
      end_time: s.end,
      title: s.title,
      type: s.type,
      location: s.location ?? null,
      note: s.note ?? null,
      is_optional: s.is_optional ?? false,
      sort_order: s.sort_order ?? 0,
    }));

    const { error } = await supabase
      .from('schedule_sessions')
      .upsert(rows, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ seeded: rows.length });
  } catch (err) {
    console.error('[seed]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
