'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sessionSchema, type SessionInput } from '@/lib/validations/daily-log'
import { useCreateSession } from '@/hooks/useSessions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SESSION_TYPE_LABELS, TRAINING_SESSION_TYPES, EVENT_SESSION_TYPES, type SessionType } from '@/lib/schedule/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AddSessionModalProps {
  date: string | null
  weekStart: string
  onClose: () => void
}

const FORM_DEFAULTS = {
  start_time: '18:00',
  end_time: '19:30',
  session_type: 'bjj_fundamentals' as SessionType,
  title: '',
  category: 'training' as 'training' | 'event',
}

export function AddSessionModal({ date, weekStart, onClose }: AddSessionModalProps) {
  const createSession = useCreateSession()

  const { register, control, handleSubmit, watch, reset } = useForm({
    defaultValues: FORM_DEFAULTS,
  })

  // Reset form to defaults whenever the modal opens (date changes from null → string)
  useEffect(() => {
    if (date) {
      reset(FORM_DEFAULTS)
    }
  }, [date, reset])

  const category = watch('category')
  const sessionType = watch('session_type')

  async function onSubmit(data: typeof FORM_DEFAULTS) {
    if (!date) return
    try {
      await createSession.mutateAsync({
        date,
        week_start: weekStart,
        start_time: data.start_time + ':00',
        end_time: data.end_time + ':00',
        session_type: data.session_type,
        title: data.title.trim() || SESSION_TYPE_LABELS[data.session_type],
        category: data.category,
      })
      toast.success('Sesión añadida')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al añadir la sesión')
    }
  }

  const dayLabel = date ? format(new Date(date + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }) : ''

  return (
    <Dialog open={!!date} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-sm bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-base">Añadir Sesión</DialogTitle>
          {date && <p className="text-sm text-muted-foreground capitalize">{dayLabel}</p>}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Categoría</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={v => field.onChange(v as 'training' | 'event')}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Entrenamiento</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Tipo de Sesión</Label>
            <Controller
              name="session_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={v => {
                  field.onChange(v)
                  // Auto-fill title
                }}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(category === 'training' ? TRAINING_SESSION_TYPES : EVENT_SESSION_TYPES).map(t => (
                      <SelectItem key={t} value={t}>{SESSION_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Nombre (opcional)</Label>
            <Input
              {...register('title')}
              placeholder={SESSION_TYPE_LABELS[sessionType]}
              className="mt-1 bg-secondary/50 border-border/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Inicio</Label>
              <Input
                type="time"
                {...register('start_time')}
                className="mt-1 bg-secondary/50 border-border/50"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fin</Label>
              <Input
                type="time"
                {...register('end_time')}
                className="mt-1 bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={createSession.isPending} className="flex-1">
              {createSession.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Añadir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
