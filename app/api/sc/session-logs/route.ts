import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scSessionLogSchema } from '@/lib/validations/sc'

// GET /api/sc/session-logs?program_id=...&week_number=...
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const programId = request.nextUrl.searchParams.get('program_id')
  const weekNumber = request.nextUrl.searchParams.get('week_number')

  let query = supabase
    .from('sc_session_logs')
    .select(`*, set_logs:sc_set_logs(*, exercise:sc_exercises_catalog(*))`)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  if (programId) query = query.eq('program_id', programId)
  if (weekNumber) query = query.eq('week_number', parseInt(weekNumber))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/sc/session-logs — log a session with nested set_logs
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = scSessionLogSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { set_logs, ...sessionData } = parsed.data

  // Insert session log
  const { data: sessionLog, error: sessError } = await supabase
    .from('sc_session_logs')
    .insert({ ...sessionData, user_id: user.id })
    .select()
    .single()

  if (sessError) return NextResponse.json({ error: sessError.message }, { status: 500 })

  // Insert set logs if attended
  if (sessionData.attended && set_logs.length > 0) {
    const setRows = set_logs.map(s => ({
      session_log_id: sessionLog.id,
      exercise_id: s.exercise_id,
      set_number: s.set_number,
      weight_used: s.weight_used ?? null,
      reps_completed: s.reps_completed ?? null,
      completed: s.completed,
      notes: s.notes ?? null,
    }))
    const { error: setError } = await supabase.from('sc_set_logs').insert(setRows)
    if (setError) return NextResponse.json({ error: setError.message }, { status: 500 })
  }

  return NextResponse.json(sessionLog, { status: 201 })
}
