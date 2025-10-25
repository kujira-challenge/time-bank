-- Migration: Admin role, Audit history, Task feedbacks
-- Date: 2025-01-23
-- Purpose: Enable admin editing, audit trail, and value score system

-- 4.1 Add role column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member'
  CHECK (role IN ('member','admin'));

COMMENT ON COLUMN public.profiles.role IS 'User role: member (default) or admin';

-- 4.2 Create entries audit history table
CREATE TABLE IF NOT EXISTS public.entries_history (
  id bigserial PRIMARY KEY,
  entry_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('update','delete')),
  actor_id uuid NOT NULL,
  old_row jsonb,
  new_row jsonb,
  acted_at timestamptz DEFAULT NOW()
);

COMMENT ON TABLE public.entries_history IS 'Audit trail for entries modifications';
COMMENT ON COLUMN public.entries_history.actor_id IS 'User who performed the action (auth.uid())';

CREATE INDEX IF NOT EXISTS idx_entries_history_entry_id ON public.entries_history(entry_id);
CREATE INDEX IF NOT EXISTS idx_entries_history_acted_at ON public.entries_history(acted_at DESC);

-- Enable RLS on entries_history
ALTER TABLE public.entries_history ENABLE ROW LEVEL SECURITY;

-- Admin can view all history
CREATE POLICY IF NOT EXISTS entries_history_admin_select
ON public.entries_history FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Users can view history of their own entries
CREATE POLICY IF NOT EXISTS entries_history_owner_select
ON public.entries_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.entries e
    WHERE e.id = entry_id AND e.contributor_id = auth.uid()
  )
);

-- 4.3 Create audit trigger functions
CREATE OR REPLACE FUNCTION public.log_entries_update()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.entries_history(entry_id, action, actor_id, old_row, new_row)
  VALUES (OLD.id, 'update', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.log_entries_delete()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.entries_history(entry_id, action, actor_id, old_row, new_row)
  VALUES (OLD.id, 'delete', auth.uid(), to_jsonb(OLD), NULL);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_entries_update ON public.entries;
DROP TRIGGER IF EXISTS trg_entries_delete ON public.entries;

-- Create triggers
CREATE TRIGGER trg_entries_update
BEFORE UPDATE ON public.entries
FOR EACH ROW EXECUTE FUNCTION public.log_entries_update();

CREATE TRIGGER trg_entries_delete
BEFORE DELETE ON public.entries
FOR EACH ROW EXECUTE FUNCTION public.log_entries_delete();

-- 4.4 Add admin update/delete policies for entries
-- Keep existing self-update/delete policies, add admin override

CREATE POLICY IF NOT EXISTS entries_update_by_admin
ON public.entries FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY IF NOT EXISTS entries_delete_by_admin
ON public.entries FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- 4.5 Create task_feedbacks table for value scoring
CREATE TABLE IF NOT EXISTS public.task_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT NOW(),
  UNIQUE (task_id, reviewer_id)
);

COMMENT ON TABLE public.task_feedbacks IS 'Task quality ratings for value score calculation';
COMMENT ON COLUMN public.task_feedbacks.rating IS 'Rating from 1 to 5 stars';

CREATE INDEX IF NOT EXISTS idx_task_feedbacks_task_id ON public.task_feedbacks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_feedbacks_reviewer_id ON public.task_feedbacks(reviewer_id);

-- Enable RLS on task_feedbacks
ALTER TABLE public.task_feedbacks ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view feedbacks
CREATE POLICY IF NOT EXISTS tf_select
ON public.task_feedbacks FOR SELECT
TO authenticated
USING (true);

-- Only the reviewer can insert their own feedback
CREATE POLICY IF NOT EXISTS tf_insert
ON public.task_feedbacks FOR INSERT
TO authenticated
WITH CHECK (reviewer_id = auth.uid());

-- Reviewer can update their own feedback
CREATE POLICY IF NOT EXISTS tf_update
ON public.task_feedbacks FOR UPDATE
TO authenticated
USING (reviewer_id = auth.uid());

-- Reviewer can delete their own feedback
CREATE POLICY IF NOT EXISTS tf_delete
ON public.task_feedbacks FOR DELETE
TO authenticated
USING (reviewer_id = auth.uid());

-- Create view for monthly value scores
CREATE OR REPLACE VIEW public.monthly_value_scores AS
SELECT
  p.id as user_id,
  p.display_name,
  DATE_TRUNC('month', e.week_start) as month,
  COALESCE(SUM(e.hours), 0) as total_hours,
  COALESCE(AVG(tf.rating), 0) as avg_rating,
  COALESCE(COUNT(DISTINCT tf.id), 0) as feedback_count,
  -- Value score: hours * 1.0 + avg_rating * 2.0
  COALESCE(SUM(e.hours) * 1.0, 0) + COALESCE(AVG(tf.rating) * 2.0, 0) as value_score
FROM public.profiles p
LEFT JOIN public.entries e ON e.contributor_id = p.id
LEFT JOIN public.tasks t ON t.assignee_id = p.id
LEFT JOIN public.task_feedbacks tf ON tf.task_id = t.id
WHERE p.active = true
GROUP BY p.id, p.display_name, DATE_TRUNC('month', e.week_start);

COMMENT ON VIEW public.monthly_value_scores IS 'Monthly aggregated hours, ratings, and value scores per user';

-- Grant necessary permissions
GRANT SELECT ON public.entries_history TO authenticated;
GRANT SELECT ON public.task_feedbacks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.task_feedbacks TO authenticated;
GRANT SELECT ON public.monthly_value_scores TO authenticated;

-- Create RPC function for weekly hours aggregation
CREATE OR REPLACE FUNCTION public.get_user_weekly_hours(
  p_user_id uuid,
  p_limit int DEFAULT 12
)
RETURNS TABLE (
  week text,
  hours numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(e.week_start, 'YYYY-MM-DD') as week,
    SUM(e.hours) as hours
  FROM public.entries e
  WHERE e.contributor_id = p_user_id
  GROUP BY e.week_start
  ORDER BY e.week_start DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_weekly_hours IS 'Get weekly hours aggregation for a specific user';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_weekly_hours TO authenticated;
