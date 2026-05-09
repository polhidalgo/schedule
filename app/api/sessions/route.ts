import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMondayOfWeek, formatDateKey, getWeekDates } from '@/lib/schedule/utils'
import { parseISO, addDays } from 'date-fns'

// GET /api/sessions?week_start=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStartParam = request.nextUrl.searchParams.get('week_start')
  const weekStart = weekStartParam
    ? formatDateKey(getMondayOfWeek(parseISO(weekStartParam)))
    : formatDateKey(getMondayOfWeek())

  const weekEnd = formatDateKey(addDays(parseISO(weekStart), 6))

  // Get or create the week record
  let { data: week } = await supabase
    .from('weeks')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single()

  if (!week) {
    // Auto-seed default templates if user has none
    const { count: templateCount } = await supabase
      .from('template_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((templateCount ?? 0) === 0) {
      const { DEFAULT_TEMPLATES } = await import('@/lib/schedule/templates')
      const toInsert = DEFAULT_TEMPLATES.map(t => ({ ...t, user_id: user.id }))
      await supabase.from('template_sessions').insert(toInsert)
    }

    // Create week from the last known timetable preference (default A)
    const { data: lastWeek } = await supabase
      .from('weeks')
      .select('active_timetable')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(1)
      .single()

    const timetable = lastWeek?.active_timetable ?? 'A'

    const { data: newWeek, error: weekError } = await supabase
      .from('weeks')
      .insert({ user_id: user.id, week_start: weekStart, active_timetable: timetable })
      .select()
      .single()

    if (weekError) return NextResponse.json({ error: weekError.message }, { status: 500 })
    week = newWeek

    // Copy template sessions to this week
    const { data: templates } = await supabase
      .from('template_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('timetable', timetable)
      .eq('is_active', true)

    if (templates && templates.length > 0) {
      const weekDates = getWeekDates(parseISO(weekStart))
      const sessionsToInsert = templates.map((t) => ({
        week_id: week!.id,
        user_id: user.id,
        date: formatDateKey(weekDates[t.day_of_week]),
        start_time: t.start_time,
        end_time: t.end_time,
        session_type: t.session_type,
        title: t.title,
        category: t.category,
        template_session_id: t.id,
      }))

      await supabase.from('sessions').insert(sessionsToInsert)
    }
  }

  // Fetch sessions with logs
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*, session_log:session_logs(*)')
    .eq('user_id', user.id)
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .eq('is_deleted', false)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normalize session_log from array to single object (Supabase returns joined as array)
  const normalized = (sessions ?? []).map(s => ({
    ...s,
    session_log: Array.isArray(s.session_log) ? (s.session_log[0] ?? null) : s.session_log,
  }))

  return NextResponse.json(normalized, {
    headers: {
      'X-Week-Id': week?.id ?? '',
      'X-Active-Timetable': week?.active_timetable ?? 'A',
    },
  })
}

// POST /api/sessions - create a custom session
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { date, start_time, end_time, session_type, title, category, week_start } = body

  if (!date || !start_time || !end_time || !session_type || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get the week
  const weekStartDate = week_start ?? formatDateKey(getMondayOfWeek(parseISO(date)))
  const { data: week } = await supabase
    .from('weeks')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start', weekStartDate)
    .single()

  if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      week_id: week.id,
      user_id: user.id,
      date,
      start_time,
      end_time,
      session_type,
      title,
      category: category ?? 'training',
      is_custom: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
