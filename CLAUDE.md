# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # serve production build
```

No test runner is configured.

## Architecture

**Personal BJJ training planner** — daily/weekly schedule, session logs, AI-generated reviews. All UI text is in Spanish.

### Stack
- **Next.js 16** App Router, **React 19**, **TypeScript 5**, **Tailwind CSS 4** (no `tailwind.config.*` — configured via PostCSS only)
- **Supabase** — auth (email/password with SSR cookies) + PostgreSQL database (raw SQL via Supabase client, no ORM)
- **Groq** (`llama-3.3-70b-versatile`) — streaming chat, weekly review generation, session suggestions

### Routing
Two layout groups under `app/`:
- `(auth)/login` — public
- `(app)/` — protected; layout enforces auth. Pages: `/week` (main), `/logs`, `/review`, `/chat`

Auth middleware lives in **`proxy.ts`** (exported as `proxy()`, not a `middleware.ts` file). It redirects unauthenticated users to `/login` and authenticated users away from `/login`.

### Data layer
`supabase-schema.sql` is the authoritative schema. Key tables:
- `schedule_sessions` — static seed data (seeded via `POST /api/seed`)
- `week_configs` — active plan (A or B) + Gi/NoGi variant per week
- `training_logs` — per-session status, RPE, notes; references either `schedule_sessions.id` or `extra_sessions.id`
- `daily_feedback` — energy, pain, sleep, fatigue
- `extra_sessions` — ad-hoc sessions added by the user
- `user_preferences` — hidden session types (default: `work`, `commute`)

All tables use Supabase RLS for user isolation.

### Schedule logic
`lib/schedule/data.ts` — defines **Plan A** (healthy) and **Plan B** (meniscus injury accommodation) as TypeScript arrays. Seeded into `schedule_sessions` at runtime.

`lib/schedule/utils.ts` — `getGiNogiVariant()` determines the current Gi/NoGi week by comparing against a fixed reference date (`2026-05-04`); this drives automatic week alternation with no manual toggle.

### AI integration
`lib/groq/client.ts` exports the Groq client, the model constant, and `SYSTEM_CONTEXT` — a detailed system prompt embedding Pol's full schedule, personal context (work schedule, locations, commute), and training science thresholds. All API routes under `app/api/groq/` require auth and use this context.

### Environment variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GROQ_API_KEY          # server-only
```
