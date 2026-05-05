'use client';

import { useState } from 'react';
import type { DailyFeedback, PlanId } from '@/lib/schedule/types';

interface Props {
  initial?: DailyFeedback | null;
  currentPlan: PlanId;
  onSave: (fb: Omit<DailyFeedback, 'id' | 'user_id' | 'date'>) => Promise<void>;
}

function getSuggestions(energy: number, pain: number, sleep: number): string[] {
  const tips: string[] = [];
  if (pain >= 3) tips.push('Dolor alto: cambia a Plan B y avisa al instructor. Solo drilling, sin sparring.');
  if (energy <= 2) tips.push('Energia baja: salta Advanced. Si es dia DOBLE, haz solo la primera sesion.');
  if (sleep < 6) tips.push('Sueno bajo: descansa fuerza/HIIT manana. Acuestate antes esta noche.');
  if (energy === 5 && pain === 0) tips.push('Estas a tope: aprovecha para sparring, pero no sobrepases tus rondas.');
  return tips;
}

export default function FeedbackForm({ initial, currentPlan, onSave }: Props) {
  const [energy, setEnergy] = useState(initial?.energy ?? 3);
  const [pain, setPain] = useState(initial?.pain ?? 0);
  const [sleep, setSleep] = useState(initial?.sleep_hours ?? 7);
  const [fatigue, setFatigue] = useState(initial?.fatigue ?? 3);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const tips = getSuggestions(energy, pain, sleep);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ energy, pain, sleep_hours: sleep, fatigue, notes: notes.trim() || null, plan: currentPlan });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="slider-label">
        Energia <span className="slider-val">{energy}</span>/5
        <input type="range" min={1} max={5} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} />
      </label>

      <label className="slider-label">
        Dolor rodilla <span className="slider-val">{pain}</span>/5
        <input type="range" min={0} max={5} value={pain} onChange={(e) => setPain(Number(e.target.value))} />
      </label>

      <label className="slider-label">
        Sueno (horas) <span className="slider-val">{sleep}</span>h
        <input type="range" min={3} max={11} step={0.5} value={sleep} onChange={(e) => setSleep(Number(e.target.value))} />
      </label>

      <label className="slider-label">
        Fatiga general <span className="slider-val">{fatigue}</span>/5
        <input type="range" min={1} max={5} value={fatigue} onChange={(e) => setFatigue(Number(e.target.value))} />
      </label>

      <label className="textarea-label">
        Notas
        <textarea
          rows={3}
          placeholder="Como te encuentras, cambios, sensaciones..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {tips.length > 0 && (
        <div className="suggestion">
          {tips.map((t, i) => <div key={i}>- {t}</div>)}
        </div>
      )}

      <button
        type="submit"
        className="save-btn"
        disabled={saving}
        style={saved ? { background: 'var(--success)' } : undefined}
      >
        {saved ? 'Guardado!' : saving ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}
