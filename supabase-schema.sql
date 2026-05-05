-- ============================================================
-- Schedule BJJ - Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Semana activa (plan A/B + variante Gi/NoGi)
create table if not exists week_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  week_start date not null,
  plan text not null default 'A' check (plan in ('A','B')),
  gi_nogi_variant text not null default 'nogi' check (gi_nogi_variant in ('gi','nogi')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, week_start)
);

-- 2. Sesiones base del timetable (se puebla via /api/seed)
create table if not exists schedule_sessions (
  id text primary key,
  plan text not null check (plan in ('A','B')),
  day_name text not null,
  start_time time not null,
  end_time time not null,
  title text not null,
  type text not null,
  location text,
  note text,
  is_optional boolean default false,
  sort_order int default 0
);

-- 3. Registro de entrenos (estado + RPE + nota por sesion y dia)
create table if not exists training_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  session_id text references schedule_sessions(id),
  status text check (status in ('done','skipped','modified')),
  rpe int check (rpe between 1 and 10),
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date, session_id)
);

-- 4. Feedback diario
create table if not exists daily_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  energy int not null check (energy between 1 and 5),
  pain int not null check (pain between 0 and 5),
  sleep_hours numeric(3,1) not null check (sleep_hours between 3 and 11),
  fatigue int check (fatigue between 1 and 5),
  notes text,
  plan text check (plan in ('A','B')),
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- 5. Eventos puntuales (citas medicas, festivos, etc.)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  title text not null,
  type text not null check (type in ('appointment','holiday','travel','other')),
  start_time time,
  end_time time,
  note text,
  ai_suggestion text,
  created_at timestamptz default now()
);

-- 6. Valoraciones semanales generadas por Groq
create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  week_start date not null,
  summary text not null,
  load_recommendation text,
  lifestyle_recommendation text,
  overtraining_alert boolean default false,
  raw_data jsonb,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table week_configs enable row level security;
alter table schedule_sessions enable row level security;
alter table training_logs enable row level security;
alter table daily_feedback enable row level security;
alter table events enable row level security;
alter table weekly_reviews enable row level security;

-- week_configs: solo el propio usuario
create policy "Users can manage their week configs"
  on week_configs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- schedule_sessions: lectura publica (son datos estaticos del horario)
create policy "Anyone can read schedule sessions"
  on schedule_sessions for select
  using (true);

create policy "Authenticated users can upsert schedule sessions"
  on schedule_sessions for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update schedule sessions"
  on schedule_sessions for update
  using (auth.role() = 'authenticated');

-- training_logs: solo el propio usuario
create policy "Users can manage their training logs"
  on training_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- daily_feedback: solo el propio usuario
create policy "Users can manage their daily feedback"
  on daily_feedback for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- events: solo el propio usuario
create policy "Users can manage their events"
  on events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- weekly_reviews: solo el propio usuario
create policy "Users can manage their weekly reviews"
  on weekly_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
