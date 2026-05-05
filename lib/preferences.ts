import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserPreferences } from '@/lib/schedule/types';

const DEFAULT_HIDDEN = ['work', 'commute'];

export async function getPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPreferences> {
  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data ?? { hidden_types: DEFAULT_HIDDEN };
}

export async function upsertPreferences(
  supabase: SupabaseClient,
  userId: string,
  prefs: Partial<UserPreferences>,
): Promise<void> {
  await supabase.from('user_preferences').upsert(
    { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
}
