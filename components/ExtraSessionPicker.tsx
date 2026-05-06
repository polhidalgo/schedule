'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TYPES } from '@/lib/schedule/data';
import type { SessionCatalogItem } from '@/lib/schedule/types';
import type { DayName } from '@/lib/schedule/data';

interface Props {
  day: DayName;
  weekStart: string;
  onClose: () => void;
  onSaved: () => void;
}

const TRAINING_TYPES = ['nogi', 'gi', 'wrestling', 'judo', 'strength', 'conditioning', 'recovery'];

export default function ExtraSessionPicker({ day, weekStart, onClose, onSaved }: Props) {
  const supabase = createClient();
  const backdropRef = useRef<HTMLDivElement>(null);

  const [catalog, setCatalog] = useState<SessionCatalogItem[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('session_catalog')
      .select('*')
      .eq('is_active', true)
      .in('type', TRAINING_TYPES)
      .order('type')
      .then(({ data }) => {
        setCatalog(data ?? []);
        setLoading(false);
      });
  }, [supabase]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Compute the ISO date for the chosen day in this week
  function dayToDate(dayName: DayName): string {
    const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
    const idx = DAYS.indexOf(dayName);
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + Math.max(0, idx));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const date = dayToDate(day);
    await supabase.from('extra_sessions').insert({
      user_id: user.id,
      date,
      week_start: weekStart,
      catalog_id: selected,
      start_time: startTime || null,
      end_time: endTime || null,
      note: note.trim() || null,
    });

    setSaving(false);
    onSaved();
    onClose();
  }

  // Group catalog by type for display
  const grouped: Record<string, SessionCatalogItem[]> = {};
  for (const item of catalog) {
    if (!grouped[item.type]) grouped[item.type] = [];
    grouped[item.type].push(item);
  }

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal aria-labelledby="picker-title">
        <header>
          <h3 id="picker-title">Agregar sesion · {day}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">&times;</button>
        </header>

        <div className="modal-body">
          {loading ? (
            <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 20 }}>
              Cargando...
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>
                  Tipo de sesion
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                  {Object.entries(grouped).map(([type, items]) => (
                    <div key={type}>
                      <div style={{
                        fontSize: 11, color: TYPES[type]?.color ?? 'var(--text-faint)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        padding: '4px 0 2px',
                      }}>
                        {TYPES[type]?.label ?? type}
                      </div>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelected(item.id)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '7px 10px', borderRadius: 6, fontSize: 13,
                            background: selected === item.id
                              ? `${TYPES[item.type]?.color ?? 'var(--accent)'}22`
                              : 'var(--bg-elev)',
                            border: selected === item.id
                              ? `1px solid ${TYPES[item.type]?.color ?? 'var(--accent)'}`
                              : '1px solid var(--border)',
                            color: selected === item.id
                              ? (TYPES[item.type]?.color ?? 'var(--accent)')
                              : 'var(--text)',
                            marginBottom: 3,
                            transition: 'var(--transition)',
                          }}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <label style={{ flex: 1, fontSize: 12, color: 'var(--text-dim)' }}>
                  Hora inicio
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      display: 'block', width: '100%', marginTop: 4,
                      background: 'var(--bg-elev)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '6px 8px', color: 'var(--text)',
                    }}
                  />
                </label>
                <label style={{ flex: 1, fontSize: 12, color: 'var(--text-dim)' }}>
                  Hora fin
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      display: 'block', width: '100%', marginTop: 4,
                      background: 'var(--bg-elev)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '6px 8px', color: 'var(--text)',
                    }}
                  />
                </label>
              </div>

              <label className="textarea-label">
                Nota (opcional)
                <textarea
                  rows={2}
                  placeholder="Motivo, detalles..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>

              <button
                className="save-btn"
                onClick={handleSave}
                disabled={!selected || saving}
                style={{ opacity: !selected ? 0.5 : 1 }}
              >
                {saving ? 'Guardando...' : 'Agregar sesion'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
