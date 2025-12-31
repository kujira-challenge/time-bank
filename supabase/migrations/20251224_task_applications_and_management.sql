-- Migration: Task applications and management features
-- Date: 2025-12-24
-- Purpose: Add task application system and soft delete support

-- 1. Add deleted_at column to tasks table for soft delete
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.tasks.deleted_at IS 'Soft delete timestamp (NULL = active, non-NULL = deleted)';

CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON public.tasks(deleted_at) WHERE deleted_at IS NULL;

-- 2. Create task_applications table
CREATE TABLE IF NOT EXISTS public.task_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (task_id, applicant_id)
);

COMMENT ON TABLE public.task_applications IS 'Task application records from members';
COMMENT ON COLUMN public.task_applications.status IS 'Application status: applied (default) or withdrawn';

CREATE INDEX IF NOT EXISTS idx_task_applications_task_id ON public.task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_applicant_id ON public.task_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_status ON public.task_applications(status);

-- 3. Enable RLS on task_applications
ALTER TABLE public.task_applications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for task_applications

-- Anyone authenticated can view all applications
CREATE POLICY "Anyone can view task applications"
  ON public.task_applications FOR SELECT
  TO authenticated
  USING (true);

-- Only the applicant can insert their own application
CREATE POLICY "Users can create own applications"
  ON public.task_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

-- Only the applicant can update their own application (e.g., withdraw)
CREATE POLICY "Users can update own applications"
  ON public.task_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = applicant_id);

-- Only the applicant can delete their own application
CREATE POLICY "Users can delete own applications"
  ON public.task_applications FOR DELETE
  TO authenticated
  USING (auth.uid() = applicant_id);

-- 5. Add trigger for task_applications updated_at
CREATE TRIGGER update_task_applications_updated_at
  BEFORE UPDATE ON public.task_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Grant necessary permissions
GRANT SELECT ON public.task_applications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.task_applications TO authenticated;

-- 7. Create view for tasks with application counts (excluding soft-deleted tasks)
CREATE OR REPLACE VIEW public.tasks_with_application_counts AS
SELECT
  t.*,
  COUNT(DISTINCT ta.id) FILTER (WHERE ta.status = 'applied') as application_count,
  COUNT(DISTINCT ta.id) FILTER (WHERE ta.status = 'withdrawn') as withdrawn_count
FROM public.tasks t
LEFT JOIN public.task_applications ta ON ta.task_id = t.id
WHERE t.deleted_at IS NULL
GROUP BY t.id;

COMMENT ON VIEW public.tasks_with_application_counts IS 'Tasks with application counts (excluding soft-deleted)';

GRANT SELECT ON public.tasks_with_application_counts TO authenticated;
