import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TimetableType } from '@/lib/schedule/types'

// GET /api/templates?timetable=A|B
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const timetable = request.nextUrl.searchParams.get('timetable') as TimetableType | null

  let query = supabase
    .from('template_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (timetable) query = query.eq('timetable', timetable)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/templates — create a new template session
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { timetable, day_of_week, start_time, end_time, session_type, title, category } = body

  if (!timetable || day_of_week === undefined || !start_time || !end_time || !session_type || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('template_sessions')
    .insert({
      user_id: user.id,
      timetable,
      day_of_week,
      start_time: start_time.length === 5 ? start_time + ':00' : start_time,
      end_time: end_time.length === 5 ? end_time + ':00' : end_time,
      session_type,
      title,
      category: category ?? 'training',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
