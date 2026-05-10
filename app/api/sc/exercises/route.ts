import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/sc/exercises — full exercise catalogue
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('sc_exercises_catalog')
    .select('*')
    .order('requires_weight', { ascending: false })
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
