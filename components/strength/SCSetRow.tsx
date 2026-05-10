'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SetRowValue {
  weight_used: number | null
  reps_completed: number | null
  completed: boolean
}

interface SCSetRowProps {
  setNumber: number
  targetWeight: number | null
  targetReps: string
  requiresWeight: boolean
  value: SetRowValue
  onChange: (v: SetRowValue) => void
}

export function SCSetRow({ setNumber, targetWeight, targetReps, requiresWeight, value, onChange }: SCSetRowProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
      value.completed ? 'bg-green-50' : 'bg-muted/30'
    )}>
      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 text-center">{setNumber}</span>

      {requiresWeight && (
        <div className="flex items-center gap-1 min-w-0">
          <input
            type="number"
            min={0}
            step={2.5}
            value={value.weight_used ?? ''}
            onChange={e => onChange({ ...value, weight_used: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder={targetWeight ? String(targetWeight) : '—'}
            className="w-16 h-7 rounded border border-border bg-background px-2 text-xs text-center outline-none focus:ring-1 focus:ring-ring tnum"
          />
          <span className="text-xs text-muted-foreground">kg</span>
        </div>
      )}

      <div className="flex items-center gap-1 min-w-0">
        <input
          type="number"
          min={0}
          value={value.reps_completed ?? ''}
          onChange={e => onChange({ ...value, reps_completed: e.target.value ? parseInt(e.target.value) : null })}
          placeholder={targetReps.split('-')[0] ?? '—'}
          className="w-12 h-7 rounded border border-border bg-background px-2 text-xs text-center outline-none focus:ring-1 focus:ring-ring tnum"
        />
        <span className="text-xs text-muted-foreground">reps</span>
      </div>

      <div className="ml-auto">
        <button
          type="button"
          onClick={() => onChange({ ...value, completed: !value.completed })}
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
            value.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-border text-transparent'
          )}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
