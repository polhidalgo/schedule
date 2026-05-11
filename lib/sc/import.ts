import * as XLSX from 'xlsx'
import type { SCExercise } from './types'
import type { SCProgramInput } from '@/lib/validations/sc'

// ─── Public types ───────────────────────────────────────────────────────────

export interface SCImportWarning {
  row: number
  field: string
  message: string
}

export interface SCImportResult {
  program: Omit<SCProgramInput, 'weeks'>
  weeks: SCProgramInput['weeks']
  warnings: SCImportWarning[]
}

// ─── Template generation ────────────────────────────────────────────────────

export function generateTemplate(): Blob {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Program metadata
  const programSheet = XLSX.utils.aoa_to_sheet([
    ['name', 'total_weeks', 'days_per_week', 'start_date', 'notes'],
    ['Mi plan de fuerza', 8, 3, '2026-05-18', ''],
  ])
  programSheet['!cols'] = [
    { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 40 },
  ]
  XLSX.utils.book_append_sheet(wb, programSheet, 'Program')

  // Sheet 2: Plan (one row per exercise)
  const planSheet = XLSX.utils.aoa_to_sheet([
    ['week', 'phase', 'week_rpe', 'session', 'exercise', 'sets', 'reps', 'weight', 'exercise_rpe', 'notes'],
    [1, 'Acumulación', '7', 1, 'Sentadilla', 4, '8', 80, '', ''],
    [1, 'Acumulación', '7', 1, 'Peso muerto', 3, '6', '', '', ''],
    [1, 'Acumulación', '7', 2, 'Press banca', 4, '8', 60, '', ''],
    [1, 'Acumulación', '7', 2, 'Dominadas', 3, '6', '', '', ''],
    [1, 'Acumulación', '7', 3, 'Press militar', 3, '8', '', '', ''],
    [2, 'Acumulación', '7.5', 1, 'Sentadilla', 4, '8', 85, '', ''],
  ])
  planSheet['!cols'] = [
    { wch: 8 }, { wch: 18 }, { wch: 12 }, { wch: 10 },
    { wch: 28 }, { wch: 8 }, { wch: 8 }, { wch: 10 },
    { wch: 14 }, { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, planSheet, 'Plan')

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

// ─── Parsing ────────────────────────────────────────────────────────────────

interface RawProgramRow {
  name?: unknown
  total_weeks?: unknown
  days_per_week?: unknown
  start_date?: unknown
  notes?: unknown
}

interface RawPlanRow {
  week?: unknown
  phase?: unknown
  week_rpe?: unknown
  session?: unknown
  exercise?: unknown
  sets?: unknown
  reps?: unknown
  weight?: unknown
  exercise_rpe?: unknown
  notes?: unknown
}

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function num(v: unknown): number | null {
  const n = Number(v)
  return isNaN(n) ? null : n
}

function numInt(v: unknown): number | null {
  const n = num(v)
  return n === null ? null : Math.round(n)
}

export async function parseExcelFile(
  file: File,
  catalog: SCExercise[]
): Promise<SCImportResult> {
  const warnings: SCImportWarning[] = []

  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  // ── Sheet: Program ──────────────────────────────────────────────────────
  const programSheetName = wb.SheetNames.find(
    n => n.toLowerCase() === 'program'
  )
  if (!programSheetName) {
    throw new Error(
      'El archivo no contiene la hoja "Program". Descarga la plantilla y vuelve a intentarlo.'
    )
  }

  const programRows = XLSX.utils.sheet_to_json<RawProgramRow>(
    wb.Sheets[programSheetName],
    { defval: '' }
  )

  if (programRows.length === 0) {
    throw new Error(
      'La hoja "Program" está vacía. Rellena al menos una fila con los datos del programa.'
    )
  }

  const pr = programRows[0]
  const programName = str(pr.name)
  if (!programName) {
    throw new Error('El campo "name" de la hoja "Program" es obligatorio.')
  }

  const totalWeeks = numInt(pr.total_weeks)
  if (!totalWeeks || totalWeeks < 1 || totalWeeks > 52) {
    throw new Error(
      '"total_weeks" debe ser un número entre 1 y 52 en la hoja "Program".'
    )
  }

  const daysPerWeek = numInt(pr.days_per_week)
  if (!daysPerWeek || daysPerWeek < 1 || daysPerWeek > 7) {
    throw new Error(
      '"days_per_week" debe ser un número entre 1 y 7 en la hoja "Program".'
    )
  }

  const startDateRaw = str(pr.start_date)
  let startDate: string | null = null
  if (startDateRaw) {
    // Excel may store dates as serial numbers
    if (/^\d+$/.test(startDateRaw)) {
      const jsDate = XLSX.SSF.parse_date_code(Number(startDateRaw))
      if (jsDate) {
        const y = jsDate.y
        const m = String(jsDate.m).padStart(2, '0')
        const d = String(jsDate.d).padStart(2, '0')
        startDate = `${y}-${m}-${d}`
      }
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(startDateRaw)) {
      startDate = startDateRaw
    } else {
      warnings.push({ row: 2, field: 'start_date', message: `Formato de fecha no reconocido: "${startDateRaw}". Usa YYYY-MM-DD.` })
    }
  }

  const programNotes = str(pr.notes) || null

  // ── Sheet: Plan ─────────────────────────────────────────────────────────
  const planSheetName = wb.SheetNames.find(
    n => n.toLowerCase() === 'plan'
  )
  if (!planSheetName) {
    throw new Error(
      'El archivo no contiene la hoja "Plan". Descarga la plantilla y vuelve a intentarlo.'
    )
  }

  const planRows = XLSX.utils.sheet_to_json<RawPlanRow>(
    wb.Sheets[planSheetName],
    { defval: '' }
  )

  // Build a lowercase name → id map for the catalog
  const catalogMap = new Map<string, SCExercise>()
  for (const ex of catalog) {
    catalogMap.set(ex.name.toLowerCase(), ex)
  }

  // Group rows into weeks → sessions → exercises
  type ExerciseEntry = SCProgramInput['weeks'][number]['sessions'][number]['exercises'][number]
  type SessionEntry = { session_number: number; exercises: ExerciseEntry[] }
  type WeekEntry = {
    week_number: number
    phase_name: string | null
    rpe_target: string | null
    notes: null
    sessions: Map<number, SessionEntry>
  }

  const weeksMap = new Map<number, WeekEntry>()

  for (let i = 0; i < planRows.length; i++) {
    const row = planRows[i]
    const rowNum = i + 2 // 1-based, plus header row

    const weekNum = numInt(row.week)
    if (!weekNum || weekNum < 1 || weekNum > totalWeeks) {
      warnings.push({
        row: rowNum,
        field: 'week',
        message: `Semana inválida (${row.week}). Debe ser entre 1 y ${totalWeeks}. Fila ignorada.`,
      })
      continue
    }

    const sessionNum = numInt(row.session)
    if (!sessionNum || sessionNum < 1 || sessionNum > daysPerWeek) {
      warnings.push({
        row: rowNum,
        field: 'session',
        message: `Sesión inválida (${row.session}). Debe ser entre 1 y ${daysPerWeek}. Fila ignorada.`,
      })
      continue
    }

    const exerciseName = str(row.exercise)
    if (!exerciseName) {
      warnings.push({
        row: rowNum,
        field: 'exercise',
        message: `El nombre del ejercicio está vacío. Fila ignorada.`,
      })
      continue
    }

    const catalogEntry = catalogMap.get(exerciseName.toLowerCase())
    if (!catalogEntry) {
      warnings.push({
        row: rowNum,
        field: 'exercise',
        message: `Ejercicio no encontrado en el catálogo: "${exerciseName}". Puedes añadirlo manualmente en el formulario.`,
      })
      continue
    }

    const sets = numInt(row.sets)
    if (!sets || sets < 1 || sets > 20) {
      warnings.push({
        row: rowNum,
        field: 'sets',
        message: `"sets" inválido (${row.sets}) en fila ${rowNum}. Debe ser entre 1 y 20. Fila ignorada.`,
      })
      continue
    }

    const repsRaw = str(row.reps)
    if (!repsRaw) {
      warnings.push({
        row: rowNum,
        field: 'reps',
        message: `"reps" está vacío en fila ${rowNum}. Fila ignorada.`,
      })
      continue
    }

    const weightRaw = str(row.weight)
    const weight = weightRaw ? num(row.weight) : null

    const exerciseRpe = str(row.exercise_rpe) || null
    const exerciseNotes = str(row.notes) || null

    // Ensure week entry
    if (!weeksMap.has(weekNum)) {
      weeksMap.set(weekNum, {
        week_number: weekNum,
        phase_name: str(row.phase) || null,
        rpe_target: str(row.week_rpe) || null,
        notes: null,
        sessions: new Map(),
      })
    }

    const weekEntry = weeksMap.get(weekNum)!
    // Keep first-seen phase/rpe for the week (they should be consistent across rows)
    if (!weekEntry.phase_name && str(row.phase)) {
      weekEntry.phase_name = str(row.phase)
    }
    if (!weekEntry.rpe_target && str(row.week_rpe)) {
      weekEntry.rpe_target = str(row.week_rpe)
    }

    if (!weekEntry.sessions.has(sessionNum)) {
      weekEntry.sessions.set(sessionNum, { session_number: sessionNum, exercises: [] })
    }

    const session = weekEntry.sessions.get(sessionNum)!
    session.exercises.push({
      exercise_id: catalogEntry.id,
      sets,
      reps_target: repsRaw,
      weight_target: weight,
      rpe_target: exerciseRpe,
      sort_order: session.exercises.length,
      notes: exerciseNotes,
    })
  }

  // Build full weeks array, filling gaps with empty sessions
  const weeks: SCProgramInput['weeks'] = []
  for (let w = 1; w <= totalWeeks; w++) {
    const entry = weeksMap.get(w)
    const sessions: SessionEntry[] = []
    for (let s = 1; s <= daysPerWeek; s++) {
      sessions.push(
        entry?.sessions.get(s) ?? { session_number: s, exercises: [] }
      )
    }
    weeks.push({
      week_number: w,
      phase_name: entry?.phase_name ?? null,
      rpe_target: entry?.rpe_target ?? null,
      notes: null,
      sessions,
    })
  }

  return {
    program: {
      name: programName,
      total_weeks: totalWeeks,
      days_per_week: daysPerWeek,
      start_date: startDate,
      notes: programNotes,
    },
    weeks,
    warnings,
  }
}
