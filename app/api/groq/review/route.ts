import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroqClient } from '@/lib/groq/client'
import { buildWeeklyReviewPrompt } from '@/lib/groq/prompts'
import { getMondayOfWeek, formatDateKey } from '@/lib/schedule/utils'
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
      .gte('sleep_start', new Date(weekStart).toISOString())
      .not('sleep_end', 'is', null),
    supabase
      .from('weeks')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .single(),
  ])

  const { system, user: userPrompt } = buildWeeklyReviewPrompt({
    weekStart,
    weekEnd,
    activeTimetable: weekResult.data?.active_timetable ?? 'A',
    switchedMidWeek: !!weekResult.data?.timetable_switched_at,
    previousTimetable: weekResult.data?.previous_timetable ?? undefined,
    sessions: sessionsResult.data ?? [],
    dailyLogs: dailyLogsResult.data ?? [],
    sleepLogs: sleepResult.data ?? [],
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
