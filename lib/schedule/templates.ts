import type { SessionType, ActivityCategory, TimetableType } from './types'

export interface TemplateSessionSeed {
  timetable: TimetableType
  day_of_week: number // 0=Monday
  start_time: string  // HH:mm:ss
  end_time: string
  session_type: SessionType
  title: string
  category: ActivityCategory
}

// Timetable A: Full training week
const TIMETABLE_A: TemplateSessionSeed[] = [
  // Monday
  { timetable: 'A', day_of_week: 0, start_time: '18:00:00', end_time: '19:30:00', session_type: 'bjj_fundamentals', title: 'BJJ Fundamentals', category: 'training' },
  { timetable: 'A', day_of_week: 0, start_time: '20:00:00', end_time: '21:00:00', session_type: 'strength_training', title: 'Strength Training', category: 'training' },
  // Tuesday
  { timetable: 'A', day_of_week: 1, start_time: '19:00:00', end_time: '20:30:00', session_type: 'grappling_intermediate', title: 'Grappling Intermediate', category: 'training' },
  // Wednesday
  { timetable: 'A', day_of_week: 2, start_time: '18:00:00', end_time: '19:30:00', session_type: 'bjj_advanced', title: 'BJJ Advanced', category: 'training' },
  { timetable: 'A', day_of_week: 2, start_time: '20:00:00', end_time: '21:00:00', session_type: 'conditioning_training', title: 'Conditioning', category: 'training' },
  // Thursday
  { timetable: 'A', day_of_week: 3, start_time: '19:00:00', end_time: '20:30:00', session_type: 'wrestling_gi_nogi', title: 'Wrestling Gi/NoGi', category: 'training' },
  // Friday
  { timetable: 'A', day_of_week: 4, start_time: '18:00:00', end_time: '19:30:00', session_type: 'bjj_intermediate', title: 'BJJ Intermediate', category: 'training' },
  { timetable: 'A', day_of_week: 4, start_time: '20:00:00', end_time: '21:30:00', session_type: 'open_mat', title: 'Open Mat', category: 'training' },
  // Saturday
  { timetable: 'A', day_of_week: 5, start_time: '10:00:00', end_time: '11:00:00', session_type: 'strength_training', title: 'Strength Training', category: 'training' },
  { timetable: 'A', day_of_week: 5, start_time: '11:30:00', end_time: '13:00:00', session_type: 'positional_training', title: 'Positional Training', category: 'training' },
  // Sunday
  { timetable: 'A', day_of_week: 6, start_time: '10:00:00', end_time: '11:30:00', session_type: 'judo', title: 'Judo', category: 'training' },
]

// Timetable B: Recovery / injury week with reduced load
const TIMETABLE_B: TemplateSessionSeed[] = [
  // Monday
  { timetable: 'B', day_of_week: 0, start_time: '18:00:00', end_time: '19:30:00', session_type: 'bjj_fundamentals', title: 'BJJ Fundamentals', category: 'training' },
  // Wednesday
  { timetable: 'B', day_of_week: 2, start_time: '19:00:00', end_time: '20:30:00', session_type: 'grappling_fundamentals', title: 'Grappling Fundamentals', category: 'training' },
  // Friday
  { timetable: 'B', day_of_week: 4, start_time: '18:00:00', end_time: '19:30:00', session_type: 'open_mat', title: 'Open Mat (Ligero)', category: 'training' },
  // Saturday
  { timetable: 'B', day_of_week: 5, start_time: '10:00:00', end_time: '11:00:00', session_type: 'strength_training', title: 'Strength (Recuperación)', category: 'training' },
]

export const DEFAULT_TEMPLATES: TemplateSessionSeed[] = [...TIMETABLE_A, ...TIMETABLE_B]
