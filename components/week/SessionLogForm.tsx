'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sessionLogSchema, type SessionLogInput } from '@/lib/validations/session-log'
import { useUpsertSessionLog } from '@/hooks/useSessionLog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { SessionLog } from '@/lib/schedule/types'
import { cn } from '@/lib/utils'

interface SessionLogFormProps {
  sessionId: string
  existingLog?: SessionLog | null
  onSuccess: () => void
}

function ScaleSlider({ value, onChange, label }: { value: number | null; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-medium tabular-nums">{value ?? '—'}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value ?? 5}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full bg-secondary cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
        <span>1</span><span>5</span><span>10</span>
      </div>
    </div>
  )
}

export function SessionLogForm({ sessionId, existingLog, onSuccess }: SessionLogFormProps) {
  const upsert = useUpsertSessionLog()

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<SessionLogInput>({
    resolver: zodResolver(sessionLogSchema),
    defaultValues: {
      session_id: sessionId,
      attended: existingLog?.attended ?? true,
      rpe: existingLog?.rpe ?? null,
      fatigue: existingLog?.fatigue ?? null,
      technical_quality: existingLog?.technical_quality ?? null,
      intensity: existingLog?.intensity ?? null,
      injuries_notes: existingLog?.injuries_notes ?? '',
      sparring_rounds: existingLog?.sparring_rounds ?? 0,
      techniques_practiced: existingLog?.techniques_practiced ?? '',
      general_notes: existingLog?.general_notes ?? '',
    },
  })

  const attended = watch('attended')

  async function onSubmit(data: SessionLogInput) {
    try {
      await upsert.mutateAsync(data)
      toast.success('Sesión registrada')
      onSuccess()
    } catch {
      toast.error('Error al guardar el registro')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Attended toggle chips */}
      <Controller
        name="attended"
        control={control}
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => field.onChange(true)}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 px-3 rounded-[10px] border text-sm font-medium transition-all',
                field.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              Asistí
            </button>
            <button
              type="button"
              onClick={() => field.onChange(false)}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 px-3 rounded-[10px] border text-sm font-medium transition-all',
                !field.value
                  ? 'bg-warning text-white border-warning'
                  : 'border-border text-muted-foreground hover:border-warning/40 hover:text-foreground'
              )}
            >
              <XCircle className="w-4 h-4" />
              No asistí
            </button>
          </div>
        )}
      />

      {attended && (
        <>
          <div className="grid grid-cols-1 gap-4">
            <Controller
              name="rpe"
              control={control}
              render={({ field }) => (
                <ScaleSlider label="RPE (Esfuerzo Percibido)" value={field.value ?? null} onChange={field.onChange} />
              )}
            />
            <Controller
              name="fatigue"
              control={control}
              render={({ field }) => (
                <ScaleSlider label="Nivel de Cansancio" value={field.value ?? null} onChange={field.onChange} />
              )}
            />
            <Controller
              name="technical_quality"
              control={control}
              render={({ field }) => (
                <ScaleSlider label="Calidad Técnica Percibida" value={field.value ?? null} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Intensidad</Label>
              <Controller
                name="intensity"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={v => field.onChange(v || null)}>
                    <SelectTrigger className="mt-1 bg-secondary/50 border-border/50">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Rounds de Sparring</Label>
              <Input
                type="number"
                min={0}
                max={50}
                {...register('sparring_rounds', { valueAsNumber: true })}
                className="mt-1 bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Técnicas Aprendidas/Practicadas</Label>
            <Textarea
              {...register('techniques_practiced')}
              placeholder="Ej: armbar desde guard, barrido..."
              rows={2}
              className="mt-1 bg-secondary/50 border-border/50 resize-none text-sm"
            />
          </div>
        </>
      )}

      <div>
        <Label className="text-xs text-muted-foreground">Lesiones / Molestias</Label>
        <Textarea
          {...register('injuries_notes')}
          placeholder="Ej: leve molestia en hombro derecho..."
          rows={2}
          className="mt-1 bg-secondary/50 border-border/50 resize-none text-sm"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Notas Generales</Label>
        <Textarea
          {...register('general_notes')}
          placeholder="Impresiones generales de la sesión..."
          rows={3}
          className="mt-1 bg-secondary/50 border-border/50 resize-none text-sm"
        />
      </div>

      <Button type="submit" className="w-full" disabled={upsert.isPending}>
        {upsert.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {existingLog ? 'Actualizar Registro' : 'Guardar Registro'}
      </Button>
    </form>
  )
}
