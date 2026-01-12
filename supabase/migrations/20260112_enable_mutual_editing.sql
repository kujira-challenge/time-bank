-- Migration: Enable mutual editing of entries (相互編集機能の解禁)
-- Date: 2026-01-12
-- Purpose: Allow all authenticated users to edit and delete any entry (Wiki-like collaboration)

-- 1. Update RLS policy for entries UPDATE
-- Drop the old restrictive policy that only allows owner/admin to update
DROP POLICY IF EXISTS "Users can update own entries" ON public.entries;
DROP POLICY IF EXISTS "entries_update_by_admin" ON public.entries;

-- Create new policy: Any authenticated user can update any entry
CREATE POLICY "Authenticated users can update any entry"
  ON public.entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Authenticated users can update any entry" ON public.entries IS
  'Allows all authenticated users to update any entry (Wiki-like collaboration). This is designed for trusted team environments.';

-- 2. Update RLS policy for entries DELETE
-- Drop the old restrictive policy that only allows owner/admin to delete
DROP POLICY IF EXISTS "Users can delete own entries" ON public.entries;
DROP POLICY IF EXISTS "entries_delete_by_admin" ON public.entries;

-- Create new policy: Any authenticated user can delete any entry
CREATE POLICY "Authenticated users can delete any entry"
  ON public.entries FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON POLICY "Authenticated users can delete any entry" ON public.entries IS
  'Allows all authenticated users to delete any entry (Wiki-like collaboration). This is designed for trusted team environments.';
