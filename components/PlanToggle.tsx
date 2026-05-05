'use client';

import type { PlanId } from '@/lib/schedule/types';

interface Props {
  current: PlanId;
  onChange: (p: PlanId) => void;
}

export default function PlanToggle({ current, onChange }: Props) {
  return (
    <div className="plan-toggle" role="tablist" aria-label="Plan activo">
      {(['A', 'B'] as PlanId[]).map((p) => (
        <button
          key={p}
          type="button"
          className={`plan-btn${current === p ? ' active' : ''}`}
          role="tab"
          aria-selected={current === p}
          onClick={() => onChange(p)}
        >
          {p === 'A' ? 'Plan A · Saludable' : 'Plan B · Lesion'}
        </button>
      ))}
    </div>
  );
}
