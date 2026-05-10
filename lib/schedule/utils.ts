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

// Color coding by session type — light palette (soft-bg / strong-fg)
// dot:    accent color for left border and type pill foreground
// softBg: pastel background for type pill and desktop card
// fg:     foreground text color (same hue as dot, readable on white/softBg)
export const SESSION_COLORS: Record<SessionType, { dot: string; softBg: string; fg: string }> = {
  bjj_fundamentals:       { dot: '#2563eb', softBg: '#eff4ff', fg: '#2563eb' },
  bjj_intermediate:       { dot: '#2563eb', softBg: '#eff4ff', fg: '#2563eb' },
  bjj_advanced:           { dot: '#2563eb', softBg: '#eff4ff', fg: '#2563eb' },
  grappling_fundamentals: { dot: '#7c3aed', softBg: '#f5f0ff', fg: '#7c3aed' },
  grappling_intermediate: { dot: '#7c3aed', softBg: '#f5f0ff', fg: '#7c3aed' },
  grappling_advanced:     { dot: '#7c3aed', softBg: '#f5f0ff', fg: '#7c3aed' },
  grappling_competition:  { dot: '#7c3aed', softBg: '#f5f0ff', fg: '#7c3aed' },
  open_mat:               { dot: '#0891b2', softBg: '#ecfeff', fg: '#0891b2' },
  judo:                   { dot: '#4f46e5', softBg: '#eef0ff', fg: '#4f46e5' },
  wrestling_gi_nogi:      { dot: '#6d28d9', softBg: '#f3edff', fg: '#6d28d9' },
  positional_training:    { dot: '#0d9488', softBg: '#ecfdf7', fg: '#0d9488' },
  strength_training:      { dot: '#ea580c', softBg: '#fef2eb', fg: '#ea580c' },
  conditioning_training:  { dot: '#dc2626', softBg: '#fef2f2', fg: '#dc2626' },
  trayecto:               { dot: '#71717a', softBg: '#f4f4f5', fg: '#71717a' },
  trabajo:                { dot: '#71717a', softBg: '#f4f4f5', fg: '#71717a' },
  medico:                 { dot: '#16a34a', softBg: '#ecfdf5', fg: '#16a34a' },
  fisio:                  { dot: '#16a34a', softBg: '#ecfdf5', fg: '#16a34a' },
}

export function isToday(dateStr: string): boolean {
  return formatDateKey(new Date()) === dateStr
}

export function formatHoursDecimal(hours: number): string {
  return hours.toFixed(1) + 'h'
}
