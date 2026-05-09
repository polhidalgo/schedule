'use client'

import type { TimetableType } from '@/lib/schedule/types'
import { useSwitchTimetable } from '@/hooks/useSessions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface TimetableToggleProps {
  weekStart: string
  activeTimetable: TimetableType
}

export function TimetableToggle({ weekStart, activeTimetable }: TimetableToggleProps) {
  const switchMutation = useSwitchTimetable()

  async function handleSwitch(target: TimetableType) {
    if (target === activeTimetable || switchMutation.isPending) return
    try {
      await switchMutation.mutateAsync({ weekStart, timetable: target })
      toast.success(`Cambiado a Timetable ${target}`)
    } catch {
      toast.error('Error al cambiar timetable')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Timetable:</span>
      <div className="flex rounded-lg border border-border/50 overflow-hidden">
        {(['A', 'B'] as TimetableType[]).map(t => (
          <button
            key={t}
            onClick={() => handleSwitch(t)}
            disabled={switchMutation.isPending}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTimetable === t
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {switchMutation.isPending && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
    </div>
  )
}
