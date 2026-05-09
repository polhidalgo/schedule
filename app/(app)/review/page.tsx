'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WeeklyReviewCard } from '@/components/review/WeeklyReviewCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Brain, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { WeeklyReview } from '@/lib/schedule/types'
import { getMondayOfWeek, formatDateKey } from '@/lib/schedule/utils'
import { subWeeks } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

function useWeeklyReviews() {
  return useQuery<WeeklyReview[]>({
    queryKey: ['weekly-reviews'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(10)
      if (error) throw error
      return data ?? []
    },
  })
}

export default function ReviewPage() {
  const { data: reviews, isLoading } = useWeeklyReviews()
  const qc = useQueryClient()

  const generateReview = useMutation({
    mutationFn: async (weekStart?: string) => {
      const res = await fetch('/api/groq/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error generando revisión')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Revisión generada correctamente')
      qc.invalidateQueries({ queryKey: ['weekly-reviews'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const lastWeekStart = formatDateKey(getMondayOfWeek(subWeeks(new Date(), 1)))

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h1 className="font-semibold">Revisión Semanal IA</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => generateReview.mutate(lastWeekStart)}
          disabled={generateReview.isPending}
          className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10"
        >
          {generateReview.isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />}
          Generar
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 max-w-2xl mx-auto w-full space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : reviews && reviews.length > 0 ? (
          reviews.map((review, i) => (
            <WeeklyReviewCard
              key={review.id}
              review={review}
              isLatest={i === 0}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Sin revisiones aún</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Las revisiones se generan automáticamente cada domingo a las 21:00, o puedes generarla manualmente.
              </p>
            </div>
            <Button
              onClick={() => generateReview.mutate(lastWeekStart)}
              disabled={generateReview.isPending}
              className="gap-2"
            >
              {generateReview.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Brain className="w-4 h-4" />}
              Generar primera revisión
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
