import type { SupabaseClient } from '@supabase/supabase-js'

/** Keeps timetable `session_logs` in sync so week view & /api/stats count strength attendance. */
export async function syncScSessionLogToCalendar(
  supabase: SupabaseClient,
  userId: string,
  args: {
    timetable_session_id: string | null
    attended: boolean
    notes: string | null
  }
): Promise<{ error: Error | null }> {
  if (!args.timetable_session_id) return { error: null }

  const sessionId = args.timetable_session_id
  const general_notes = args.notes?.trim() ? args.notes.trim() : null

  const { data: existing, error: selErr } = await supabase
    .from('session_logs')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (selErr) return { error: new Error(selErr.message) }

  if (existing?.id) {
    const { error } = await supabase
      .from('session_logs')
      .update({ attended: args.attended, general_notes })
      .eq('id', existing.id)
      .eq('user_id', userId)
    return { error: error ? new Error(error.message) : null }
  }

  const { error } = await supabase.from('session_logs').insert({
    session_id: sessionId,
    user_id: userId,
    attended: args.attended,
    general_notes,
  })

  return { error: error ? new Error(error.message) : null }
}
