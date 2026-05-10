import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/sc/session-logs/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data, error } = await supabase
    .from('sc_session_logs')
    .select(`*, set_logs:sc_set_logs(*, exercise:sc_exercises_catalog(*))`)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/sc/session-logs/[id] — update notes or attended; replace set_logs if provided
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Verify ownership
  const { data: existing } = await supabase
    .from('sc_session_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { set_logs, ...rest } = body

  // Update session log fields
  const allowed = ['attended', 'notes', 'timetable_session_id']
  const update: Record<string, unknown> = {}
  for (const key of allowed) if (key in rest) update[key] = rest[key]

  if (Object.keys(update).length > 0) {
    const { error: updError } = await supabase
      .from('sc_session_logs')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })
  }

  // Replace set_logs if provided
  if (Array.isArray(set_logs)) {
    await supabase.from('sc_set_logs').delete().eq('session_log_id', id)

    if (set_logs.length > 0) {
      const setRows = set_logs.map((s: {
        exercise_id: string; set_number: number; weight_used?: number | null;
        reps_completed?: number | null; completed?: boolean; notes?: string | null
      }) => ({
        session_log_id: id,
        exercise_id: s.exercise_id,
        set_number: s.set_number,
        weight_used: s.weight_used ?? null,
        reps_completed: s.reps_completed ?? null,
        completed: s.completed ?? true,
        notes: s.notes ?? null,
      }))
      const { error: setError } = await supabase.from('sc_set_logs').insert(setRows)
      if (setError) return NextResponse.json({ error: setError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
