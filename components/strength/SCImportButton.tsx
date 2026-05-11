'use client'

import { useRef, useState } from 'react'
import { FileSpreadsheet, Download, Loader2, AlertTriangle, X } from 'lucide-react'
import { generateTemplate, parseExcelFile, type SCImportResult, type SCImportWarning } from '@/lib/sc/import'
import { useSCExercises } from '@/hooks/useSC'

interface SCImportButtonProps {
  onImport: (result: SCImportResult) => void
}

export function SCImportButton({ onImport }: SCImportButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<SCImportWarning[]>([])
  const [pendingResult, setPendingResult] = useState<SCImportResult | null>(null)

  const { data: catalog = [] } = useSCExercises()

  function handleDownloadTemplate() {
    const blob = generateTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla-sc-programa.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!fileRef.current) return
    fileRef.current.value = ''
    if (!file) return

    setError(null)
    setWarnings([])
    setPendingResult(null)
    setLoading(true)

    try {
      const result = await parseExcelFile(file, catalog)
      if (result.warnings.length > 0) {
        setWarnings(result.warnings)
        setPendingResult(result)
      } else {
        onImport(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al leer el archivo.')
    } finally {
      setLoading(false)
    }
  }

  function confirmWithWarnings() {
    if (pendingResult) {
      onImport(pendingResult)
      setWarnings([])
      setPendingResult(null)
    }
  }

  function dismissWarnings() {
    setWarnings([])
    setPendingResult(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {/* Import button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <FileSpreadsheet className="w-4 h-4" />
          }
          Importar Excel
        </button>

        {/* Download template */}
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent transition-colors"
          title="Descargar plantilla Excel"
        >
          <Download className="w-4 h-4" />
          Plantilla
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Critical error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Warnings banner */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {warnings.length} advertencia{warnings.length > 1 ? 's' : ''} al importar
            </div>
            <button
              type="button"
              onClick={dismissWarnings}
              className="p-1 rounded-md hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <ul className="space-y-1">
            {warnings.slice(0, 5).map((w, i) => (
              <li key={i} className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-medium">Fila {w.row} ({w.field}):</span> {w.message}
              </li>
            ))}
            {warnings.length > 5 && (
              <li className="text-xs text-amber-600 dark:text-amber-500">
                ...y {warnings.length - 5} más. Podrás corregirlos en el formulario.
              </li>
            )}
          </ul>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={confirmWithWarnings}
              className="flex-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors"
            >
              Continuar de todas formas
            </button>
            <button
              type="button"
              onClick={dismissWarnings}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
