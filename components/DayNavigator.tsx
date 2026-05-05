'use client';

import { DAYS } from '@/lib/schedule/data';
import type { DayName } from '@/lib/schedule/data';

interface Props {
  selected: DayName;
  today: DayName;
  onChange: (day: DayName) => void;
}

const DAY_LABELS: Record<string, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miercoles: 'Mie',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sabado: 'Sab',
  Domingo: 'Dom',
};

export default function DayNavigator({ selected, today, onChange }: Props) {
  const currentIdx = DAYS.indexOf(selected as typeof DAYS[number]);

  function prev() {
    const idx = (currentIdx - 1 + DAYS.length) % DAYS.length;
    onChange(DAYS[idx]);
  }

  function next() {
    const idx = (currentIdx + 1) % DAYS.length;
    onChange(DAYS[idx]);
  }

  return (
    <div className="day-navigator">
      <button className="day-nav-arrow" onClick={prev} aria-label="Dia anterior">&#8249;</button>

      <div className="day-navigator-center">
        <span className={`day-navigator-name${selected === today ? ' is-today' : ''}`}>
          {selected}
        </span>
        {selected !== today && (
          <button
            className="day-navigator-today-btn"
            onClick={() => onChange(today)}
          >
            Hoy
          </button>
        )}
      </div>

      <button className="day-nav-arrow" onClick={next} aria-label="Dia siguiente">&#8250;</button>

      {/* Dot indicators */}
      <div className="day-dots">
        {DAYS.map((day) => (
          <button
            key={day}
            className={`day-dot${day === selected ? ' active' : ''}${day === today ? ' today' : ''}`}
            onClick={() => onChange(day)}
            title={day}
            aria-label={day}
          >
            <span className="sr-only">{DAY_LABELS[day]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
