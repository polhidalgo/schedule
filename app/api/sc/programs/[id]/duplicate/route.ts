import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// POST /api/sc/programs/[id]/duplicate — copy program structure into a new program
export async function POST(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Fetch original program
  const { data: original, error: progError } = await supabase
    .from('sc_programs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .single()
  if (progError || !original) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch weeks + exercises
  const { data: weeks } = await supabase
    .from('sc_weeks')
    .select('*, exercises:sc_program_exercises(*)')
    .eq('program_id', id)
    .order('week_number', { ascending: true })

  // Create new program
  const { data: newProgram, error: newProgError } = await supabase
    .from('sc_programs')
    .insert({
      user_id: user.id,
      name: `${original.name} (copia)`,
      total_weeks: original.total_weeks,
      days_per_week: original.days_per_week,
      start_date: null, // Reset start date on copy
      is_active: false,
      notes: original.notes,
    })
    .select()
    .single()

  if (newProgError) return NextResponse.json({ error: newProgError.message }, { status: 500 })

  // Copy weeks
  if (weeks && weeks.length > 0) {
    const weekRows = weeks.map((w: { week_number: number; phase_name: string | null; rpe_target: string | null; notes: string | null }) => ({
      program_id: newProgram.id,
      week_number: w.week_number,
      phase_name: w.phase_name,
      rpe_target: w.rpe_target,
      notes: w.notes,
    }))

    const { data: newWeeks, error: weekError } = await supabase
      .from('sc_weeks')
      .insert(weekRows)
      .select()
    if (weekError) return NextResponse.json({ error: weekError.message }, { status: 500 })

    const weekIdMap: Record<number, string> = {}
    for (const w of newWeeks) weekIdMap[w.week_number] = w.id

    const exerciseRows: object[] = []
    for (const week of weeks) {
      const newWeekId = weekIdMap[week.week_number]
      if (!newWeekId) continue
      for (const ex of (week.exercises ?? [])) {
        exerciseRows.push({
          week_id: newWeekId,
          session_number: ex.session_number,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps_target: ex.reps_target,
          weight_target: ex.weight_target,
          rpe_target: ex.rpe_target,
          sort_order: ex.sort_order,
          notes: ex.notes,
        })
      }
    }

    if (exerciseRows.length > 0) {
      const { error: exError } = await supabase.from('sc_program_exercises').insert(exerciseRows)
      if (exError) return NextResponse.json({ error: exError.message }, { status: 500 })
    }
  }

  return NextResponse.json(newProgram, { status: 201 })
}
