'use client'

import { useState } from 'react'
import { Plus, Dumbbell, MoreVertical, Play, Copy, Trash2, Pencil, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useSCPrograms, useActiveSCProgram,
  useActivateSCProgram, useDeleteSCProgram, useDuplicateSCProgram,
  useSCProgram,
} from '@/hooks/useSC'
import { SCActiveCard } from '@/components/strength/SCActiveCard'
import { SCProgramForm } from '@/components/strength/SCProgramForm'
import { SCImportButton } from '@/components/strength/SCImportButton'
import type { SCProgram } from '@/lib/sc/types'
import type { SCImportResult } from '@/lib/sc/import'

type SheetMode = 'create' | 'edit' | 'import'

export default function StrengthPage() {
  const { data: programs = [], isLoading } = useSCPrograms()
  const { data: activeProgram } = useActiveSCProgram()
  const activate = useActivateSCProgram()
  const deleteProg = useDeleteSCProgram()
  const duplicate = useDuplicateSCProgram()

  const [sheetMode, setSheetMode] = useState<SheetMode | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [importData, setImportData] = useState<SCImportResult | null>(null)
  const { data: editingProgram } = useSCProgram(editingId)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'programs'>('dashboard')

  async function handleActivate(id: string) {
    try {
      await activate.mutateAsync(id)
      toast.success('Programa activado')
    } catch {
      toast.error('Error al activar')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProg.mutateAsync(id)
      toast.success('Programa eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicate.mutateAsync(id)
      toast.success('Programa duplicado')
    } catch {
      toast.error('Error al duplicar')
    }
  }

  function openEdit(id: string) {
    setEditingId(id)
    setSheetMode('edit')
    setOpenMenuId(null)
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header: móvil en columna para que quepa título + acciones */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-card">
        <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-start md:justify-between md:gap-4 lg:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold leading-snug text-balance lg:text-lg">
              Fuerza & Acondicionamiento
            </h1>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-end">
            <button
              type="button"
              onClick={() => setSheetMode('create')}
              className="order-1 flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90 md:order-2 md:h-9 md:w-auto md:px-3 md:py-1.5"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Nuevo programa
            </button>
            <SCImportButton
              className="order-2 w-full md:order-1 md:w-auto md:max-w-xl lg:max-w-none"
              onImport={result => {
                setImportData(result)
                setSheetMode('import')
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      {activeProgram && (
        <div className="flex border-b border-border px-4 bg-card">
          {(['dashboard', 'programs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'dashboard' ? 'Activo' : 'Programas'}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 max-w-2xl mx-auto w-full space-y-4">
        {/* Dashboard tab */}
        {(activeTab === 'dashboard' || !activeProgram) && (
          <>
            {isLoading ? (
              <Skeleton className="h-52 w-full rounded-2xl" />
            ) : activeProgram ? (
              <SCActiveCard program={activeProgram} />
            ) : (
              <EmptyState onCreate={() => setSheetMode('create')} />
            )}
          </>
        )}

        {/* Programs list */}
        {(activeTab === 'programs' || !activeProgram) && (
          <div className="space-y-3">
            {!activeProgram && <h2 className="font-medium text-sm text-muted-foreground">Todos los programas</h2>}

            {isLoading && (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))
            )}

            {!isLoading && programs.length === 0 && !activeProgram && null}

            {programs.map(prog => (
              <ProgramCard
                key={prog.id}
                program={prog}
                isActive={prog.is_active}
                menuOpen={openMenuId === prog.id}
                onMenuToggle={() => setOpenMenuId(openMenuId === prog.id ? null : prog.id)}
                onActivate={() => handleActivate(prog.id)}
                onEdit={() => openEdit(prog.id)}
                onDuplicate={() => { handleDuplicate(prog.id); setOpenMenuId(null) }}
                onDelete={() => { handleDelete(prog.id); setOpenMenuId(null) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit / Import Sheet */}
      <Sheet open={sheetMode !== null} onOpenChange={open => { if (!open) { setSheetMode(null); setEditingId(null); setImportData(null) } }}>
        <SheetContent side="bottom" className="h-[90dvh] max-h-[90dvh] gap-0 p-0 flex flex-col overflow-hidden rounded-t-2xl">
          <SheetHeader className="shrink-0 px-4 pt-4 pb-2 border-b border-border/60">
            <SheetTitle>
              {sheetMode === 'edit' ? 'Editar programa' : sheetMode === 'import' ? 'Importar programa' : 'Nuevo programa'}
            </SheetTitle>
          </SheetHeader>
          {sheetMode === 'create' && (
            <SCProgramForm
              onSuccess={() => setSheetMode(null)}
              onCancel={() => setSheetMode(null)}
            />
          )}
          {sheetMode === 'import' && importData && (
            <SCProgramForm
              initialData={importData}
              onSuccess={() => { setSheetMode(null); setImportData(null) }}
              onCancel={() => { setSheetMode(null); setImportData(null) }}
            />
          )}
          {sheetMode === 'edit' && editingProgram && (
            <SCProgramForm
              existing={editingProgram}
              onSuccess={() => { setSheetMode(null); setEditingId(null) }}
              onCancel={() => { setSheetMode(null); setEditingId(null) }}
            />
          )}
          {sheetMode === 'edit' && !editingProgram && (
            <div className="flex-1 flex items-center justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ProgramCard({
  program, isActive, menuOpen,
  onMenuToggle, onActivate, onEdit, onDuplicate, onDelete,
}: {
  program: SCProgram
  isActive: boolean
  menuOpen: boolean
  onMenuToggle: () => void
  onActivate: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div className={cn(
      'relative rounded-xl border bg-card p-4 transition-colors',
      isActive ? 'border-primary/30 bg-primary/5' : 'border-border'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm truncate">{program.name}</h3>
            {isActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                <CheckCircle2 className="w-3 h-3" /> Activo
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {program.total_weeks} semanas · {program.days_per_week} ses./semana
            {program.start_date && ` · desde ${new Date(program.start_date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
          </p>
        </div>

        <div className="relative ml-2">
          <button
            onClick={onMenuToggle}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-border bg-card shadow-lg py-1">
              {!isActive && (
                <button
                  onClick={onActivate}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                >
                  <Play className="w-3.5 h-3.5 text-primary" /> Activar
                </button>
              )}
              <button
                onClick={onEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <button
                onClick={onDuplicate}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicar
              </button>
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {program.notes && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{program.notes}</p>
      )}
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Dumbbell className="w-7 h-7 text-muted-foreground" />
      </div>
      <h2 className="font-semibold mb-1">Sin programa de S&C</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Crea tu primer programa de fuerza y acondicionamiento para registrar sesiones y ver tu progreso.
      </p>
      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Crear programa
      </button>
    </div>
  )
}
