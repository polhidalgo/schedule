import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getCurrentWeekNumber(startDate: string, totalWeeks: number): number {
  const start = new Date(startDate + 'T00:00:00')
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const week = Math.floor(diffDays / 7) + 1
  return Math.max(1, Math.min(week, totalWeeks))
}

// GET /api/sc/active — active program with current week + exercises
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: program, error: progError } = await supabase
    .from('sc_programs')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .single()

  if (progError && progError.code !== 'PGRST116') {
    return NextResponse.json({ error: progError.message }, { status: 500 })
  }
  if (!program) return NextResponse.json(null)

  const currentWeek = program.start_date
    ? getCurrentWeekNumber(program.start_date, program.total_weeks)
    : 1

  // Fetch all weeks with exercises and the exercise catalogue data
  const { data: weeks, error: weekError } = await supabase
    .from('sc_weeks')
    .select(`
      *,
      exercises:sc_program_exercises(
        *,
        exercise:sc_exercises_catalog(*)
      )
    `)
    .eq('program_id', program.id)
    .order('week_number', { ascending: true })

  if (weekError) return NextResponse.json({ error: weekError.message }, { status: 500 })

  // Sort exercises within each week by sort_order
  const weeksWithSorted = (weeks ?? []).map(w => ({
    ...w,
    exercises: (w.exercises ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
  }))

  return NextResponse.json({ ...program, current_week_number: currentWeek, weeks: weeksWithSorted })
}
