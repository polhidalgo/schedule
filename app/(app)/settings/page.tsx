'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SESSION_TYPE_LABELS,
  TRAINING_SESSION_TYPES,
  EVENT_SESSION_TYPES,
  DAY_NAMES_FULL,
} from '@/lib/schedule/types'
import type { TemplateSession, SessionType, TimetableType } from '@/lib/schedule/types'
import { SESSION_COLORS, formatTime } from '@/lib/schedule/utils'
import { Plus, Pencil, Trash2, Loader2, Settings, Info } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function useTemplates(timetable: TimetableType) {
  return useQuery<TemplateSession[]>({
    queryKey: ['templates', timetable],
    queryFn: async () => {
      const res = await fetch(`/api/templates?timetable=${timetable}`)
      if (!res.ok) throw new Error('Error cargando plantillas')
      return res.json()
    },
  })
}

// ─── Template session form (add / edit) ───────────────────────────────────────

interface TemplateFormData {
  timetable: TimetableType
  day_of_week: number
  start_time: string
  end_time: string
  session_type: SessionType
  title: string
  category: 'training' | 'event'
}

interface TemplateFormProps {
  timetable: TimetableType
  existing?: TemplateSession
  onClose: () => void
}

function TemplateForm({ timetable, existing, onClose }: TemplateFormProps) {
  const qc = useQueryClient()
  const [form, setForm] = useState<TemplateFormData>({
    timetable,
    day_of_week: existing?.day_of_week ?? 0,
    start_time: existing ? formatTime(existing.start_time) : '18:00',
    end_time: existing ? formatTime(existing.end_time) : '19:30',
    session_type: existing?.session_type ?? 'bjj_fundamentals',
    title: existing?.title ?? '',
    category: existing?.category ?? 'training',
  })
  const [saving, setSaving] = useState(false)

  const sessionTypes = form.category === 'training' ? TRAINING_SESSION_TYPES : EVENT_SESSION_TYPES

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }
    setSaving(true)
    try {
      const url = existing ? `/api/templates/${existing.id}` : '/api/templates'
      const method = existing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Error guardando plantilla')
      toast.success(existing ? 'Sesión actualizada' : 'Sesión añadida al timetable')
      qc.invalidateQueries({ queryKey: ['templates'] })
      onClose()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Categoría</Label>
          <Select
            value={form.category}
            onValueChange={v => setForm(f => ({
              ...f,
              category: v as 'training' | 'event',
              session_type: v === 'training' ? 'bjj_fundamentals' : 'trayecto',
            }))}
          >
            <SelectTrigger className="mt-1 bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="training">Entrenamiento</SelectItem>
              <SelectItem value="event">Evento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Día de la semana</Label>
          <Select
            value={String(form.day_of_week)}
            onValueChange={v => setForm(f => ({ ...f, day_of_week: Number(v) }))}
          >
            <SelectTrigger className="mt-1 bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_NAMES_FULL.map((d, i) => (
                <SelectItem key={i} value={String(i)}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Tipo de sesión</Label>
        <Select
          value={form.session_type}
          onValueChange={v => {
            const type = v as SessionType
            setForm(f => ({
              ...f,
              session_type: type,
              title: f.title || SESSION_TYPE_LABELS[type],
            }))
          }}
        >
          <SelectTrigger className="mt-1 bg-secondary/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sessionTypes.map(t => (
              <SelectItem key={t} value={t}>{SESSION_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Nombre personalizado</Label>
        <Input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder={SESSION_TYPE_LABELS[form.session_type]}
          className="mt-1 bg-secondary/50 border-border/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Inicio</Label>
          <Input
            type="time"
            value={form.start_time}
            onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
            className="mt-1 bg-secondary/50 border-border/50"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Fin</Label>
          <Input
            type="time"
            value={form.end_time}
            onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
            className="mt-1 bg-secondary/50 border-border/50"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {existing ? 'Guardar cambios' : 'Añadir sesión'}
        </Button>
      </div>
    </div>
  )
}

// ─── Single template session row ──────────────────────────────────────────────

