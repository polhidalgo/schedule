import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroqClient } from '@/lib/groq/client'
import { buildWeeklyReviewPrompt } from '@/lib/groq/prompts'
import { getMondayOfWeek, formatDateKey } from '@/lib/schedule/utils'
import type { Session, SessionLog } from '@/lib/schedule/types'
import { subWeeks, addDays } from 'date-fns'

// POST /api/groq/review - manually trigger review for a specific week
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { weekStart: weekStartParam } = await request.json().catch(() => ({}))
  const weekStart = weekStartParam ?? formatDateKey(getMondayOfWeek(subWeeks(new Date(), 1)))
  const weekEnd = formatDateKey(addDays(new Date(weekStart), 6))

  // Rate limiting: max 2 reviews per week
  const { count } = await supabase
    .from('weekly_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('generated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  if ((count ?? 0) >= 2) {
    return NextResponse.json({ error: 'Rate limit: max 2 reviews per week' }, { status: 429 })
  }

  const groq = getGroqClient()

  // Fetch all data
  const [sessionsResult, dailyLogsResult, sleepResult, weekResult] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, session_log:session_logs(*)')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .eq('is_deleted', false),
    supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd),
    supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('sleep_start', new Date(weekStart + 'T00:00:00').toISOString())
      .lte('sleep_start', new Date(weekEnd + 'T23:59:59').toISOString())
      .not('sleep_end', 'is', null),
    supabase
      .from('weeks')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single(),
  ])

  const sessionsNormalized = ((sessionsResult.data ?? []) as (Session & {
    session_log?: SessionLog | SessionLog[] | null
  })[]).map(s => ({
    ...s,
    session_log: Array.isArray(s.session_log)
      ? (s.session_log[0] ?? null)
      : (s.session_log ?? null),
  }))

  const prevWeekStart = formatDateKey(subWeeks(new Date(`${weekStart}T12:00:00`), 1))
  const prevWeekEnd = formatDateKey(addDays(new Date(`${prevWeekStart}T12:00:00`), 6))

  const [{ data: prevSessions }, { data: activeProgram }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, session_log:session_logs(*)')
      .eq('user_id', user.id)
      .gte('date', prevWeekStart)
      .lte('date', prevWeekEnd)
      .eq('is_deleted', false),
    supabase
      .from('sc_programs')
      .select('id, name, total_weeks')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .maybeSingle(),
  ])

  const prevTraining =
    (prevSessions as (Session & { session_log?: SessionLog | SessionLog[] | null })[] | null)?.filter(
      s => s.category === 'training',
    ) ?? []

  const prevAvgRpe =
    prevTraining.length > 0
      ? (() => {
          const rpes = prevTraining
            .map(s => {
              const raw = s.session_log
              const log =
                raw == null ? null : Array.isArray(raw) ? (raw[0] ?? null) : raw
              return log?.rpe
            })
            .filter((r): r is number => typeof r === 'number' && r > 0)
          return rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null
        })()
      : null

  const prevAttended = prevTraining.filter(s => {
    const raw = s.session_log
    const log = raw == null ? null : Array.isArray(raw) ? (raw[0] ?? null) : raw
    return !!log && log.attended !== false
  }).length
  const prevTotal = prevTraining.length
  const prevAttendanceRate =
    prevTotal > 0 ? Math.round((prevAttended / prevTotal) * 100) : null

  let scData: Parameters<typeof buildWeeklyReviewPrompt>[0]['scData']
  if (activeProgram?.id) {
    const { data: scLogs } = await supabase
      .from('sc_session_logs')
      .select(`
        week_number, session_number, attended, notes,
        set_logs:sc_set_logs(
          set_number, weight_used, reps_completed, completed,
          exercise:sc_exercises_catalog(name)
        )
      `)
      .eq('program_id', activeProgram.id)
      .eq('user_id', user.id)
      .gte('completed_at', new Date(weekStart + 'T00:00:00').toISOString())
      .lte('completed_at', new Date(weekEnd + 'T23:59:59').toISOString())

    if (scLogs && scLogs.length > 0) {
      scData = {
        programName: activeProgram.name,
        weekNumber: (scLogs[0] as { week_number?: number }).week_number ?? 1,
        totalWeeks: activeProgram.total_weeks,
        sessionsLogged: scLogs.map((l) => ({
          week_number: l.week_number as number,
          session_number: l.session_number as number,
          attended: l.attended as boolean,
          notes: l.notes as string | null,
          set_logs: ((l.set_logs ?? []) as Array<{
            set_number: number
            weight_used: number | null
            reps_completed: number | null
            completed: boolean
            exercise: Array<{ name: string }> | { name: string } | null
          }>).map((s) => ({
            exercise_name:
              (Array.isArray(s.exercise) ? s.exercise[0]?.name : s.exercise?.name) ?? 'Desconocido',
            set_number: s.set_number,
            weight_used: s.weight_used,
            reps_completed: s.reps_completed,
            completed: s.completed,
          })),
        })),
      }
    }
  }

  const { system, user: userPrompt } = buildWeeklyReviewPrompt({
    weekStart,
    weekEnd,
    activeTimetable: weekResult.data?.active_timetable ?? 'A',
    switchedMidWeek: !!weekResult.data?.timetable_switched_at,
    previousTimetable: weekResult.data?.previous_timetable ?? undefined,
    sessions: sessionsNormalized,
    dailyLogs: dailyLogsResult.data ?? [],
    sleepLogs: sleepResult.data ?? [],
    previousWeek: {
      avgRpe: prevAvgRpe,
      attendanceRate: prevAttendanceRate,
      totalSessions: prevTotal,
    },
    scData,
  })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 2000,
  })

  const responseText = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(responseText)

  const { data, error } = await supabase
    .from('weekly_reviews')
    .upsert({
      user_id: user.id,
      week_start: weekStart,
      overall_score: parsed.overall_score,
      training_load_analysis: parsed.training_load_analysis,
      recommendations: parsed.recommendations,
      alerts: parsed.alerts,
      recovery_suggestions: parsed.recovery_suggestions,
      patterns_detected: parsed.patterns_detected,
      full_response: parsed,
    }, { onConflict: 'user_id,week_start' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
