export type SessionType =
  | 'nogi'
  | 'gi'
  | 'wrestling'
  | 'judo'
  | 'strength'
  | 'conditioning'
  | 'work'
  | 'commute'
  | 'meal'
  | 'rest'
  | 'recovery';

export type PlanId = 'A' | 'B';
export type GiNogiVariant = 'gi' | 'nogi';
export type SessionStatus = 'done' | 'skipped' | 'modified';
export type EventType = 'appointment' | 'holiday' | 'travel' | 'other';

export interface SessionTypeInfo {
  label: string;
  color: string;
}

export interface ScheduleSession {
  id: string;
  plan: PlanId;
  day_name: string;
  start: string;
  end: string;
  title: string;
  type: SessionType;
  location?: string;
  note?: string;
  is_optional?: boolean;
  sort_order?: number;
  /** If set, session only shows on that Gi/NoGi variant week. Null/undefined = always show. */
  week_variant?: GiNogiVariant | null;
}

export interface WeekConfig {
  id?: string;
  user_id?: string;
  week_start: string; // ISO date of Monday
  plan: PlanId;
  gi_nogi_variant: GiNogiVariant;
}

export interface TrainingLog {
  id?: string;
  user_id?: string;
  date: string;
  session_id: string;
  status?: SessionStatus | null;
  rpe?: number | null;
  note?: string | null;
}

export interface DailyFeedback {
  id?: string;
  user_id?: string;
  date: string;
  energy: number;
  pain: number;
  sleep_hours: number;
  fatigue?: number | null;
  notes?: string | null;
  plan?: PlanId | null;
}

export interface ScheduleEvent {
  id?: string;
  user_id?: string;
  date: string;
  title: string;
  type: EventType;
  start_time?: string | null;
  end_time?: string | null;
  note?: string | null;
  ai_suggestion?: string | null;
}

export interface WeeklyReview {
  id?: string;
  user_id?: string;
  week_start: string;
  summary: string;
  load_recommendation?: string | null;
  lifestyle_recommendation?: string | null;
  overtraining_alert?: boolean;
  raw_data?: Record<string, unknown> | null;
  created_at?: string;
}
