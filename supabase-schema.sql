-- Training Schedule App - Supabase Schema
-- Run this in the Supabase SQL editor

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE session_type AS ENUM (
  'bjj_fundamentals',
  'bjj_intermediate',
  'bjj_advanced',
  'grappling_fundamentals',
  'grappling_intermediate',
  'grappling_advanced',
  'grappling_competition',
  'open_mat',
  'judo',
  'wrestling_gi_nogi',
  'positional_training',
  'strength_training',
  'conditioning_training',
  'trayecto',
  'trabajo',
  'medico',
  'fisio'
);

CREATE TYPE activity_category AS ENUM ('training', 'event');
CREATE TYPE intensity_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE mood_level AS ENUM ('very_low', 'low', 'neutral', 'good', 'very_good');
CREATE TYPE timetable_type AS ENUM ('A', 'B');

-- ============================================================
-- TABLES
-- ============================================================

-- Template sessions: define what sessions belong to Timetable A or B
CREATE TABLE template_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timetable timetable_type NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Monday, 6=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type session_type NOT NULL,
  title TEXT NOT NULL,
  category activity_category NOT NULL DEFAULT 'training',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weeks: one row per week per user
CREATE TABLE weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Always a Monday
  active_timetable timetable_type NOT NULL DEFAULT 'A',
  timetable_switched_at TIMESTAMPTZ,
  previous_timetable timetable_type,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- Sessions: actual sessions for a specific week (copied from template + manual changes)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type session_type NOT NULL,
  title TEXT NOT NULL,
  category activity_category NOT NULL DEFAULT 'training',
  is_deleted BOOLEAN NOT NULL DEFAULT false, -- soft-deleted (removed from template copy)
  is_custom BOOLEAN NOT NULL DEFAULT false,  -- manually added (not from template)
  template_session_id UUID REFERENCES template_sessions(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session logs: post-training registration (only for training sessions)
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT true,
  rpe SMALLINT CHECK (rpe BETWEEN 1 AND 10),
  fatigue SMALLINT CHECK (fatigue BETWEEN 1 AND 10),
  technical_quality SMALLINT CHECK (technical_quality BETWEEN 1 AND 10),
  intensity intensity_level,
  injuries_notes TEXT,
  sparring_rounds SMALLINT DEFAULT 0 CHECK (sparring_rounds >= 0),
  techniques_practiced TEXT,
  general_notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id)
);

-- Daily logs: daily wellness tracking
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  stress_level SMALLINT CHECK (stress_level BETWEEN 1 AND 10),
  fatigue_level SMALLINT CHECK (fatigue_level BETWEEN 1 AND 10),
  mood mood_level,
  sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 10),
  pain_level SMALLINT CHECK (pain_level BETWEEN 1 AND 10),
  body_weight DECIMAL(5, 2) CHECK (body_weight > 0),
  hydration_liters DECIMAL(4, 2) CHECK (hydration_liters >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- Sleep logs: sleep start/end tracking
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_start TIMESTAMPTZ NOT NULL,
  sleep_end TIMESTAMPTZ,
  duration_hours DECIMAL(4, 2), -- filled when sleep_end is set
  date DATE, -- date of wake-up (filled on sleep_end)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly AI reviews
CREATE TABLE weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  overall_score SMALLINT CHECK (overall_score BETWEEN 0 AND 100),
  training_load_analysis TEXT,
  recommendations TEXT,
  alerts TEXT,
  recovery_suggestions TEXT,
  patterns_detected TEXT,
  full_response JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_template_sessions_user_timetable ON template_sessions(user_id, timetable);
CREATE INDEX idx_weeks_user_start ON weeks(user_id, week_start DESC);
CREATE INDEX idx_sessions_user_date ON sessions(user_id, date);
CREATE INDEX idx_sessions_week ON sessions(week_id);
CREATE INDEX idx_session_logs_session ON session_logs(session_id);
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date DESC);
CREATE INDEX idx_sleep_logs_user_start ON sleep_logs(user_id, sleep_start DESC);
CREATE INDEX idx_weekly_reviews_user_week ON weekly_reviews(user_id, week_start DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE template_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own template_sessions" ON template_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own weeks" ON weeks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own sessions" ON sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own session_logs" ON session_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own daily_logs" ON daily_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own sleep_logs" ON sleep_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own weekly_reviews" ON weekly_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_template_sessions_updated_at BEFORE UPDATE ON template_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
