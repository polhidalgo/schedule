'use client';

export type MobileTab = 'hoy' | 'semana' | 'log' | 'chat';

interface Props {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string; icon: string }[] = [
  { id: 'hoy',    label: 'Hoy',    icon: '◎' },
  { id: 'semana', label: 'Semana', icon: '▦' },
  { id: 'log',    label: 'Log',    icon: '≡' },
  { id: 'chat',   label: 'Chat',   icon: '✦' },
];

export default function MobileNav({ active, onChange }: Props) {
  return (
    <nav className="mobile-nav" role="tablist" aria-label="Navegacion principal">
      {TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={active === id}
          className={`mobile-nav-btn${active === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
        >
          <span className="mobile-nav-icon">{icon}</span>
          <span className="mobile-nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
