'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSCExercises } from '@/hooks/useSC'
import type { SCExercise } from '@/lib/sc/types'

interface SCExercisePickerProps {
  value: string | null
  onChange: (exercise: SCExercise | null) => void
  placeholder?: string
  className?: string
}

export function SCExercisePicker({ value, onChange, placeholder = 'Buscar ejercicio…', className }: SCExercisePickerProps) {
  const { data: exercises = [] } = useSCExercises()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selectedExercise = exercises.find(e => e.id === value) ?? null

  const filtered = useMemo(() => {
    if (!query.trim()) return exercises
    const q = query.toLowerCase()
    return exercises.filter(e => e.name.toLowerCase().includes(q))
  }, [exercises, query])

  function handleSelect(ex: SCExercise) {
    onChange(ex)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onChange(null)
    setQuery('')
  }

  return (
    <div className={cn('relative', className)}>
      {selectedExercise ? (
        <div className="flex items-center gap-2 h-9 rounded-lg border border-border bg-background px-3 text-sm">
          <span className="flex-1 truncate">{selectedExercise.name}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={placeholder}
            className="w-full h-9 rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
          />
        </div>
      )}

      {open && !selectedExercise && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-background shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(ex => (
            <button
              key={ex.id}
              type="button"
              onMouseDown={() => handleSelect(ex)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent text-left"
            >
              <span>{ex.name}</span>
              {!ex.requires_weight && (
                <span className="text-xs text-muted-foreground ml-2 shrink-0">PC</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
