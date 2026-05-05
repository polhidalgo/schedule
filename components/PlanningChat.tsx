'use client';

import { useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function PlanningChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hola! Soy tu asistente de planificacion. Puedo ayudarte a reorganizar sesiones, evaluar carga, o responder preguntas sobre tu rutina. Que necesitas?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/groq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error('Error en la respuesta');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream');

      let assistantText = '';
      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantText += chunk;
        setMessages([...newMessages, { role: 'assistant', content: assistantText }]);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Error al conectar con el asistente. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-bubble ${m.role}`}
          >
            {m.content || (loading && i === messages.length - 1 ? '...' : '')}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: el jueves tengo medico a las 18h..."
          disabled={loading}
          style={{
            flex: 1, background: 'var(--bg-elev-2)',
            border: '1px solid var(--border)', borderRadius: 6,
            padding: '8px 12px', fontSize: 13, color: 'var(--text)',
          }}
        />
        <button className="save-btn" type="submit" disabled={loading || !input.trim()} style={{ width: 'auto', padding: '8px 16px' }}>
          {loading ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
