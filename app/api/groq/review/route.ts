import { NextResponse } from 'next/server';
import { groq, GROQ_MODEL, SYSTEM_CONTEXT } from '@/lib/groq/client';

export async function POST(request: Request) {
  try {
    const { weekStart, logs, feedback, events } = await request.json();

    const totalSessions = logs?.length ?? 0;
    const doneSessions = logs?.filter((l: { status: string }) => l.status === 'done' || l.status === 'modified').length ?? 0;
    const skippedSessions = logs?.filter((l: { status: string }) => l.status === 'skipped').length ?? 0;

    const avgRpe = logs?.length
      ? (logs.filter((l: { rpe?: number }) => l.rpe != null).reduce((sum: number, l: { rpe?: number }) => sum + (l.rpe ?? 0), 0) /
         Math.max(1, logs.filter((l: { rpe?: number }) => l.rpe != null).length)).toFixed(1)
      : 'N/A';

    const avgSleep = feedback?.length
      ? (feedback.reduce((sum: number, f: { sleep_hours: number }) => sum + f.sleep_hours, 0) / feedback.length).toFixed(1)
      : 'N/A';

    const avgEnergy = feedback?.length
      ? (feedback.reduce((sum: number, f: { energy: number }) => sum + f.energy, 0) / feedback.length).toFixed(1)
      : 'N/A';

    const avgPain = feedback?.length
      ? (feedback.reduce((sum: number, f: { pain: number }) => sum + f.pain, 0) / feedback.length).toFixed(1)
      : 'N/A';

    const highRpeDays = logs?.filter((l: { rpe?: number }) => (l.rpe ?? 0) >= 8).length ?? 0;
    const lowSleepDays = feedback?.filter((f: { sleep_hours: number }) => f.sleep_hours < 6).length ?? 0;
    const lowEnergyDays = feedback?.filter((f: { energy: number }) => f.energy <= 2).length ?? 0;
    const highPainDays = feedback?.filter((f: { pain: number }) => f.pain >= 3).length ?? 0;

    const sessionNotes = logs
      ?.filter((l: { note?: string }) => l.note)
      .map((l: { session_id: string; date: string; note?: string; rpe?: number }) =>
        `[${l.date}] ${l.session_id}: RPE ${l.rpe ?? '?'} - ${l.note}`)
      .join('\n') || 'Sin notas de sesiones';

    const userPrompt = `
Valoracion de la semana del ${weekStart}:

DATOS OBJETIVOS:
- Sesiones completadas: ${doneSessions}/${totalSessions} (${skippedSessions} saltadas)
- RPE promedio: ${avgRpe}/10
- Sueno promedio: ${avgSleep}h
- Energia promedio: ${avgEnergy}/5
- Dolor de rodilla promedio: ${avgPain}/5
- Sesiones con RPE >=8: ${highRpeDays}
- Dias con sueno <6h: ${lowSleepDays}
- Dias con energia <=2: ${lowEnergyDays}
- Dias con dolor >=3: ${highPainDays}

NOTAS DE SESIONES:
${sessionNotes}

EVENTOS ESPECIALES:
${events?.map((e: { date: string; title: string; type: string }) => `- ${e.date}: ${e.title} (${e.type})`).join('\n') || 'Ninguno'}

Genera una valoracion estructurada en JSON con exactamente estos campos:
{
  "summary": "resumen de la semana en 3-4 oraciones",
  "load_recommendation": "recomendacion de carga para la proxima semana en 2-3 oraciones",
  "lifestyle_recommendation": "recomendaciones de sueno y recuperacion en 2 oraciones",
  "overtraining_alert": true/false
}

Solo JSON, sin markdown, sin explicaciones adicionales.
`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_CONTEXT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[groq/review]', err);
    return NextResponse.json({ error: 'Failed to generate review' }, { status: 500 });
  }
}
