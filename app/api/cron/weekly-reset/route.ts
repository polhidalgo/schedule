import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getMondayOfWeek, formatDateKey, getWeekDates } from '@/lib/schedule/utils'

export async function POST(request: NextRequest) {
  // Validate cron secret
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const weekStart = formatDateKey(getMondayOfWeek())

  // Get all users (using service role)
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })

  const results = []

  for (const user of users.users) {
    // Get last active timetable preference
    const { data: lastWeek } = await supabase
      .from('weeks')
      .select('active_timetable')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(1)
      .single()

    const timetable = lastWeek?.active_timetable ?? 'A'

    // Create week record if it doesn't exist
    const { data: newWeek, error: weekError } = await supabase
      .from('weeks')
      .upsert(
        { user_id: user.id, week_start: weekStart, active_timetable: timetable },
        { onConflict: 'user_id,week_start', ignoreDuplicates: true }
      )
      .select()
      .single()

    if (weekError || !newWeek) {
      results.push({ userId: user.id, status: 'skipped' })
      continue
    }

    // Copy template sessions
    const { data: templates } = await supabase
      .from('template_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('timetable', timetable)
      .eq('is_active', true)

    if (templates && templates.length > 0) {
      const weekDates = getWeekDates(new Date(weekStart))
      const sessionsToInsert = templates.map(t => ({
        week_id: newWeek.id,
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

    results.push({ userId: user.id, status: 'created', timetable })
  }

  return NextResponse.json({ success: true, weekStart, results })
}
