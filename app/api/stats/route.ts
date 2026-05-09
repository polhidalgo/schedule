import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subDays, format } from 'date-fns'

// GET /api/stats?range=week|month|3months
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const range = request.nextUrl.searchParams.get('range') ?? 'month'
  const days = range === 'week' ? 7 : range === '3months' ? 90 : 30
  const fromDate = format(subDays(new Date(), days), 'yyyy-MM-dd')
  const toDate = format(new Date(), 'yyyy-MM-dd')

  const [sessionsResult, logsResult, sleepResult] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, session_log:session_logs(*)')
      .eq('user_id', user.id)
      .gte('date', fromDate)
      .lte('date', toDate)
      .eq('is_deleted', false)
      .eq('category', 'training')
      .order('date', { ascending: true }),

    supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true }),

    supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('sleep_start', new Date(fromDate).toISOString())
      .not('sleep_end', 'is', null)
      .order('sleep_start', { ascending: true }),
  ])

  const sessions = sessionsResult.data ?? []
  const dailyLogs = logsResult.data ?? []
  const sleepLogs = sleepResult.data ?? []

  // Helper: resolve session_log from Supabase join (returns array even for 1-1)
  function getLog(s: { session_log: unknown }) {
    const log = Array.isArray(s.session_log) ? s.session_log[0] : s.session_log
    return log as { attended: boolean; rpe?: number; fatigue?: number; technical_quality?: number } | null | undefined
  }

  // A session is "attended" ONLY if a log exists with attended !== false.
  // Sessions without a log have not been registered → not counted.
  function wasAttended(s: { session_log: unknown }): boolean {
    const log = getLog(s)
    return !!log && log.attended !== false
  }

  // Attendance by session type — total = planned, attended = explicitly logged
  const attendanceByType: Record<string, { total: number; attended: number }> = {}
  for (const s of sessions) {
    if (!attendanceByType[s.session_type]) {
      attendanceByType[s.session_type] = { total: 0, attended: 0 }
    }
    attendanceByType[s.session_type].total++
    if (wasAttended(s)) {
      attendanceByType[s.session_type].attended++
    }
  }

  // RPE by session type — only from logged sessions
  const rpeByType: Record<string, number[]> = {}
  for (const s of sessions) {
    const log = getLog(s)
    if (log?.rpe) {
      if (!rpeByType[s.session_type]) rpeByType[s.session_type] = []
      rpeByType[s.session_type].push(log.rpe)
    }
  }

  // Fatigue by session type — only from logged sessions
  const fatigueByType: Record<string, number[]> = {}
  for (const s of sessions) {
    const log = getLog(s)
    if (log?.fatigue) {
      if (!fatigueByType[s.session_type]) fatigueByType[s.session_type] = []
      fatigueByType[s.session_type].push(log.fatigue)
    }
  }

  // Heatmap: only count days where sessions were actually attended
  const sessionsPerDay: Record<string, number> = {}
  for (const s of sessions) {
    if (wasAttended(s)) {
      sessionsPerDay[s.date] = (sessionsPerDay[s.date] ?? 0) + 1
    }
  }

  // Weight and sleep
  const weightData = dailyLogs
    .filter(d => d.body_weight)
    .map(d => ({ date: d.date, weight: d.body_weight }))

  const sleepData = sleepLogs.map(s => ({
    date: s.date,
    hours: s.duration_hours,
  }))

  const wellnessData = dailyLogs.map(d => ({
    date: d.date,
    stress: d.stress_level,
    fatigue: d.fatigue_level,
    pain: d.pain_level,
    sleep_quality: d.sleep_quality,
    mood: d.mood,
  }))

  // Summary metrics
  const totalSessions = sessions.length  // planned
  const totalAttendance = sessions.filter(wasAttended).length  // logged as attended
  const attendanceRate = totalSessions > 0 ? Math.round((totalAttendance / totalSessions) * 100) : 0

  const allRpe = sessions
    .map(s => getLog(s)?.rpe)
    .filter((r): r is number => !!r)
  const avgRpe = allRpe.length > 0 ? allRpe.reduce((a, b) => a + b, 0) / allRpe.length : null

  // Total hours: only attended sessions
  const totalHours = sessions
    .filter(wasAttended)
    .reduce((acc, s) => {
      const [sh, sm] = s.start_time.split(':').map(Number)
      const [eh, em] = s.end_time.split(':').map(Number)
      return acc + (eh * 60 + em - (sh * 60 + sm)) / 60
    }, 0)

  return NextResponse.json({
    summary: {
      totalSessions,
      totalAttendance,
      attendanceRate,
      avgRpe: avgRpe ? Math.round(avgRpe * 10) / 10 : null,
      totalHours: Math.round(totalHours * 10) / 10,
      range,
      fromDate,
      toDate,
    },
    attendanceByType,
    rpeByType: Object.fromEntries(
      Object.entries(rpeByType).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length])
    ),
    fatigueByType: Object.fromEntries(
      Object.entries(fatigueByType).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length])
    ),
    sessionsPerDay,
    weightData,
    sleepData,
    wellnessData,
  })
}
