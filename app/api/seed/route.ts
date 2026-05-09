import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_TEMPLATES } from '@/lib/schedule/templates'

// POST /api/seed - seed default templates for the current user
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user already has templates
  const { count } = await supabase
    .from('template_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ message: 'Templates already seeded', count })
  }

  const toInsert = DEFAULT_TEMPLATES.map(t => ({ ...t, user_id: user.id }))

  const { data, error } = await supabase
    .from('template_sessions')
    .insert(toInsert)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, inserted: data?.length ?? 0 })
}
