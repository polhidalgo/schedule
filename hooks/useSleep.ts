'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SleepLog } from '@/lib/schedule/types'

export function useActiveSleep() {
  return useQuery({
    queryKey: ['sleep', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/sleep?active=true')
      if (!res.ok) throw new Error('Error consultando sueño activo')
      return res.json() as Promise<SleepLog | null>
    },
    refetchInterval: 60_000, // refresh every minute
  })
}

export function useSleepLogs(days = 30) {
  return useQuery({
    queryKey: ['sleep', 'logs', days],
    queryFn: async () => {
      const res = await fetch(`/api/sleep?days=${days}`)
      if (!res.ok) throw new Error('Error cargando historial de sueño')
      return res.json() as Promise<SleepLog[]>
    },
  })
}

export function useStartSleep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      })
      if (!res.ok) throw new Error('Error iniciando registro de sueño')
      return res.json() as Promise<SleepLog>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sleep'] })
    },
  })
}

export function useEndSleep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', id }),
      })
      if (!res.ok) throw new Error('Error finalizando registro de sueño')
      return res.json() as Promise<SleepLog>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sleep'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
