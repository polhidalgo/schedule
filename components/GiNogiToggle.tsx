'use client';

import type { GiNogiVariant } from '@/lib/schedule/types';

interface Props {
  current: GiNogiVariant;
  onChange: (v: GiNogiVariant) => void;
  auto?: boolean; // whether it was auto-detected
}

export default function GiNogiToggle({ current, onChange, auto }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {auto && (
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>auto</span>
      )}
      <div className="ginogi-toggle">
        <button
          className={`ginogi-btn${current === 'nogi' ? ' active-nogi' : ''}`}
          onClick={() => onChange('nogi')}
        >
          NoGi
        </button>
        <button
          className={`ginogi-btn${current === 'gi' ? ' active-gi' : ''}`}
          onClick={() => onChange('gi')}
        >
          Gi
        </button>
      </div>
    </div>
  );
}
