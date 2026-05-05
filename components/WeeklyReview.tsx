'use client';

import { useState } from 'react';
import type { WeeklyReview as WeeklyReviewType } from '@/lib/schedule/types';

interface Props {
  review: WeeklyReviewType | null;
  weekStart: string;
  onGenerate: () => Promise<void>;
  generating: boolean;
}

export default function WeeklyReview({ review, weekStart, onGenerate, generating }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {!review ? (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
            Genera la valoracion de la semana del {weekStart} con los datos registrados.
          </p>
          <button className="save-btn" onClick={onGenerate} disabled={generating}>
            {generating ? 'Analizando con Groq...' : 'Generar valoracion semanal'}
          </button>
        </div>
      ) : (
        <div>
          {review.overtraining_alert && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6, padding: '8px 12px',
              color: 'var(--danger)', fontSize: 13,
              marginBottom: 12, fontWeight: 600,
            }}>
              Alerta: posible sobreentrenamiento detectado
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 4 }}>Resumen</div>
            <p style={{ fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{review.summary}</p>
          </div>

          {review.load_recommendation && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 4 }}>Carga proxima semana</div>
              <p style={{ fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{review.load_recommendation}</p>
            </div>
          )}

          {review.lifestyle_recommendation && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 4 }}>Estilo de vida</div>
              <p style={{ fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{review.lifestyle_recommendation}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="save-btn" onClick={onGenerate} disabled={generating} style={{ flex: 1 }}>
              {generating ? 'Regenerando...' : 'Regenerar'}
            </button>
            {review.raw_data && (
              <button
                className="reset-btn"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Ocultar datos' : 'Ver datos'}
              </button>
            )}
          </div>

          {expanded && review.raw_data && (
            <pre style={{
              marginTop: 12, fontSize: 10, color: 'var(--text-dim)',
              background: 'var(--bg-elev-2)', padding: 10, borderRadius: 6,
              overflow: 'auto', maxHeight: 300,
            }}>
              {JSON.stringify(review.raw_data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
