export const dynamic = 'force-dynamic';

import PlanningChat from '@/components/PlanningChat';

export default function ChatPage() {
  return (
    <main style={{ padding: 18, maxWidth: 800, margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Asistente de planificacion</h2>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'var(--bg-elev)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 18, overflow: 'hidden',
      }}>
        <PlanningChat />
      </div>
    </main>
  );
}
