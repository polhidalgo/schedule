'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SCProgram, SCProgramFull, SCActiveProgram, SCExercise, SCSessionLogFull, SCStatsData } from '@/lib/sc/types'
import type { SCProgramInput, SCSessionLogInput } from '@/lib/validations/sc'

// ─── Programs ──────────────────────────────────────────────────────────────

export function useSCPrograms() {
  return useQuery<SCProgram[]>({
    queryKey: ['sc-programs'],
    queryFn: async () => {
      const res = await fetch('/api/sc/programs')
      if (!res.ok) throw new Error('Error cargando programas')
      return res.json()
    },
    staleTime: 2 * 60_000,
  })
}

export function useSCProgram(id: string | null) {
  return useQuery<SCProgramFull>({
    queryKey: ['sc-program', id],
    queryFn: async () => {
      const res = await fetch(`/api/sc/programs/${id}`)
      if (!res.ok) throw new Error('Error cargando programa')
      return res.json()
    },
    enabled: !!id,
    staleTime: 2 * 60_000,
  })
}

export function useActiveSCProgram() {
  return useQuery<SCActiveProgram | null>({
    queryKey: ['sc-active'],
    queryFn: async () => {
      const res = await fetch('/api/sc/active')
      if (!res.ok) throw new Error('Error cargando programa activo')
      return res.json()
    },
    staleTime: 5 * 60_000,
  })
}

export function useSCExercises() {
  return useQuery<SCExercise[]>({
    queryKey: ['sc-exercises'],
    queryFn: async () => {
      const res = await fetch('/api/sc/exercises')
      if (!res.ok) throw new Error('Error cargando ejercicios')
      return res.json()
    },
    staleTime: 60 * 60_000, // catalogue rarely changes
  })
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export function useCreateSCProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: SCProgramInput) => {
      const res = await fetch('/api/sc/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al crear programa')
      }
      return res.json() as Promise<SCProgram>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sc-programs'] })
    },
  })
}

export function useUpdateSCProgram(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<SCProgramInput> & { weeks?: SCProgramInput['weeks'] }) => {
      const res = await fetch(`/api/sc/programs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al actualizar programa')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sc-programs'] })
      qc.invalidateQueries({ queryKey: ['sc-program', id] })
      qc.invalidateQueries({ queryKey: ['sc-active'] })
    },
  })
}

export function useDeleteSCProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sc/programs/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar programa')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sc-programs'] })
      qc.invalidateQueries({ queryKey: ['sc-active'] })
    },
  })
}

export function useActivateSCProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sc/programs/${id}/activate`, { method: 'POST' })
      if (!res.ok) throw new Error('Error al activar programa')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sc-programs'] })
      qc.invalidateQueries({ queryKey: ['sc-active'] })
    },
  })
}

export function useDuplicateSCProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sc/programs/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error('Error al duplicar programa')
      return res.json() as Promise<SCProgram>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sc-programs'] })
    },
  })
}

// ─── Session logs ──────────────────────────────────────────────────────────

export function useSCSessionLogs(programId?: string, weekNumber?: number) {
  const params = new URLSearchParams()
  if (programId) params.set('program_id', programId)
  if (weekNumber !== undefined) params.set('week_number', String(weekNumber))

  return useQuery<SCSessionLogFull[]>({
    queryKey: ['sc-session-logs', programId, weekNumber],
    queryFn: async () => {
      const res = await fetch(`/api/sc/session-logs?${params}`)
      if (!res.ok) throw new Error('Error cargando registros')
      return res.json()
    },
    enabled: !!programId,
    staleTime: 2 * 60_000,
  })
}

export function useUpsertSCSessionLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: SCSessionLogInput) => {
      const res = await fetch('/api/sc/session-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al guardar sesión')
      }
      return res.json()
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sc-session-logs', vars.program_id] })
      qc.invalidateQueries({ queryKey: ['sc-active'] })
      qc.invalidateQueries({ queryKey: ['sc-stats'] })
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

// ─── Stats ─────────────────────────────────────────────────────────────────

export function useSCStats(programId: string | null) {
  return useQuery<SCStatsData>({
    queryKey: ['sc-stats', programId],
    queryFn: async () => {
      const res = await fetch(`/api/sc/stats?program_id=${programId}`)
      if (!res.ok) throw new Error('Error cargando estadísticas S&C')
      return res.json()
    },
    enabled: !!programId,
    staleTime: 5 * 60_000,
  })
}
