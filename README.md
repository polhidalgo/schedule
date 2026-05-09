# Training Schedule App

Web app for managing BJJ/grappling training timetables, session logging, wellness tracking, and AI-powered weekly reviews.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Supabase** (PostgreSQL + Auth)
- **Groq API** (llama-3.3-70b-versatile)
- **Recharts** for statistics
- **Vercel** for deployment + Cron Jobs

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in the SQL editor
3. Copy your project URL and anon key

### 2. Environment Variables

Copy `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_api_key
CRON_SECRET=any_random_secret_string
```

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. First login

1. Go to `/login`, create an account
2. Visit `/week` — default templates (Timetable A & B) are auto-seeded on first visit
3. Register sessions, log daily wellness, and generate your first AI weekly review

## Features

### Timetable Management
- **Timetable A** (full training week) and **Timetable B** (recovery week) are pre-configured
- Switch between A/B at any time — future sessions in the current week are replaced
- Every Monday at 00:00 UTC, a new week is auto-created from your active template

### Session Logging (post-session)
- RPE, fatigue, technical quality (1-10 scales)
- Intensity, sparring rounds, techniques practiced
- Injuries/notes, general notes
- Mark as attended or not

### Daily Wellness
- Stress, fatigue, pain, sleep quality (1-10)
- Mood selector
- Body weight and hydration tracking
- Free-form daily notes

### Sleep Tracking
- "Go to sleep" / "Wake up" buttons with live timer
- Automatic duration calculation
- 14-day sleep history

### Statistics Dashboard
- Activity heatmap (90 days)
- Attendance by session type
- RPE and fatigue by training type
- Sleep trend chart
- Weight evolution chart
- Range selector: 7d / 30d / 90d

### AI Weekly Review (Groq)
- Auto-generated every Sunday at 21:00 UTC
- Overall score (0-100)
- Training load analysis
- Recommendations for next week
- Alerts for overtraining/undertraining
- Recovery suggestions
- Pattern detection

## Deployment (Vercel)

1. Connect your GitHub repo to Vercel
2. Add all environment variables in Vercel project settings
3. Deploy — Cron Jobs in `vercel.json` are automatically configured

## Cron Jobs

| Schedule | Route | Description |
|----------|-------|-------------|
| Every Monday 00:00 UTC | `/api/cron/weekly-reset` | Creates new week from active template |
| Every Sunday 21:00 UTC | `/api/cron/weekly-review` | Generates AI weekly review |

Both endpoints are protected with `CRON_SECRET`.
