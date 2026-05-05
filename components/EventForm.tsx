'use client';

import { useState } from 'react';
import type { ScheduleEvent, EventType } from '@/lib/schedule/types';
import { toDateKey } from '@/lib/schedule/utils';

interface Props {
  onSave: (event: Omit<ScheduleEvent, 'id' | 'user_id' | 'ai_suggestion'>) => Promise<string | null>;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'appointment', label: 'Cita medica' },
  { value: 'holiday', label: 'Festivo' },
  { value: 'travel', label: 'Viaje' },
  { value: 'other', label: 'Otro' },
];

export default function EventForm({ onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('appointment');
  const [date, setDate] = useState(toDateKey());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const suggestion = await onSave({
      title,
      type,
      date,
      start_time: startTime || null,
      end_time: endTime || null,
      note: note.trim() || null,
    });
    setSaving(false);
    if (suggestion) setAiSuggestion(suggestion);
    setTitle(''); setNote(''); setStartTime(''); setEndTime('');
  }

  if (!open) {
    return (
      <button
        className="save-btn"
        style={{ background: 'var(--bg-elev-2)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}
        onClick={() => setOpen(true)}
      >
        + Agregar evento
      </button>
    );
  }

  return (
    <div style={{ background: 'var(--bg-elev-2)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
      <form onSubmit={handleSubmit}>
        <label className="slider-label" style={{ marginBottom: 10, display: 'block' }}>
          Tipo
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {EVENT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`event-type-btn${type === value ? ' active' : ''}`}
                onClick={() => setType(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </label>

        <label className="slider-label" style={{ marginBottom: 10, display: 'block' }}>
          Titulo
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Medico rodilla, reunion trabajo..."
            style={{
              display: 'block', width: '100%', marginTop: 6,
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '7px 10px', fontSize: 13, color: 'var(--text)',
            }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
          <label className="slider-label" style={{ marginBottom: 0 }}>
            Fecha
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', fontSize: 12, color: 'var(--text)' }} />
          </label>
          <label className="slider-label" style={{ marginBottom: 0 }}>
            Desde
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', fontSize: 12, color: 'var(--text)' }} />
          </label>
          <label className="slider-label" style={{ marginBottom: 0 }}>
            Hasta
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 4, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', fontSize: 12, color: 'var(--text)' }} />
          </label>
        </div>

        <label className="textarea-label" style={{ marginBottom: 10 }}>
          Nota (opcional)
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contexto adicional..." />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="save-btn" style={{ flex: 1 }} disabled={saving}>
            {saving ? 'Analizando con IA...' : 'Guardar + Sugerencia IA'}
          </button>
          <button type="button" className="reset-btn" onClick={() => setOpen(false)}>
            Cancelar
          </button>
        </div>
      </form>

      {aiSuggestion && (
        <div className="suggestion" style={{ marginTop: 12 }}>
          <strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Sugerencia IA
          </strong>
          <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{aiSuggestion}</div>
        </div>
      )}
    </div>
  );
}
