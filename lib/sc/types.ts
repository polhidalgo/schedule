// S&C Program Tracking — TypeScript types

export interface SCExercise {
  id: string
  name: string
  requires_weight: boolean
  unit: 'kg' | 'lb' | null
}

export interface SCProgram {
  id: string
  user_id: string
  name: string
  total_weeks: number
  days_per_week: number
  start_date: string | null
  is_active: boolean
  is_deleted: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SCWeek {
  id: string
  program_id: string
  week_number: number
  phase_name: string | null
  rpe_target: string | null
  notes: string | null
}

export interface SCProgramExercise {
  id: string
  week_id: string
  session_number: number
  exercise_id: string
  sets: number
  reps_target: string
  weight_target: number | null
  rpe_target: string | null
  sort_order: number
  notes: string | null
  exercise?: SCExercise
}

export interface SCSessionLog {
  id: string
  user_id: string
  program_id: string
  week_number: number
  session_number: number
  timetable_session_id: string | null
  attended: boolean
  notes: string | null
  completed_at: string
}

export interface SCSetLog {
  id: string
  session_log_id: string
  exercise_id: string
  set_number: number
  weight_used: number | null
  reps_completed: number | null
  completed: boolean
  notes: string | null
  exercise?: SCExercise
}

// Rich joined types
export interface SCWeekWithExercises extends SCWeek {
  exercises: SCProgramExercise[]
}

export interface SCProgramFull extends SCProgram {
  weeks: SCWeekWithExercises[]
}

export interface SCSessionLogFull extends SCSessionLog {
  set_logs: SCSetLog[]
}

// Active program context (program + computed current week)
export interface SCActiveProgram extends SCProgram {
  current_week_number: number
  weeks: SCWeekWithExercises[]
}

// Stats
export interface SCWeightPoint {
  date: string
  exercise_id: string
  exercise_name: string
  avg_weight: number
  max_weight: number
  week_number: number
}

export interface SCVolumePoint {
  week_number: number
  week_label: string
  total_volume: number  // sum of weight × reps × sets
  by_exercise: Record<string, number>
}

export interface SCStatsData {
  programId: string
  programName: string
  totalWeeks: number
  sessionsCompleted: number
  sessionsTotal: number
  adherenceRate: number
  setsCompleted: number
  setsTotal: number
  setAdherenceRate: number
  weightProgression: SCWeightPoint[]
  weeklyVolume: SCVolumePoint[]
  exerciseAdherence: { exercise_id: string; name: string; rate: number }[]
}
