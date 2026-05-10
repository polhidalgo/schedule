import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scProgramSchema } from '@/lib/validations/sc'

type Params = { params: Promise<{ id: string }> }

// GET /api/sc/programs/[id] — single program with all weeks + exercises
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: program, error: progError } = await supabase
    .from('sc_programs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .single()

  if (progError) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: weeks, error: weekError } = await supabase
    .from('sc_weeks')
    .select(`
      *,
      exercises:sc_program_exercises(
        *,
        exercise:sc_exercises_catalog(*)
      )
    `)
    .eq('program_id', id)
    .order('week_number', { ascending: true })

  if (weekError) return NextResponse.json({ error: weekError.message }, { status: 500 })

  const weeksWithSorted = (weeks ?? []).map(w => ({
    ...w,
    exercises: (w.exercises ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
  }))

  return NextResponse.json({ ...program, weeks: weeksWithSorted })
}

// PATCH /api/sc/programs/[id] — update program metadata and/or replace weeks+exercises
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Verify ownership
  const { data: existing } = await supabase
    .from('sc_programs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If weeks are included, do a full replace via scProgramSchema
  if (body.weeks !== undefined) {
    const parsed = scProgramSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { weeks, ...programData } = parsed.data

    // Update program metadata
    const { error: updError } = await supabase
      .from('sc_programs')
      .update({ ...programData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })

    // Delete and re-insert weeks (cascade deletes program_exercises)
    await supabase.from('sc_weeks').delete().eq('program_id', id)

    if (weeks.length > 0) {
      const weekRows = weeks.map(w => ({
        program_id: id,
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

      const weekIdMap: Record<number, string> = {}
      for (const w of insertedWeeks) weekIdMap[w.week_number] = w.id

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
  } else {
    // Just update metadata fields (name, notes, start_date, etc.)
    const allowed = ['name', 'total_weeks', 'days_per_week', 'start_date', 'notes', 'is_active']
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of allowed) if (key in body) update[key] = body[key]

    const { error: updError } = await supabase
      .from('sc_programs')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/sc/programs/[id] — soft-delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('sc_programs')
    .update({ is_deleted: true, is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
