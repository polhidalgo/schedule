import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scProgramSchema } from '@/lib/validations/sc'

// GET /api/sc/programs — list all programs for the user
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('sc_programs')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/sc/programs — create a full program (with nested weeks + exercises)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = scProgramSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { weeks, ...programData } = parsed.data

  // Insert program
  const { data: program, error: progError } = await supabase
    .from('sc_programs')
    .insert({ ...programData, user_id: user.id })
    .select()
    .single()

  if (progError) return NextResponse.json({ error: progError.message }, { status: 500 })

  // Insert weeks
  if (weeks.length > 0) {
    const weekRows = weeks.map(w => ({
      program_id: program.id,
      week_number: w.week_number,
      phase_name: w.phase_name ?? null,
      rpe_target: w.rpe_target ?? null,
      notes: w.notes ?? null,
    }))

    const { data: insertedWeeks, error: weekError } = await supabase
      .from('sc_weeks')
      .insert(weekRows)
      .select()

    if (weekError) return NextResponse.json({ error: weekError.message }, { status: 500 })

    // Map week_number → id
    const weekIdMap: Record<number, string> = {}
    for (const w of insertedWeeks) weekIdMap[w.week_number] = w.id

    // Insert exercises for all sessions in all weeks
    const exerciseRows: object[] = []
    for (const week of weeks) {
      const weekId = weekIdMap[week.week_number]
      if (!weekId) continue
      for (const session of week.sessions) {
        for (const ex of session.exercises) {
          exerciseRows.push({
            week_id: weekId,
            session_number: session.session_number,
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps_target: ex.reps_target,
            weight_target: ex.weight_target ?? null,
            rpe_target: ex.rpe_target ?? null,
            sort_order: ex.sort_order,
            notes: ex.notes ?? null,
          })
        }
      }
    }

    if (exerciseRows.length > 0) {
      const { error: exError } = await supabase.from('sc_program_exercises').insert(exerciseRows)
      if (exError) return NextResponse.json({ error: exError.message }, { status: 500 })
    }
  }

  return NextResponse.json(program, { status: 201 })
}
