import { SYSTEM_CONTEXT, groq, GROQ_MODEL } from '@/lib/groq/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  try {
    const { messages } = await request.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_CONTEXT },
        ...messages,
      ],
      max_tokens: 500,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (streamErr) {
          console.error('[groq/chat] stream error', streamErr);
          controller.error(streamErr);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    console.error('[groq/chat]', err);
    return new Response('Error al procesar la consulta', { status: 500 });
  }
}
