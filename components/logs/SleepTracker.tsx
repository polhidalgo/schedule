'use client'

import { useState, useEffect } from 'react'
import { useActiveSleep, useStartSleep, useEndSleep, useSleepLogs } from '@/hooks/useSleep'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function SleepTracker() {
  const { data: activeSleep, isLoading } = useActiveSleep()
  const { data: recentSleepLogs } = useSleepLogs(14)
  const startSleep = useStartSleep()
  const endSleep = useEndSleep()
  const [elapsed, setElapsed] = useState('')

  // Live timer when sleeping
  useEffect(() => {
    if (!activeSleep) { setElapsed(''); return }
    const update = () => {
      setElapsed(formatDistanceToNow(parseISO(activeSleep.sleep_start), { locale: es, addSuffix: false }))
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [activeSleep])

  async function handleStart() {
    try {
      await startSleep.mutateAsync()
      toast.success('Buenas noches! Registro de sueño iniciado.')
    } catch {
      toast.error('Error iniciando el registro')
    }
  }

  async function handleEnd() {
    if (!activeSleep) return
    try {
      const result = await endSleep.mutateAsync(activeSleep.id)
      toast.success(`Dormiste ${result.duration_hours?.toFixed(1)}h. ¡Buenos días!`)
    } catch {
      toast.error('Error finalizando el registro')
    }
  }

  const avgSleep = recentSleepLogs && recentSleepLogs.length > 0
    ? recentSleepLogs.reduce((acc, s) => acc + (s.duration_hours ?? 0), 0) / recentSleepLogs.length
    : null

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Registro de Sueño</h3>
        {avgSleep && (
          <span className="text-xs text-muted-foreground">
            Promedio 14d: <span className="text-foreground font-medium">{avgSleep.toFixed(1)}h</span>
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : activeSleep ? (
        /* Sleeping state */
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-indigo-300">Durmiendo…</p>
              <p className="text-xs text-muted-foreground">
                Inicio: {format(parseISO(activeSleep.sleep_start), 'HH:mm', { locale: es })}
                {elapsed && ` · hace ${elapsed}`}
              </p>
            </div>
          </div>
          <Button
            onClick={handleEnd}
            disabled={endSleep.isPending}
            className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {endSleep.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Sun className="w-4 h-4" />}
            Despertar ☀️
          </Button>
        </div>
      ) : (
        /* Awake state */
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Pulsa cuando vayas a dormir para registrar tus horas de sueño.</p>
          <Button
            onClick={handleStart}
            disabled={startSleep.isPending}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 font-semibold"
          >
            {startSleep.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Moon className="w-4 h-4" />}
            Ir a Dormir 🌙
          </Button>
        </div>
      )}

      {/* Recent sleep history */}
      {recentSleepLogs && recentSleepLogs.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground font-medium">Últimas noches</p>
          {recentSleepLogs.slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground capitalize">
                {log.date ? format(parseISO(log.date), "EEEE d MMM", { locale: es }) : '—'}
              </span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className={`font-medium ${
                  (log.duration_hours ?? 0) >= 7 ? 'text-green-400' :
                  (log.duration_hours ?? 0) >= 6 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {log.duration_hours?.toFixed(1)}h
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
