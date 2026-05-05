'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/week');
      router.refresh();
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 32,
        boxShadow: 'var(--shadow)',
      }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 20 }}>Schedule BJJ</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--text-dim)', fontSize: 13 }}>
          Inicia sesion para continuar
        </p>

        <form onSubmit={handleLogin}>
          <label className="slider-label" style={{ marginBottom: 14, display: 'block' }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="pol@example.com"
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                background: 'var(--bg-elev-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 13,
                color: 'var(--text)',
              }}
            />
          </label>

          <label className="slider-label" style={{ marginBottom: 20, display: 'block' }}>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                background: 'var(--bg-elev-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 13,
                color: 'var(--text)',
              }}
            />
          </label>

          {error && (
            <p style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 12,
              color: 'var(--danger)',
              marginBottom: 14,
            }}>
              {error}
            </p>
          )}

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
