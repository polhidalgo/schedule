import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseISO } from 'date-fns'
import { getWeekDates, formatDateKey } from '@/lib/schedule/utils'
import type { TimetableType } from '@/lib/schedule/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { weekStart, timetable }: { weekStart: string; timetable: TimetableType } = await request.json()

  if (!weekStart || !timetable) {
    return NextResponse.json({ error: 'Missing weekStart or timetable' }, { status: 400 })
  }

  // Get current week
  const { data: week, error: weekError } = await supabase
    .from('weeks')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single()

  if (weekError || !week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })
  if (week.active_timetable === timetable) return NextResponse.json({ message: 'Already active' })

  // Soft-delete all non-custom sessions for this week
  await supabase
    .from('sessions')
    .update({ is_deleted: true })
    .eq('week_id', week.id)
    .eq('is_custom', false)

  // Load new template sessions
  const { data: templates } = await supabase
    .from('template_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('timetable', timetable)
    .eq('is_active', true)

  if (templates && templates.length > 0) {
    const weekDates = getWeekDates(parseISO(weekStart))
    const today = formatDateKey(new Date())

    // Only re-create sessions for today and future days
    const sessionsToInsert = templates
      .filter(t => formatDateKey(weekDates[t.day_of_week]) >= today)
      .map(t => ({
        week_id: week.id,
        user_id: user.id,
        date: formatDateKey(weekDates[t.day_of_week]),
        start_time: t.start_time,
        end_time: t.end_time,
        session_type: t.session_type,
        title: t.title,
        category: t.category,
        template_session_id: t.id,
      }))

    if (sessionsToInsert.length > 0) {
      await supabase.from('sessions').insert(sessionsToInsert)
    }
  }

  // Update week record
  const { error: updateError } = await supabase
    .from('weeks')
    .update({
      active_timetable: timetable,
      timetable_switched_at: new Date().toISOString(),
      previous_timetable: week.active_timetable,
    })
    .eq('id', week.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, timetable })
}
