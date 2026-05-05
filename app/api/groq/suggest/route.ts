import { NextResponse } from 'next/server';
import { groq, GROQ_MODEL, SYSTEM_CONTEXT } from '@/lib/groq/client';
import { getSessionsByPlan, DAYS } from '@/lib/schedule/data';
import { createClient } from '@/lib/supabase/server';
import type { PlanId, GiNogiVariant } from '@/lib/schedule/types';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ suggestion: '' }, { status: 401 });

  try {
    const { event, plan, variant } = await request.json() as {
      event: { date: string; title: string; start_time?: string; end_time?: string; note?: string; type: string };
      plan: PlanId;
      variant: GiNogiVariant;
    };

    const schedule = getSessionsByPlan(plan, variant);
    // Compute weekday index numerically to avoid locale/accent issues with toLocaleDateString
    const idx = (new Date(event.date + 'T12:00:00').getDay() + 6) % 7;
    const dayName = DAYS[idx];
    const sessionsToday = (schedule[dayName] ?? [])
      .map((s) => `${s.start}-${s.end}: ${s.title}${s.note ? ` [${s.note}]` : ''}`)
      .join('\n');

    const userPrompt = `
Nuevo evento el ${event.date} (${dayName}):
- Tipo: ${event.type}
- Titulo: ${event.title}
${event.start_time ? `- Hora: ${event.start_time}${event.end_time ? ' - ' + event.end_time : ''}` : ''}
${event.note ? `- Nota: ${event.note}` : ''}

Plan activo: Plan ${plan} | Semana: ${variant}

Sesiones de ese dia (${dayName}):
${sessionsToday || 'Sin sesiones planificadas'}

Como afecta este evento al entrenamiento de ese dia? Que recomendarías hacer o cambiar?
Responde de forma concisa y practica (max 4 lineas). Solo con datos del horario real.
`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_CONTEXT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 300,
    });

    const suggestion = completion.choices[0]?.message?.content ?? '';
    return NextResponse.json({ suggestion });
  } catch (err) {
    console.error('[groq/suggest]', err);
    return NextResponse.json({ suggestion: '' }, { status: 500 });
  }
}
