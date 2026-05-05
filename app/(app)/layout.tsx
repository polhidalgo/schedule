export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div>
      <header className="topbar">
        <div className="brand">
          <h1>Schedule semanal</h1>
          <span className="subtitle">BJJ / NoGi / Strength</span>
        </div>
        <nav className="nav-desktop" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Link href="/week" className="nav-link">Semana</Link>
          <Link href="/review" className="nav-link">Review</Link>
          <Link href="/chat" className="nav-link">Asistente</Link>
          <LogoutButton />
        </nav>
      </header>
      {children}
    </div>
  );
}
