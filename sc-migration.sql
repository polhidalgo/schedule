-- =============================================================
-- S&C Program Tracking — Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zuitpxgqijfythjmwytw/sql/new
-- =============================================================

-- Exercise catalogue (shared, no RLS — all authenticated users can read)
CREATE TABLE IF NOT EXISTS sc_exercises_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  requires_weight BOOLEAN NOT NULL DEFAULT true,
  unit            TEXT CHECK (unit IN ('kg','lb'))
);

-- Programs (one per user, multiple allowed, max 1 active)
CREATE TABLE IF NOT EXISTS sc_programs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  total_weeks   INT  NOT NULL CHECK (total_weeks > 0),
  days_per_week INT  NOT NULL CHECK (days_per_week BETWEEN 1 AND 7),
  start_date    DATE,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  is_deleted    BOOLEAN NOT NULL DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Weeks within a program
CREATE TABLE IF NOT EXISTS sc_weeks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID NOT NULL REFERENCES sc_programs(id) ON DELETE CASCADE,
  week_number INT  NOT NULL CHECK (week_number > 0),
  phase_name  TEXT,
  rpe_target  TEXT,
  notes       TEXT,
  UNIQUE (program_id, week_number)
);

-- Planned exercises per session × week
CREATE TABLE IF NOT EXISTS sc_program_exercises (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id        UUID NOT NULL REFERENCES sc_weeks(id) ON DELETE CASCADE,
  session_number INT  NOT NULL CHECK (session_number > 0),
  exercise_id    UUID NOT NULL REFERENCES sc_exercises_catalog(id),
  sets           INT  NOT NULL CHECK (sets > 0),
  reps_target    TEXT NOT NULL,
  weight_target  NUMERIC CHECK (weight_target >= 0),
  rpe_target     TEXT,
  sort_order     INT  NOT NULL DEFAULT 0,
  notes          TEXT
);

-- Session logs (one per strength training timetable session)
CREATE TABLE IF NOT EXISTS sc_session_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id           UUID NOT NULL REFERENCES sc_programs(id),
  week_number          INT  NOT NULL,
  session_number       INT  NOT NULL,
  timetable_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  attended             BOOLEAN NOT NULL DEFAULT true,
  notes                TEXT,
  completed_at         TIMESTAMPTZ DEFAULT now()
);

-- Individual set logs
CREATE TABLE IF NOT EXISTS sc_set_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id UUID NOT NULL REFERENCES sc_session_logs(id) ON DELETE CASCADE,
  exercise_id    UUID NOT NULL REFERENCES sc_exercises_catalog(id),
  set_number     INT  NOT NULL,
  weight_used    NUMERIC CHECK (weight_used >= 0),
  reps_completed INT  CHECK (reps_completed >= 0),
  completed      BOOLEAN NOT NULL DEFAULT true,
  notes          TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sc_programs_user       ON sc_programs (user_id);
CREATE INDEX IF NOT EXISTS idx_sc_programs_active     ON sc_programs (user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sc_weeks_program       ON sc_weeks (program_id);
CREATE INDEX IF NOT EXISTS idx_sc_prog_ex_week        ON sc_program_exercises (week_id, session_number);
CREATE INDEX IF NOT EXISTS idx_sc_sess_logs_user      ON sc_session_logs (user_id, program_id, week_number);
CREATE INDEX IF NOT EXISTS idx_sc_set_logs_session    ON sc_set_logs (session_log_id);

-- Trigger: max 1 active program per user
CREATE OR REPLACE FUNCTION enforce_single_active_sc_program()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE sc_programs
    SET is_active = false
    WHERE user_id = NEW.user_id AND id <> NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS single_active_sc_program ON sc_programs;
CREATE TRIGGER single_active_sc_program
  AFTER INSERT OR UPDATE ON sc_programs
  FOR EACH ROW EXECUTE FUNCTION enforce_single_active_sc_program();

-- RLS
ALTER TABLE sc_exercises_catalog  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_programs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_weeks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_program_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_session_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_set_logs           ENABLE ROW LEVEL SECURITY;

-- Catalog: any authenticated user can read
CREATE POLICY "read catalog" ON sc_exercises_catalog FOR SELECT TO authenticated USING (true);

-- Programs: own data only
CREATE POLICY "own programs"  ON sc_programs  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own weeks"     ON sc_weeks     USING (program_id IN (SELECT id FROM sc_programs WHERE user_id = auth.uid()));
CREATE POLICY "own prog_ex"   ON sc_program_exercises USING (
  week_id IN (
    SELECT w.id FROM sc_weeks w
    JOIN sc_programs p ON p.id = w.program_id
    WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "own sess_logs" ON sc_session_logs USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own set_logs"  ON sc_set_logs USING (
  session_log_id IN (SELECT id FROM sc_session_logs WHERE user_id = auth.uid())
);

-- =============================================================
-- Seed: exercise catalogue
-- =============================================================
INSERT INTO sc_exercises_catalog (name, requires_weight, unit) VALUES
  -- Strength (require weight)
  ('Trap bar deadlift',              true,  'kg'),
  ('Front squat',                    true,  'kg'),
  ('Back squat',                     true,  'kg'),
  ('Box squat',                      true,  'kg'),
  ('Zercher squat',                  true,  'kg'),
  ('Bench press',                    true,  'kg'),
  ('Floor press explosivo',          true,  'kg'),
  ('DB incline press',               true,  'kg'),
  ('Landmine press',                 true,  'kg'),
  ('Landmine press explosivo',       true,  'kg'),
  ('Weighted pull-up',               true,  'kg'),
  ('Chest supported row',            true,  'kg'),
  ('Rear foot elevated split squat', true,  'kg'),
  ('Single leg RDL',                 true,  'kg'),
  ('Safety bar squat',               true,  'kg'),
  ('Belt squat',                     true,  'kg'),
  ('RDL con barra',                  true,  'kg'),
  ('Deadlift desde bloques',         true,  'kg'),
  ('Chin-up lastrado',               true,  'kg'),
  ('Pulldown pesado',                true,  'kg'),
  ('Split squat normal',             true,  'kg'),
  ('Step-up',                        true,  'kg'),
  ('Seal row',                       true,  'kg'),
  ('Cable row',                      true,  'kg'),
  ('Ring push-up lastrado',          true,  'kg'),
  ('DB floor press',                 true,  'kg'),
  ('Trap bar jump',                  true,  'kg'),
  ('Jump squat con DB',              true,  'kg'),
  ('Iso-explode split squat',        true,  'kg'),
  ('Suitcase carry',                 true,  'kg'),
  ('Farmer''s carry',                true,  'kg'),
  ('Pallof press',                   true,  'kg'),
  -- Power / Plyometric (no weight)
  ('Broad jump',                     false, null),
  ('Box jump',                       false, null),
  ('Med ball chest pass',            false, null),
  ('Med ball scoop toss',            false, null),
  ('Rotational med ball throw',      false, null),
  ('Skater bound',                   false, null),
  ('Lateral bound',                  false, null),
  ('Reactive lateral bound',         false, null),
  ('Sprint 10m',                     false, null),
  ('Sprint 15m',                     false, null),
  -- Accessory / Bodyweight
  ('Chin-up',                        false, null),
  ('Ring push-up',                   false, null),
  ('Copenhagen plank',               false, null),
  -- Other
  ('Movilidad dinámica',             false, null),
  ('Aceleraciones submáximas',       false, null)
ON CONFLICT (name) DO NOTHING;
