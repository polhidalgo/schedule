'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DailyLog } from '@/lib/schedule/types'
import type { DailyLogInput } from '@/lib/validations/daily-log'

export function useDailyLog(date: string) {
  return useQuery({
    queryKey: ['daily-log', date],
    queryFn: async () => {
      const res = await fetch(`/api/daily-logs?date=${date}`)
      if (!res.ok) throw new Error('Error cargando registro diario')
      return res.json() as Promise<DailyLog | null>
    },
  })
}

export function useUpsertDailyLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: DailyLogInput) => {
      const res = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error guardando registro diario')
      return res.json() as Promise<DailyLog>
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['daily-log', vars.date] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
