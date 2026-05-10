'use client'

import type { TimetableType } from '@/lib/schedule/types'
import { useSwitchTimetable } from '@/hooks/useSessions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      <div className="flex rounded-[10px] border border-border overflow-hidden bg-muted p-0.5 gap-0.5">
        {(['A', 'B'] as TimetableType[]).map(t => (
          <button
            key={t}
            onClick={() => handleSwitch(t)}
            disabled={switchMutation.isPending}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-[8px] transition-all',
              activeTimetable === t
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {switchMutation.isPending && (
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
