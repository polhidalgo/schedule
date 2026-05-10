'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { dailyLogSchema, type DailyLogInput } from '@/lib/validations/daily-log'
import { useDailyLog, useUpsertDailyLog } from '@/hooks/useDailyLog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, CheckCircle2, Clock, Save } from 'lucide-react'
import { toast } from 'sonner'
import { MOOD_LABELS } from '@/lib/schedule/types'
import type { MoodLevel } from '@/lib/schedule/types'
import { cn } from '@/lib/utils'

interface DailyLogFormProps {
  date: string // YYYY-MM-DD
}

function ScaleSlider({
  label,
  value,
  onChange,
  colorClass,
}: {
  label: string
  value: number | null
  onChange: (v: number) => void
  colorClass?: string
}) {
  const pct = value ? ((value - 1) / 9) * 100 : 50
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className={cn('text-sm font-bold tabular-nums', colorClass ?? 'text-foreground')}>
          {value ?? '—'}<span className="text-xs text-muted-foreground font-normal">/10</span>
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value ?? 5}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, hsl(var(--primary)) ${pct}%, hsl(var(--secondary)) ${pct}%)`,
        }}
      />
    </div>
  )
}

export function DailyLogForm({ date }: DailyLogFormProps) {
  const { data: existing, isLoading } = useDailyLog(date)
  const upsert = useUpsertDailyLog()

  const { register, control, handleSubmit, reset, formState: { isDirty } } = useForm<DailyLogInput>({
    resolver: zodResolver(dailyLogSchema),
    values: existing
      ? {
          date,
          stress_level: existing.stress_level,
          fatigue_level: existing.fatigue_level,
          mood: existing.mood,
          sleep_quality: existing.sleep_quality,
          pain_level: existing.pain_level,
          body_weight: existing.body_weight,
          hydration_liters: existing.hydration_liters,
          notes: existing.notes ?? '',
        }
      : { date },
  })

  async function onSubmit(data: DailyLogInput, isDraft: boolean) {
    try {
      await upsert.mutateAsync({ ...data, is_draft: isDraft })
      toast.success(isDraft ? 'Borrador guardado' : 'Registro guardado')
      if (!isDraft) reset({ ...data })
    } catch {
      toast.error('Error al guardar el registro')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const moodOptions: MoodLevel[] = ['very_low', 'low', 'neutral', 'good', 'very_good']

  return (
    <form onSubmit={e => e.preventDefault()} className="space-y-5">
      {existing && !isDirty && (
        existing.is_draft ? (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Borrador guardado · completa el registro cuando puedas
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Registro guardado para hoy
          </div>
        )
      )}

      <div className="space-y-4 p-4 rounded-xl bg-card border border-border/50">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bienestar</p>

        <Controller
          name="stress_level"
          control={control}
          render={({ field }) => (
            <ScaleSlider
              label="Nivel de Estrés"
              value={field.value ?? null}
              onChange={field.onChange}
              colorClass={(field.value ?? 0) >= 7 ? 'text-red-400' : (field.value ?? 0) >= 5 ? 'text-yellow-400' : 'text-green-400'}
            />
          )}
        />

        <Controller
          name="fatigue_level"
          control={control}
          render={({ field }) => (
            <ScaleSlider
              label="Cansancio General"
              value={field.value ?? null}
              onChange={field.onChange}
              colorClass={(field.value ?? 0) >= 7 ? 'text-red-400' : (field.value ?? 0) >= 5 ? 'text-yellow-400' : 'text-green-400'}
            />
          )}
        />

        <Controller
          name="pain_level"
          control={control}
          render={({ field }) => (
            <ScaleSlider
              label="Nivel de Dolor/Molestias"
              value={field.value ?? null}
              onChange={field.onChange}
              colorClass={(field.value ?? 0) >= 6 ? 'text-red-400' : (field.value ?? 0) >= 4 ? 'text-yellow-400' : 'text-green-400'}
            />
          )}
        />

        <Controller
          name="sleep_quality"
          control={control}
          render={({ field }) => (
            <ScaleSlider
              label="Calidad del Sueño Percibida"
              value={field.value ?? null}
              onChange={field.onChange}
              colorClass={(field.value ?? 0) >= 7 ? 'text-green-400' : (field.value ?? 0) >= 5 ? 'text-yellow-400' : 'text-red-400'}
            />
          )}
        />

        <div>
          <Label className="text-xs text-muted-foreground">Estado de Ánimo</Label>
          <Controller
            name="mood"
            control={control}
            render={({ field }) => (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {moodOptions.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => field.onChange(m)}
                    className={cn(
                      'flex-1 min-w-0 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all',
                      field.value === m
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border/50 text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {MOOD_LABELS[m]}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-xl bg-card border border-border/50">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Métricas Físicas</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Peso Corporal (kg)</Label>
            <Input
              type="number"
              step="0.1"
              min={20}
              max={300}
              {...register('body_weight', { valueAsNumber: true })}
              placeholder="75.0"
              className="mt-1 bg-secondary/50 border-border/50"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Hidratación (litros)</Label>
            <Input
              type="number"
              step="0.1"
              min={0}
              max={20}
              {...register('hydration_liters', { valueAsNumber: true })}
              placeholder="2.5"
              className="mt-1 bg-secondary/50 border-border/50"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Notas del Día</Label>
        <Textarea
          {...register('notes')}
          placeholder="¿Cómo fue el día? Anota lo que quieras recordar..."
          rows={3}
          className="mt-1 bg-secondary/50 border-border/50 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-1.5"
          disabled={upsert.isPending}
          onClick={handleSubmit(d => onSubmit(d, true))}
        >
          {upsert.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar borrador
        </Button>
        <Button
          type="button"
          className="flex-1 gap-1.5"
          disabled={upsert.isPending}
          onClick={handleSubmit(d => onSubmit(d, false))}
        >
          {upsert.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {existing && !existing.is_draft ? 'Actualizar Registro' : 'Guardar Registro'}
        </Button>
      </div>
    </form>
  )
}
