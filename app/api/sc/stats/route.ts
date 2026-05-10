import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/sc/stats?program_id=...
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const programId = request.nextUrl.searchParams.get('program_id')
  if (!programId) return NextResponse.json({ error: 'program_id required' }, { status: 400 })

  // Fetch program
  const { data: program, error: progError } = await supabase
    .from('sc_programs')
    .select('*')
    .eq('id', programId)
    .eq('user_id', user.id)
    .single()
  if (progError || !program) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch session logs with set_logs and exercise names
  const { data: sessionLogs } = await supabase
    .from('sc_session_logs')
    .select(`
      *,
      set_logs:sc_set_logs(
        *,
        exercise:sc_exercises_catalog(id, name)
      )
    `)
    .eq('program_id', programId)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: true })

  // Fetch program exercises to compute totals
  const { data: programExercises } = await supabase
    .from('sc_program_exercises')
    .select('*, week:sc_weeks!inner(program_id)')
    .eq('week.program_id', programId)

  const logs = sessionLogs ?? []
  const plannedExercises = programExercises ?? []

  // Sessions total = total_weeks × days_per_week
  const sessionsTotal = program.total_weeks * program.days_per_week
  const sessionsCompleted = logs.filter(l => l.attended).length
  const attendanceRate = sessionsTotal > 0 ? Math.round((sessionsCompleted / sessionsTotal) * 100) : 0

  // Sets stats
  const setsTotal = plannedExercises.reduce((acc: number, ex: { sets: number }) => acc + ex.sets, 0)
  const setsCompleted = logs
    .flatMap((l: { set_logs: { completed: boolean }[] }) => l.set_logs ?? [])
    .filter((s: { completed: boolean }) => s.completed).length
  const setAdherenceRate = setsTotal > 0 ? Math.round((setsCompleted / setsTotal) * 100) : 0

  // Weight progression: max weight per exercise per week
  const weightMap: Record<string, Record<number, { max: number; total: number; count: number }>> = {}
  for (const log of logs) {
    for (const setLog of (log.set_logs ?? [])) {
      if (!setLog.weight_used || !setLog.exercise?.name) continue
      const exId = setLog.exercise_id
      const exName = setLog.exercise.name
      const wk = log.week_number

      if (!weightMap[exId]) weightMap[exId] = {}
      if (!weightMap[exId][wk]) weightMap[exId][wk] = { max: 0, total: 0, count: 0 }
      weightMap[exId][wk].max = Math.max(weightMap[exId][wk].max, setLog.weight_used)
      weightMap[exId][wk].total += setLog.weight_used
      weightMap[exId][wk].count++
      // Store exercise name alongside
      ;(weightMap[exId] as Record<number | string, unknown>).__name = exName
    }
  }

  const weightProgression = Object.entries(weightMap).flatMap(([exId, weeks]) => {
    const exName = (weeks as Record<number | string, unknown>).__name as string | undefined
    return Object.entries(weeks)
      .filter(([k]) => !isNaN(Number(k)))
      .map(([wk, data]) => ({
        date: `Semana ${wk}`,
        exercise_id: exId,
        exercise_name: exName ?? exId,
        avg_weight: Math.round(((data as { total: number; count: number }).total / (data as { count: number }).count) * 10) / 10,
        max_weight: (data as { max: number }).max,
        week_number: parseInt(wk),
      }))
  }).sort((a, b) => a.week_number - b.week_number)

  // Weekly volume: sum(weight × reps) per week
  const volumeMap: Record<number, { total: number; byExercise: Record<string, number> }> = {}
  for (const log of logs) {
    if (!log.attended) continue
    const wk = log.week_number
    if (!volumeMap[wk]) volumeMap[wk] = { total: 0, byExercise: {} }
    for (const setLog of (log.set_logs ?? [])) {
      if (!setLog.completed || !setLog.weight_used || !setLog.reps_completed) continue
      const vol = setLog.weight_used * setLog.reps_completed
      volumeMap[wk].total += vol
      const exName = setLog.exercise?.name ?? setLog.exercise_id
      volumeMap[wk].byExercise[exName] = (volumeMap[wk].byExercise[exName] ?? 0) + vol
    }
  }

  const weeklyVolume = Object.entries(volumeMap).map(([wk, data]) => ({
    week_number: parseInt(wk),
    week_label: `S${wk}`,
    total_volume: Math.round(data.total),
    by_exercise: data.byExercise,
  })).sort((a, b) => a.week_number - b.week_number)

  // Exercise adherence
  const exercisePlannedSets: Record<string, { name: string; planned: number }> = {}
  for (const ex of plannedExercises) {
    const key = ex.exercise_id
    if (!exercisePlannedSets[key]) {
      exercisePlannedSets[key] = { name: ex.exercise_id, planned: 0 }
    }
    exercisePlannedSets[key].planned += ex.sets * program.total_weeks
  }
  const exerciseCompletedSets: Record<string, number> = {}
  for (const log of logs) {
    for (const setLog of (log.set_logs ?? [])) {
      if (setLog.completed) {
        exerciseCompletedSets[setLog.exercise_id] = (exerciseCompletedSets[setLog.exercise_id] ?? 0) + 1
      }
    }
  }

  const exerciseAdherence = Object.entries(exercisePlannedSets)
    .filter(([, v]) => v.planned > 0)
    .map(([exId, v]) => ({
      exercise_id: exId,
      name: v.name,
      rate: Math.round(((exerciseCompletedSets[exId] ?? 0) / v.planned) * 100),
    }))

  return NextResponse.json({
    programId,
    programName: program.name,
    totalWeeks: program.total_weeks,
    sessionsCompleted,
    sessionsTotal,
    adherenceRate: attendanceRate,
    setsCompleted,
    setsTotal,
    setAdherenceRate,
    weightProgression,
    weeklyVolume,
    exerciseAdherence,
  })
}
