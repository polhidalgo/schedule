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

-- ============================================================
-- 7. Catalogo de sesiones (tipos disponibles para sesiones extra)
-- ============================================================
create table if not exists session_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  is_active boolean default true
);

-- Datos iniciales del catalogo
insert into session_catalog (name, type) values
  ('No Gi Advanced',       'nogi'),
  ('No Gi Fundamentals',   'nogi'),
  ('No Gi Intermediate',   'nogi'),
  ('No Gi Open Mat',       'nogi'),
  ('Positional No Gi',     'nogi'),
  ('Gi Advanced',          'gi'),
  ('Gi Fundamentals',      'gi'),
  ('Gi Open Mat',          'gi'),
  ('Positional Gi',        'gi'),
  ('Wrestling',            'wrestling'),
  ('Wrestling Fundamentals','wrestling'),
  ('Judo for BJJ',         'judo'),
  ('Fuerza',               'strength'),
  ('Tren Superior',        'strength'),
  ('Acondicionamiento',    'conditioning'),
  ('Cardio bajo impacto',  'conditioning'),
  ('Recovery',             'recovery'),
  ('Movilidad',            'recovery')
on conflict do nothing;

-- 8. Sesiones extra (ad-hoc por usuario y semana)
create table if not exists extra_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null,
  week_start  date not null,
  catalog_id  uuid references session_catalog(id),
  start_time  time,
  end_time    time,
  note        text,
  created_at  timestamptz default now()
);

-- 9. Preferencias de usuario (filtros y configuracion de UI persistida)
create table if not exists user_preferences (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  hidden_types text[] default '{}',
  updated_at   timestamptz default now()
);

-- Extender training_logs para soportar sesiones extra
alter table training_logs
  add column if not exists extra_session_id uuid references extra_sessions(id) on delete cascade;

-- Indice unico parcial para logs de sesiones extra (reemplaza la restriccion de session_id=null)
create unique index if not exists training_logs_extra_unique
  on training_logs(user_id, date, extra_session_id)
  where extra_session_id is not null;

-- ============================================================
-- RLS para nuevas tablas
-- ============================================================
alter table session_catalog  enable row level security;
alter table extra_sessions   enable row level security;
alter table user_preferences enable row level security;

-- session_catalog: lectura publica, gestion por usuarios autenticados
create policy "Anyone can read session catalog"
  on session_catalog for select
  using (true);

create policy "Authenticated users can manage session catalog"
  on session_catalog for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- extra_sessions: solo el propio usuario
create policy "Users can manage their extra sessions"
  on extra_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_preferences: solo el propio usuario
create policy "Users can manage their preferences"
  on user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
