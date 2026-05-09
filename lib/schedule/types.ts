export type TimetableType = 'A' | 'B'
export type ActivityCategory = 'training' | 'event'
export type IntensityLevel = 'low' | 'medium' | 'high'
export type MoodLevel = 'very_low' | 'low' | 'neutral' | 'good' | 'very_good'

export type SessionType =
  | 'bjj_fundamentals'
  | 'bjj_intermediate'
  | 'bjj_advanced'
  | 'grappling_fundamentals'
  | 'grappling_intermediate'
  | 'grappling_advanced'
  | 'grappling_competition'
  | 'open_mat'
  | 'judo'
  | 'wrestling_gi_nogi'
  | 'positional_training'
  | 'strength_training'
  | 'conditioning_training'
  | 'trayecto'
  | 'trabajo'
  | 'medico'
  | 'fisio'

export interface TemplateSession {
  id: string
  user_id: string
  timetable: TimetableType
  day_of_week: number // 0=Monday, 6=Sunday
  start_time: string  // HH:mm
  end_time: string    // HH:mm
  session_type: SessionType
  title: string
  category: ActivityCategory
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Week {
  id: string
  user_id: string
  week_start: string // YYYY-MM-DD (always Monday)
  active_timetable: TimetableType
  timetable_switched_at: string | null
  previous_timetable: TimetableType | null
  created_at: string
}

export interface Session {
  id: string
  week_id: string
  user_id: string
  date: string // YYYY-MM-DD
  start_time: string // HH:mm
  end_time: string   // HH:mm
  session_type: SessionType
  title: string
  category: ActivityCategory
  is_deleted: boolean
  is_custom: boolean
  template_session_id: string | null
  created_at: string
  updated_at: string
  // joined
  session_log?: SessionLog | null
}

export interface SessionLog {
  id: string
  session_id: string
  user_id: string
  attended: boolean
  rpe: number | null           // 1-10
  fatigue: number | null       // 1-10
  technical_quality: number | null // 1-10
  intensity: IntensityLevel | null
  injuries_notes: string | null
  sparring_rounds: number | null
  techniques_practiced: string | null
  general_notes: string | null
  logged_at: string
}

export interface DailyLog {
  id: string
  user_id: string
  date: string // YYYY-MM-DD
  stress_level: number | null    // 1-10
  fatigue_level: number | null   // 1-10
  mood: MoodLevel | null
  sleep_quality: number | null   // 1-10
  pain_level: number | null      // 1-10
  body_weight: number | null     // kg
  hydration_liters: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SleepLog {
  id: string
  user_id: string
  sleep_start: string // ISO timestamp
  sleep_end: string | null
  duration_hours: number | null
  date: string | null // YYYY-MM-DD
  notes: string | null
  created_at: string
}

export interface WeeklyReview {
  id: string
  user_id: string
  week_start: string
  overall_score: number | null
  training_load_analysis: string | null
  recommendations: string | null
  alerts: string | null
  recovery_suggestions: string | null
  patterns_detected: string | null
  full_response: Record<string, unknown> | null
  generated_at: string
}

// UI helpers
export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  bjj_fundamentals: 'BJJ Fundamentals',
  bjj_intermediate: 'BJJ Intermediate',
  bjj_advanced: 'BJJ Advanced',
  grappling_fundamentals: 'Grappling Fundamentals',
  grappling_intermediate: 'Grappling Intermediate',
  grappling_advanced: 'Grappling Advanced',
  grappling_competition: 'Grappling Competition',
  open_mat: 'Open Mat',
  judo: 'Judo',
  wrestling_gi_nogi: 'Wrestling Gi/NoGi',
  positional_training: 'Positional Training',
  strength_training: 'Strength Training',
  conditioning_training: 'Conditioning Training',
  trayecto: 'Trayecto',
  trabajo: 'Trabajo',
  medico: 'Médico',
  fisio: 'Fisio',
}

export const TRAINING_SESSION_TYPES: SessionType[] = [
  'bjj_fundamentals',
  'bjj_intermediate',
  'bjj_advanced',
  'grappling_fundamentals',
  'grappling_intermediate',
  'grappling_advanced',
  'grappling_competition',
  'open_mat',
  'judo',
  'wrestling_gi_nogi',
  'positional_training',
  'strength_training',
  'conditioning_training',
]

export const EVENT_SESSION_TYPES: SessionType[] = [
  'trayecto',
  'trabajo',
  'medico',
  'fisio',
]

export const MOOD_LABELS: Record<MoodLevel, string> = {
  very_low: 'Muy Bajo',
  low: 'Bajo',
  neutral: 'Neutral',
  good: 'Bueno',
  very_good: 'Muy Bueno',
}

export const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

export const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
