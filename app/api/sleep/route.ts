import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

// GET /api/sleep?active=true  OR  /api/sleep?days=30
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const active = request.nextUrl.searchParams.get('active')

  if (active === 'true') {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', user.id)
      .is('sleep_end', null)
      .order('sleep_start', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data ?? null)
  }

  const days = parseInt(request.nextUrl.searchParams.get('days') ?? '30')
  const from = new Date()
  from.setDate(from.getDate() - days)

  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('sleep_start', from.toISOString())
    .not('sleep_end', 'is', null)
    .order('sleep_start', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/sleep - start or end sleep
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, id } = await request.json()

  if (action === 'start') {
    // Close any open sleep sessions first
    await supabase
      .from('sleep_logs')
      .update({ sleep_end: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('sleep_end', null)

    const { data, error } = await supabase
      .from('sleep_logs')
      .insert({ user_id: user.id, sleep_start: new Date().toISOString() })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  if (action === 'end' && id) {
    const now = new Date()
    const { data: existing } = await supabase
      .from('sleep_logs')
      .select('sleep_start')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const durationMs = now.getTime() - new Date(existing.sleep_start).getTime()
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10

    const { data, error } = await supabase
      .from('sleep_logs')
      .update({
        sleep_end: now.toISOString(),
        duration_hours: durationHours,
        date: format(now, 'yyyy-MM-dd'),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
