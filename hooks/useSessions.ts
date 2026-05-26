'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@/lib/schedule/types'

async function fetchSessions(weekStart: string): Promise<Session[]> {
  const res = await fetch(`/api/sessions?week_start=${weekStart}`)
  if (!res.ok) throw new Error('Error cargando sesiones')
  return res.json()
}

export function useSessions(weekStart: string) {
  return useQuery({
    queryKey: ['sessions', weekStart],
    queryFn: () => fetchSessions(weekStart),
    staleTime: 30_000,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Session> & { week_start?: string }) => {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Error creando sesión')
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useUpdateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Session> & { id: string }) => {
      const res = await fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error actualizando sesión')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error eliminando sesión')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}

export function useSwitchTimetable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ weekStart, timetable }: { weekStart: string; timetable: 'A' | 'B' }) => {
      const res = await fetch('/api/sessions/switch-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, timetable }),
      })
      if (!res.ok) throw new Error('Error cambiando timetable')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['week-meta'] })
    },
  })
}
