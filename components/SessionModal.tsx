'use client';

import { useEffect, useRef, useState } from 'react';
import { TYPES } from '@/lib/schedule/data';
import type { ScheduleSession, SessionStatus, TrainingLog } from '@/lib/schedule/types';

interface Props {
  session: ScheduleSession | null;
  log?: TrainingLog | null;
  onClose: () => void;
  onSave: (update: { status?: SessionStatus | null; rpe?: number | null; note?: string | null }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const STATUS_OPTIONS: { value: SessionStatus | ''; label: string }[] = [
  { value: 'done', label: 'Hecho' },
  { value: 'modified', label: 'Modificado' },
  { value: 'skipped', label: 'Saltado' },
  { value: '', label: 'Limpiar' },
];

export default function SessionModal({ session, log, onClose, onSave, onDelete }: Props) {
  const [status, setStatus] = useState<SessionStatus | ''>('');
  const [rpe, setRpe] = useState<number>(5);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;
    setStatus((log?.status as SessionStatus) ?? '');
    setRpe(log?.rpe ?? 5);
    setNote(log?.note ?? '');
  }, [session, log]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!session) return null;

  const color = TYPES[session.type]?.color ?? 'var(--accent)';

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    onClose();
  }

  async function handleSave() {
    setSaving(true);
    await onSave({
      status: status || null,
      rpe: status === 'done' || status === 'modified' ? rpe : null,
      note: note.trim() || null,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        style={{ '--type-color': color } as React.CSSProperties}
      >
        <header>
          <h3 id="modal-title">{session.title}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">&times;</button>
        </header>

        <div className="modal-body">
          <p className="modal-meta">
            {session.start && session.end ? `${session.start} - ${session.end}` : ''}
            {session.location ? ` · ${session.location}` : ''}
            {' · '}{TYPES[session.type]?.label ?? session.type}
            {session.isExtra && (
              <span style={{
                marginLeft: 8, fontSize: 10, padding: '1px 6px',
                borderRadius: 4, background: 'var(--bg-elev-2)',
                color: 'var(--text-dim)', border: '1px solid var(--border)',
              }}>
                extra
              </span>
            )}
          </p>

          {session.note && <p className="modal-note">{session.note}</p>}

          <div className="status-buttons">
            {STATUS_OPTIONS.map(({ value, label }) => {
              const activeClass = value && status === value ? ` active-${value}` : '';
              return (
                <button
                  key={value}
                  className={`status-btn${activeClass}`}
                  onClick={() => setStatus(value)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {(status === 'done' || status === 'modified') && (
            <label className="slider-label">
              RPE <span className="slider-val">{rpe}</span>/10
              <input
                type="range"
                className="rpe-slider"
                min={1} max={10}
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
              />
            </label>
          )}

          <label className="textarea-label">
            Nota de la sesion
            <textarea
              rows={3}
              placeholder="Como fue, que trabajaste, sensaciones..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <button className="save-btn" onClick={handleSave} disabled={saving || deleting}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>

          {session.isExtra && onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              style={{
                width: '100%', marginTop: 8, padding: '9px 0',
                background: 'transparent', border: '1px solid var(--danger)',
                borderRadius: 8, color: 'var(--danger)', fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {deleting ? 'Eliminando...' : 'Eliminar sesion extra'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
