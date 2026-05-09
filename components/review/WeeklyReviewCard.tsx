'use client'

import { useState } from 'react'
import type { WeeklyReview } from '@/lib/schedule/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronDown, ChevronUp, AlertTriangle, Lightbulb, TrendingUp, RotateCcw, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WeeklyReviewCardProps {
  review: WeeklyReview
  isLatest?: boolean
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
    </div>
  )
}

function CollapsibleSection({
  icon,
  title,
  content,
  defaultOpen = false,
  accentColor,
}: {
  icon: React.ReactNode
  title: string
  content: string | null
  defaultOpen?: boolean
  accentColor?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!content) return null

  return (
    <div className={cn('rounded-lg border overflow-hidden', accentColor ? `border-${accentColor}/20 bg-${accentColor}/5` : 'border-border/50')}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-3">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</p>
        </div>
      )}
    </div>
  )
}

export function WeeklyReviewCard({ review, isLatest = false }: WeeklyReviewCardProps) {
  const weekLabel = format(parseISO(review.week_start), "'Semana del' d 'de' MMMM yyyy", { locale: es })
  const generatedLabel = format(parseISO(review.generated_at), "d MMM · HH:mm", { locale: es })

  return (
    <div className={cn(
      'rounded-xl border bg-card space-y-4 p-4',
      isLatest ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-border/50'
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold capitalize">{weekLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Generado el {generatedLabel}</p>
        </div>
        {isLatest && (
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-medium">
            Última semana
          </span>
        )}
      </div>

      {review.overall_score !== null && (
        <div className="flex items-center gap-6">
          <ScoreGauge score={review.overall_score} />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Valoración general</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {review.overall_score >= 80 ? '¡Excelente semana! Mantén este ritmo.' :
               review.overall_score >= 60 ? 'Buena semana con margen de mejora.' :
               review.overall_score >= 40 ? 'Semana regular, revisa las recomendaciones.' :
               'Semana difícil. Prioriza la recuperación.'}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <CollapsibleSection
          icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
          title="Análisis de Carga"
          content={review.training_load_analysis}
          defaultOpen={isLatest}
        />
        <CollapsibleSection
          icon={<Lightbulb className="w-4 h-4 text-yellow-400" />}
          title="Recomendaciones"
          content={review.recommendations}
          defaultOpen={isLatest}
        />
        <CollapsibleSection
          icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
          title="Alertas"
          content={review.alerts}
        />
        <CollapsibleSection
          icon={<RotateCcw className="w-4 h-4 text-green-400" />}
          title="Sugerencias de Recuperación"
          content={review.recovery_suggestions}
        />
        <CollapsibleSection
          icon={<Search className="w-4 h-4 text-purple-400" />}
          title="Patrones Detectados"
          content={review.patterns_detected}
        />
      </div>
    </div>
  )
}