function TemplateRow({
  session,
  onEdit,
  onDelete,
}: {
  session: TemplateSession
  onEdit: () => void
  onDelete: () => void
}) {
  const colors = SESSION_COLORS[session.session_type]

  return (
    <div className={cn(
      'flex items-center gap-3 p-2.5 rounded-lg border',
      colors.bg, colors.border
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-semibold', colors.text)}>{session.title}</span>
          <span className="text-[10px] text-muted-foreground">
            {DAY_NAMES_FULL[session.day_of_week]}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {formatTime(session.start_time)} – {formatTime(session.end_time)}
        </p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Timetable panel (A or B) ─────────────────────────────────────────────────

function TimetablePanel({ timetable }: { timetable: TimetableType }) {
  const { data: sessions, isLoading } = useTemplates(timetable)
  const qc = useQueryClient()
  const [editing, setEditing] = useState<TemplateSession | null>(null)
  const [adding, setAdding] = useState(false)

  // Group by day
  const byDay = Array.from({ length: 7 }, (_, i) =>
    (sessions ?? []).filter(s => s.day_of_week === i)
  )

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta sesión del timetable? No afecta a la semana actual.')) return
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Sesión eliminada del timetable')
      qc.invalidateQueries({ queryKey: ['templates'] })
    } else {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-1.5">
          <Info className="w-3.5 h-3.5" />
          Los cambios se aplican a partir de la próxima semana
        </div>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5 text-xs h-8">
          <Plus className="w-3.5 h-3.5" />
          Añadir sesión
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {DAY_NAMES_FULL.map((dayName, dayIndex) => {
            const daySessions = byDay[dayIndex]
            if (daySessions.length === 0) return null
            return (
              <div key={dayIndex}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5 px-0.5">{dayName}</p>
                <div className="space-y-1.5">
                  {daySessions.map(s => (
                    <TemplateRow
                      key={s.id}
                      session={s}
                      onEdit={() => setEditing(s)}
                      onDelete={() => handleDelete(s.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {sessions?.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <p className="text-sm">Sin sesiones en este timetable</p>
              <p className="text-xs">Añade sesiones para que se carguen cada semana automáticamente</p>
            </div>
          )}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={adding} onOpenChange={open => !open && setAdding(false)}>
        <DialogContent className="max-w-sm bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>Añadir sesión — Timetable {timetable}</DialogTitle>
          </DialogHeader>
          <TemplateForm
            timetable={timetable}
            onClose={() => setAdding(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-w-sm bg-card border-border/50">
          <DialogHeader>
            <DialogTitle>Editar sesión — Timetable {timetable}</DialogTitle>
          </DialogHeader>
          {editing && (
            <TemplateForm
              timetable={timetable}
              existing={editing}
              onClose={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Settings page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TimetableType>('A')

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/50 sticky top-0 z-10">
        <Settings className="w-5 h-5 text-muted-foreground" />
        <h1 className="font-semibold">Ajustes</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 max-w-lg mx-auto w-full space-y-4">
        <div>
          <h2 className="font-semibold text-sm">Personalizar Timetables</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Define qué sesiones se cargan por defecto cada semana. Los cambios afectan a partir de la próxima semana.
          </p>
        </div>

        {/* Timetable tabs */}
        <div className="flex rounded-xl border border-border/50 overflow-hidden">
          {(['A', 'B'] as TimetableType[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-colors',
                activeTab === t
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span>Timetable {t}</span>
                <span className="text-[10px] font-normal opacity-70">
                  {t === 'A' ? 'Semana completa' : 'Recuperación'}
                </span>
              </div>
            </button>
          ))}
        </div>

        <TimetablePanel timetable={activeTab} />

        <Separator className="my-2" />

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">¿Cómo funcionan los timetables?</p>
          <p>• <strong>Timetable A</strong> es tu semana de entrenamiento normal.</p>
          <p>• <strong>Timetable B</strong> es para semanas de recuperación o lesión con carga reducida.</p>
          <p>• Cada lunes a las 00:00 UTC se crea automáticamente tu nueva semana con el último timetable usado.</p>
          <p>• Puedes cambiar de A a B (o viceversa) en cualquier momento desde la vista semanal.</p>
        </div>
      </div>
    </div>
  )
}
