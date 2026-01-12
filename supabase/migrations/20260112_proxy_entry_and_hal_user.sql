-- Migration: Enable proxy entry (代理入力) and add Hal-san user
-- Date: 2026-01-12
-- Purpose: Allow authenticated users to create entries on behalf of others, and add non-login user (Hal-san)

-- 1. Update RLS policy for entries INSERT to allow proxy entry
-- Drop the old restrictive policy that only allows self-entry
DROP POLICY IF EXISTS "Users can create own entries" ON public.entries;

-- Create new policy: Any authenticated user can create entries for any user (proxy entry allowed)
CREATE POLICY "Authenticated users can create entries for any user"
  ON public.entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY "Authenticated users can create entries for any user" ON public.entries IS
  'Allows authenticated users to create time entries on behalf of any user (including non-login users like Hal-san). This is designed for trusted team environments.';

-- 2. Add Hal-san as a non-login user to profiles table
-- Note: Hal-san will not have auth.users entry, so we need to manually insert into profiles
-- We use a fixed UUID for Hal-san
INSERT INTO public.profiles (id, display_name, email, active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ハルさん (Hal-san)',
  'hal@time-bank.local',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN public.profiles.id IS 'User ID. For normal users, references auth.users(id). For non-login users (like Hal-san), uses a fixed UUID.';
