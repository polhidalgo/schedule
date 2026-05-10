import type { Session, SessionLog, DailyLog, SleepLog, TimetableType } from '../schedule/types'
import { SESSION_TYPE_LABELS, DAY_NAMES_FULL } from '../schedule/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export interface SCSessionLogData {
  week_number: number
  session_number: number
  attended: boolean
  notes: string | null
  set_logs: Array<{
    exercise_name: string
    set_number: number
    weight_used: number | null
    reps_completed: number | null
    completed: boolean
  }>
}

export interface WeekData {
  weekStart: string
  weekEnd: string
  activeTimetable: TimetableType
  switchedMidWeek: boolean
  previousTimetable?: TimetableType
  sessions: (Session & { session_log?: SessionLog | null })[]
  dailyLogs: DailyLog[]
  sleepLogs: SleepLog[]
  previousWeek?: {
    avgRpe: number | null
    attendanceRate: number | null
    totalSessions: number
  }
  scData?: {
    programName: string
    weekNumber: number
    totalWeeks: number
    sessionsLogged: SCSessionLogData[]
  }
}

export function buildWeeklyReviewPrompt(data: WeekData): { system: string; user: string } {
  const system = `Eres un analista de rendimiento deportivo especializado en BJJ y grappling. 
Tu tarea es analizar los datos de entrenamiento semanal y proporcionar un análisis detallado y útil.
Responde SIEMPRE en español. Sé específico y práctico en tus recomendaciones.
Tu respuesta debe ser un objeto JSON válido con exactamente estas claves:
- overall_score (número 0-100)
- training_load_analysis (string, análisis de la carga)
- recommendations (string, recomendaciones para la próxima semana)
- alerts (string, alertas sobre problemas detectados, o "Sin alertas" si no hay)
- recovery_suggestions (string, sugerencias de recuperación)
- patterns_detected (string, patrones detectados en los datos)`

  const trainingSessions = data.sessions.filter(s => !s.is_deleted && s.category === 'training')
  const attendedSessions = trainingSessions.filter(s => s.session_log?.attended !== false)
  const attendanceRate = trainingSessions.length > 0
    ? Math.round((attendedSessions.length / trainingSessions.length) * 100)
    : 0

  const sessionsText = trainingSessions.map(s => {
    const log = s.session_log
    const dayName = DAY_NAMES_FULL[parseISO(s.date).getDay() === 0 ? 6 : parseISO(s.date).getDay() - 1]
    if (!log) {
      return `- ${dayName} ${s.start_time.slice(0, 5)}: ${SESSION_TYPE_LABELS[s.session_type]} — Sin registro`
    }
    const parts = [`Asistió: ${log.attended ? 'Sí' : 'No'}`]
    if (log.rpe) parts.push(`RPE: ${log.rpe}/10`)
    if (log.fatigue) parts.push(`Cansancio: ${log.fatigue}/10`)
    if (log.technical_quality) parts.push(`Técnica: ${log.technical_quality}/10`)
    if (log.intensity) parts.push(`Intensidad: ${log.intensity}`)
    if (log.sparring_rounds) parts.push(`Rounds: ${log.sparring_rounds}`)
    if (log.injuries_notes) parts.push(`Lesiones/Molestias: ${log.injuries_notes}`)
    if (log.general_notes) parts.push(`Notas: ${log.general_notes}`)
    return `- ${dayName} ${s.start_time.slice(0, 5)}: ${SESSION_TYPE_LABELS[s.session_type]}\n  ${parts.join(' | ')}`
  }).join('\n')

  const dailyText = data.dailyLogs.map(d => {
    const dayName = format(parseISO(d.date), 'EEEE', { locale: es })
    const parts: string[] = []
    if (d.stress_level) parts.push(`Estrés: ${d.stress_level}/10`)
    if (d.fatigue_level) parts.push(`Cansancio: ${d.fatigue_level}/10`)
    if (d.mood) parts.push(`Ánimo: ${d.mood}`)
    if (d.sleep_quality) parts.push(`Sueño: ${d.sleep_quality}/10`)
    if (d.pain_level) parts.push(`Dolor: ${d.pain_level}/10`)
    if (d.body_weight) parts.push(`Peso: ${d.body_weight}kg`)
    if (d.hydration_liters) parts.push(`Hidratación: ${d.hydration_liters}L`)
    return `- ${dayName}: ${parts.join(' | ') || 'Sin datos'}`
  }).join('\n')

  const sleepText = data.sleepLogs
    .filter(s => s.duration_hours)
    .map(s => `- ${s.date}: ${s.duration_hours?.toFixed(1)}h de sueño`)
    .join('\n')

  const avgRpe = trainingSessions.length > 0
    ? trainingSessions
        .filter(s => s.session_log?.rpe)
        .reduce((acc, s) => acc + (s.session_log?.rpe ?? 0), 0) /
      (trainingSessions.filter(s => s.session_log?.rpe).length || 1)
    : null

  const user = `SEMANA: ${data.weekStart} al ${data.weekEnd}
TIMETABLE: ${data.switchedMidWeek
    ? `Cambio a mitad de semana (de ${data.previousTimetable} a ${data.activeTimetable})`
    : `Timetable ${data.activeTimetable}`}
SESIONES PLANIFICADAS: ${trainingSessions.length}
ASISTENCIA: ${attendedSessions.length}/${trainingSessions.length} (${attendanceRate}%)
${avgRpe ? `RPE PROMEDIO: ${avgRpe.toFixed(1)}/10` : ''}

SESIONES DE ENTRENAMIENTO:
${sessionsText || 'Sin sesiones registradas'}

REGISTROS DIARIOS:
${dailyText || 'Sin registros diarios'}

SUEÑO:
${sleepText || 'Sin datos de sueño'}

${data.previousWeek ? `SEMANA ANTERIOR:
- Sesiones totales: ${data.previousWeek.totalSessions}
- RPE promedio: ${data.previousWeek.avgRpe?.toFixed(1) ?? 'N/A'}
- Asistencia: ${data.previousWeek.attendanceRate?.toFixed(0) ?? 'N/A'}%` : 'Primera semana registrada'}

${data.scData ? buildSCBlock(data.scData) : ''}
Proporciona tu análisis en formato JSON.`

  return { system, user }
}

function buildSCBlock(sc: NonNullable<WeekData['scData']>): string {
  const sessionLines = sc.sessionsLogged.map(log => {
    if (!log.attended) return `- Sesión ${log.session_number}: No asistió`
    const setLines = log.set_logs
      .filter(s => s.completed)
      .map(s => `  · ${s.exercise_name}: ${s.weight_used ? `${s.weight_used}kg×` : ''}${s.reps_completed ?? '?'} reps`)
      .join('\n')
    return `- Sesión ${log.session_number}: Completada${setLines ? '\n' + setLines : ''}`
  })

  return `FUERZA S&C (${sc.programName} — Semana ${sc.weekNumber}/${sc.totalWeeks}):
${sessionLines.join('\n') || 'Sin sesiones S&C registradas esta semana'}
`
}
