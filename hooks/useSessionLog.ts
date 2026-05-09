'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SessionLog } from '@/lib/schedule/types'
import type { SessionLogInput } from '@/lib/validations/session-log'

export function useUpsertSessionLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: SessionLogInput) => {
      const res = await fetch('/api/session-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error guardando registro de sesión')
      return res.json() as Promise<SessionLog>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })
}
