'use client';

import { TYPES } from '@/lib/schedule/data';

interface Props {
  hidden: Set<string>;
  onToggle: (type: string) => void;
}

export default function FilterChips({ hidden, onToggle }: Props) {
  return (
    <div className="filters" aria-label="Filtros de tipo">
      {Object.entries(TYPES).map(([key, info]) => (
        <button
          key={key}
          className={`filter-chip${hidden.has(key) ? ' off' : ''}`}
          style={{ color: info.color }}
          title={`Mostrar/ocultar ${info.label}`}
          onClick={() => onToggle(key)}
        >
          <span className="dot" />
          <span style={{ color: 'var(--text)' }}>{info.label}</span>
        </button>
      ))}
    </div>
  );
}
