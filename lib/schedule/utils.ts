import { startOfWeek, format, addDays, parseISO, differenceInMinutes } from 'date-fns'
import type { SessionType } from './types'

export function getMondayOfWeek(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function formatTime(time: string): string {
  return time.slice(0, 5) // HH:mm
}

export function getSessionDurationMinutes(startTime: string, endTime: string): number {
  return differenceInMinutes(
    parseISO(`2000-01-01T${endTime}`),
    parseISO(`2000-01-01T${startTime}`)
  )
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

// Color coding by session type
export const SESSION_COLORS: Record<SessionType, { bg: string; text: string; border: string }> = {
  bjj_fundamentals:       { bg: 'bg-blue-500/20',   text: 'text-blue-300',   border: 'border-blue-500/40' },
  bjj_intermediate:       { bg: 'bg-blue-600/20',   text: 'text-blue-300',   border: 'border-blue-600/40' },
  bjj_advanced:           { bg: 'bg-blue-700/20',   text: 'text-blue-200',   border: 'border-blue-700/40' },
  grappling_fundamentals: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  grappling_intermediate: { bg: 'bg-purple-600/20', text: 'text-purple-300', border: 'border-purple-600/40' },
  grappling_advanced:     { bg: 'bg-purple-700/20', text: 'text-purple-200', border: 'border-purple-700/40' },
  grappling_competition:  { bg: 'bg-purple-800/20', text: 'text-purple-200', border: 'border-purple-800/40' },
  open_mat:               { bg: 'bg-cyan-500/20',   text: 'text-cyan-300',   border: 'border-cyan-500/40' },
  judo:                   { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/40' },
  wrestling_gi_nogi:      { bg: 'bg-violet-600/20', text: 'text-violet-300', border: 'border-violet-600/40' },
  positional_training:    { bg: 'bg-teal-500/20',   text: 'text-teal-300',   border: 'border-teal-500/40' },
  strength_training:      { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/40' },
  conditioning_training:  { bg: 'bg-red-500/20',    text: 'text-red-300',    border: 'border-red-500/40' },
  trayecto:               { bg: 'bg-zinc-600/20',   text: 'text-zinc-400',   border: 'border-zinc-600/40' },
  trabajo:                { bg: 'bg-zinc-700/20',   text: 'text-zinc-400',   border: 'border-zinc-700/40' },
  medico:                 { bg: 'bg-green-600/20',  text: 'text-green-400',  border: 'border-green-600/40' },
  fisio:                  { bg: 'bg-emerald-500/20',text: 'text-emerald-300',border: 'border-emerald-500/40' },
}

export function isToday(dateStr: string): boolean {
  return formatDateKey(new Date()) === dateStr
}

export function formatHoursDecimal(hours: number): string {
  return hours.toFixed(1) + 'h'
}
