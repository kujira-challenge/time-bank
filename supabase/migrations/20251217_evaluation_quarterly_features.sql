-- Migration: Evaluation axes and quarterly reflections
-- Date: 2025-12-17
-- Purpose: Add detailed evaluation system and quarterly reflection features

-- 1. Add recipient_id to entries table
-- This represents who received the time contribution
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_entries_recipient_id ON public.entries(recipient_id);

COMMENT ON COLUMN public.entries.recipient_id IS 'Person who received the time contribution (nullable)';

-- 2. Create evaluation axes master table
CREATE TABLE IF NOT EXISTS public.evaluation_axes (
  id SERIAL PRIMARY KEY,
  axis_key TEXT NOT NULL UNIQUE,
  axis_label TEXT NOT NULL,
  display_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.evaluation_axes IS 'Master table for 10 evaluation axes';

-- Insert the 10 evaluation axes
INSERT INTO public.evaluation_axes (axis_key, axis_label, display_order) VALUES
  ('exceeding_expectations', '期待を超えるアウトプット', 1),
  ('visualization', '脳内イメージを具現化', 2),
  ('new_perspective', '新しい視点や観点を提供', 3),
  ('active_listening', 'じっと話を聴く', 4),
  ('introduction', '人を紹介', 5),
  ('verbalization', '言語化', 6),
  ('new_world', '新しい世界に誘う', 7),
  ('support', 'サポート', 8),
  ('collaboration', '協働', 9),
  ('mentoring', '指導', 10)
ON CONFLICT (axis_key) DO NOTHING;

-- 3. Create detailed evaluations table
CREATE TABLE IF NOT EXISTS public.detailed_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluated_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  axis_key TEXT NOT NULL REFERENCES public.evaluation_axes(axis_key) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (entry_id, axis_key)
);

COMMENT ON TABLE public.detailed_evaluations IS 'Detailed evaluations based on 10 evaluation axes';
COMMENT ON COLUMN public.detailed_evaluations.evaluator_id IS 'Person who is giving the evaluation';
COMMENT ON COLUMN public.detailed_evaluations.evaluated_id IS 'Person being evaluated';

CREATE INDEX IF NOT EXISTS idx_detailed_evaluations_entry_id ON public.detailed_evaluations(entry_id);
CREATE INDEX IF NOT EXISTS idx_detailed_evaluations_evaluator_id ON public.detailed_evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_detailed_evaluations_evaluated_id ON public.detailed_evaluations(evaluated_id);

-- Enable RLS
ALTER TABLE public.detailed_evaluations ENABLE ROW LEVEL SECURITY;

-- Anyone can view evaluations
DROP POLICY IF EXISTS de_select ON public.detailed_evaluations;
CREATE POLICY de_select
ON public.detailed_evaluations FOR SELECT
TO authenticated
USING (true);

-- Evaluator can insert their own evaluations
DROP POLICY IF EXISTS de_insert ON public.detailed_evaluations;
CREATE POLICY de_insert
ON public.detailed_evaluations FOR INSERT
TO authenticated
WITH CHECK (evaluator_id = auth.uid());

-- Evaluator can update their own evaluations
DROP POLICY IF EXISTS de_update ON public.detailed_evaluations;
CREATE POLICY de_update
ON public.detailed_evaluations FOR UPDATE
TO authenticated
USING (evaluator_id = auth.uid());

-- Evaluator can delete their own evaluations
DROP POLICY IF EXISTS de_delete ON public.detailed_evaluations;
CREATE POLICY de_delete
ON public.detailed_evaluations FOR DELETE
TO authenticated
USING (evaluator_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_detailed_evaluations_updated_at
  BEFORE UPDATE ON public.detailed_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Create quarterly reflections table
CREATE TABLE IF NOT EXISTS public.quarterly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quarter_start DATE NOT NULL,
  quarter_end DATE NOT NULL,
  achievement_rate NUMERIC(5, 2) DEFAULT 0 CHECK (achievement_rate >= 0 AND achievement_rate <= 100),
  avg_peer_rating NUMERIC(3, 2) DEFAULT 0 CHECK (avg_peer_rating >= 0 AND avg_peer_rating <= 5),
  avg_goal_rating NUMERIC(3, 2) DEFAULT 0 CHECK (avg_goal_rating >= 0 AND avg_goal_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, quarter_start)
);

COMMENT ON TABLE public.quarterly_reflections IS 'Quarterly reflection summaries for users';
COMMENT ON COLUMN public.quarterly_reflections.achievement_rate IS 'Achievement rate in percentage (0-100)';
COMMENT ON COLUMN public.quarterly_reflections.avg_peer_rating IS 'Average peer evaluation rating (1-5)';
COMMENT ON COLUMN public.quarterly_reflections.avg_goal_rating IS 'Average goal rating (1-5)';

CREATE INDEX IF NOT EXISTS idx_quarterly_reflections_user_id ON public.quarterly_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_quarterly_reflections_quarter_start ON public.quarterly_reflections(quarter_start DESC);

-- Enable RLS
ALTER TABLE public.quarterly_reflections ENABLE ROW LEVEL SECURITY;

-- Anyone can view reflections
DROP POLICY IF EXISTS qr_select ON public.quarterly_reflections;
CREATE POLICY qr_select
ON public.quarterly_reflections FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own reflections
DROP POLICY IF EXISTS qr_insert ON public.quarterly_reflections;
CREATE POLICY qr_insert
ON public.quarterly_reflections FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own reflections
DROP POLICY IF EXISTS qr_update ON public.quarterly_reflections;
CREATE POLICY qr_update
ON public.quarterly_reflections FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own reflections
DROP POLICY IF EXISTS qr_delete ON public.quarterly_reflections;
CREATE POLICY qr_delete
ON public.quarterly_reflections FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_quarterly_reflections_updated_at
  BEFORE UPDATE ON public.quarterly_reflections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Create quarterly actions table
CREATE TABLE IF NOT EXISTS public.quarterly_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarterly_reflection_id UUID NOT NULL REFERENCES public.quarterly_reflections(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.quarterly_actions IS 'Action items for quarterly reflections';

CREATE INDEX IF NOT EXISTS idx_quarterly_actions_reflection_id ON public.quarterly_actions(quarterly_reflection_id);

-- Enable RLS
ALTER TABLE public.quarterly_actions ENABLE ROW LEVEL SECURITY;

-- Anyone can view actions
DROP POLICY IF EXISTS qa_select ON public.quarterly_actions;
CREATE POLICY qa_select
ON public.quarterly_actions FOR SELECT
TO authenticated
USING (true);

-- Users can manage actions for their own reflections
DROP POLICY IF EXISTS qa_insert ON public.quarterly_actions;
CREATE POLICY qa_insert
ON public.quarterly_actions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quarterly_reflections qr
    WHERE qr.id = quarterly_reflection_id AND qr.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS qa_update ON public.quarterly_actions;
CREATE POLICY qa_update
ON public.quarterly_actions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quarterly_reflections qr
    WHERE qr.id = quarterly_reflection_id AND qr.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS qa_delete ON public.quarterly_actions;
CREATE POLICY qa_delete
ON public.quarterly_actions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quarterly_reflections qr
    WHERE qr.id = quarterly_reflection_id AND qr.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_quarterly_actions_updated_at
  BEFORE UPDATE ON public.quarterly_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.evaluation_axes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detailed_evaluations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quarterly_reflections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quarterly_actions TO authenticated;
