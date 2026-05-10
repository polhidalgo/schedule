'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SessionLogForm } from './SessionLogForm'
import { SCSessionLogger } from '@/components/strength/SCSessionLogger'
import { SESSION_TYPE_LABELS, TRAINING_SESSION_TYPES } from '@/lib/schedule/types'
import type { Session } from '@/lib/schedule/types'
import { formatTime, getSessionDurationMinutes, formatDuration, SESSION_COLORS } from '@/lib/schedule/utils'
import { useDeleteSession } from '@/hooks/useSessions'
import { useActiveSCProgram } from '@/hooks/useSC'
import { toast } from 'sonner'
import { Trash2, ClipboardList, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface SessionModalProps {
  session: Session | null
  onClose: () => void
}

export function SessionModal({ session, onClose }: SessionModalProps) {
  const [tab, setTab] = useState<'info' | 'log'>('info')
  const deleteSession = useDeleteSession()
  const { data: activeProgram } = useActiveSCProgram()

  if (!session) return null

  const colors = SESSION_COLORS[session.session_type]
  const duration = getSessionDurationMinutes(session.start_time, session.end_time)
  const isTraining = TRAINING_SESSION_TYPES.includes(session.session_type)
  const isStrength = session.session_type === 'strength_training'
  const useStrengthLogger = isStrength && !!activeProgram
  const dayName = format(parseISO(session.date), "EEEE d 'de' MMMM", { locale: es })
  const log = session.session_log

  async function handleDelete() {
    if (!confirm('¿Eliminar esta sesión de la semana actual?')) return
    try {
      await deleteSession.mutateAsync(session!.id)
      toast.success('Sesión eliminada')
      onClose()
    } catch {
      toast.error('Error al eliminar la sesión')
    }
  }

  return (
    <Dialog open={!!session} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md bg-card border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="text-base" style={{ color: colors.fg }}>{session.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5 capitalize">{dayName}</p>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 text-[10px]"
              style={{ borderColor: colors.dot, color: colors.fg }}
            >
              {session.category === 'training' ? 'Entrenamiento' : 'Evento'}
            </Badge>
          </div>
        </DialogHeader>

        <div
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{ background: colors.softBg, border: `1px solid ${colors.dot}33`, borderLeft: `3px solid ${colors.dot}` }}
        >
          <div className="text-sm">
            <span className="font-medium">{formatTime(session.start_time)}</span>
            <span className="text-muted-foreground mx-1">→</span>
            <span className="font-medium">{formatTime(session.end_time)}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">{formatDuration(duration)}</span>
          {log?.attended === false && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1 text-yellow-500 text-xs">
                <AlertCircle className="w-3 h-3" />
                No asistí
              </div>
            </>
          )}
        </div>

        {isTraining && (
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            {(['info', 'log'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors',
                  tab === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
                )}
              >
                {t === 'info' ? <Info className="w-3.5 h-3.5" /> : <ClipboardList className="w-3.5 h-3.5" />}
                {t === 'info' ? 'Info' : log ? 'Ver/Editar Registro' : 'Registrar Sesión'}
              </button>
            ))}
          </div>
        )}

        {tab === 'info' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2.5 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium mt-0.5 text-xs">{SESSION_TYPE_LABELS[session.session_type]}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Duración</p>
                <p className="font-medium mt-0.5">{formatDuration(duration)}</p>
              </div>
            </div>

            {log && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Métricas</p>
                <div className="grid grid-cols-3 gap-2">
                  {log.rpe && (
                    <div className="p-2 rounded-lg bg-secondary/50 text-center">
                      <p className="text-lg font-bold text-primary">{log.rpe}</p>
                      <p className="text-[10px] text-muted-foreground">RPE</p>
                    </div>
                  )}
                  {log.fatigue && (
                    <div className="p-2 rounded-lg bg-secondary/50 text-center">
                      <p className="text-lg font-bold text-orange-400">{log.fatigue}</p>
                      <p className="text-[10px] text-muted-foreground">Cansancio</p>
                    </div>
                  )}
                  {log.technical_quality && (
                    <div className="p-2 rounded-lg bg-secondary/50 text-center">
                      <p className="text-lg font-bold text-green-400">{log.technical_quality}</p>
                      <p className="text-[10px] text-muted-foreground">Técnica</p>
                    </div>
                  )}
                </div>
                {log.sparring_rounds !== undefined && log.sparring_rounds !== null && log.sparring_rounds > 0 && (
                  <p className="text-xs text-muted-foreground">{log.sparring_rounds} rounds de sparring</p>
                )}
                {log.injuries_notes && (
                  <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-400">⚠ {log.injuries_notes}</p>
                  </div>
                )}
                {log.general_notes && (
                  <p className="text-sm text-muted-foreground italic">"{log.general_notes}"</p>
                )}
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteSession.isPending}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </Button>
            </div>
          </div>
        )}

        {tab === 'log' && isTraining && (
          useStrengthLogger && activeProgram ? (
            <SCSessionLogger
              session={session}
              program={activeProgram}
              onSuccess={onClose}
            />
          ) : (
            <SessionLogForm
              sessionId={session.id}
              existingLog={log ?? null}
              onSuccess={onClose}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
