import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getGroqClient } from '@/lib/groq/client'
import { buildWeeklyReviewPrompt } from '@/lib/groq/prompts'
import { getMondayOfWeek, formatDateKey } from '@/lib/schedule/utils'
import { subWeeks, addDays, format } from 'date-fns'

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const groq = getGroqClient()

  const weekStart = formatDateKey(getMondayOfWeek(subWeeks(new Date(), 1))) // Last week
  const weekEnd = formatDateKey(addDays(new Date(weekStart), 6))

  const { data: users } = await supabase.auth.admin.listUsers()
  if (!users) return NextResponse.json({ error: 'No users' }, { status: 500 })

  const results = []

  for (const user of users.users) {
    try {
      // Check if review already exists
      const { data: existing } = await supabase
        .from('weekly_reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single()

      if (existing) {
        results.push({ userId: user.id, status: 'already_exists' })
        continue
      }

      // Fetch week data
      const { data: week } = await supabase
        .from('weeks')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single()

      const { data: sessions } = await supabase
        .from('sessions')
        .select('*, session_log:session_logs(*)')
        .eq('user_id', user.id)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .eq('is_deleted', false)

      const { data: dailyLogs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekStart)
        .lte('date', weekEnd)

      const { data: sleepLogs } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('sleep_start', new Date(weekStart).toISOString())
        .lte('sleep_start', new Date(weekEnd + 'T23:59:59').toISOString())
        .not('sleep_end', 'is', null)

      // Previous week comparison
      const prevWeekStart = formatDateKey(subWeeks(new Date(weekStart), 1))
      const prevWeekEnd = formatDateKey(addDays(new Date(prevWeekStart), 6))
      const { data: prevSessions } = await supabase
        .from('sessions')
        .select('*, session_log:session_logs(*)')
        .eq('user_id', user.id)
        .gte('date', prevWeekStart)
        .lte('date', prevWeekEnd)
        .eq('is_deleted', false)
        .eq('category', 'training')

      const prevAvgRpe = prevSessions
        ? (() => {
            const rpes = prevSessions
              .map(s => (Array.isArray(s.session_log) ? s.session_log[0] : s.session_log)?.rpe)
              .filter(Boolean) as number[]
            return rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null
          })()
        : null

      const prevAttended = prevSessions?.filter(s => {
        const log = Array.isArray(s.session_log) ? s.session_log[0] : s.session_log
        return !log || log.attended !== false
      }).length ?? 0
      const prevTotal = prevSessions?.length ?? 0
      const prevAttendanceRate = prevTotal > 0 ? (prevAttended / prevTotal) * 100 : null

      const { system, user: userPrompt } = buildWeeklyReviewPrompt({
        weekStart,
        weekEnd,
        activeTimetable: week?.active_timetable ?? 'A',
        switchedMidWeek: !!week?.timetable_switched_at,
        previousTimetable: week?.previous_timetable ?? undefined,
        sessions: sessions ?? [],
        dailyLogs: dailyLogs ?? [],
        sleepLogs: sleepLogs ?? [],
        previousWeek: {
          avgRpe: prevAvgRpe,
          attendanceRate: prevAttendanceRate,
          totalSessions: prevTotal,
        },
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

      await supabase.from('weekly_reviews').upsert({
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

      results.push({ userId: user.id, status: 'generated', score: parsed.overall_score })
    } catch (err) {
      results.push({ userId: user.id, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ success: true, weekStart, results })
}
