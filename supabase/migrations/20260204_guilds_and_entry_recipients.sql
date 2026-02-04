-- Migration: Guilds table and entry_recipients junction table
-- Date: 2026-02-04
-- Purpose: Support multiple recipients (users and guilds) per entry

-- 1. Create guilds table
CREATE TABLE IF NOT EXISTS public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.guilds IS 'Organizations/guilds that can be recipients of time contributions';

-- Enable RLS
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view guilds
CREATE POLICY "Anyone can view guilds"
  ON public.guilds FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can manage guilds
CREATE POLICY "Authenticated users can insert guilds"
  ON public.guilds FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update guilds"
  ON public.guilds FOR UPDATE
  TO authenticated
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_guilds_updated_at
  BEFORE UPDATE ON public.guilds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.guilds TO authenticated;

-- 2. Create entry_recipients junction table
CREATE TABLE IF NOT EXISTS public.entry_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('user', 'guild')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (entry_id, recipient_id, recipient_type)
);

COMMENT ON TABLE public.entry_recipients IS 'Junction table linking entries to multiple recipients (users or guilds)';
COMMENT ON COLUMN public.entry_recipients.recipient_id IS 'UUID of the recipient (profiles.id for users, guilds.id for guilds)';
COMMENT ON COLUMN public.entry_recipients.recipient_type IS 'Type of recipient: user or guild';

CREATE INDEX IF NOT EXISTS idx_entry_recipients_entry_id ON public.entry_recipients(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_recipients_recipient ON public.entry_recipients(recipient_id, recipient_type);

-- Enable RLS
ALTER TABLE public.entry_recipients ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view entry_recipients
CREATE POLICY "Anyone can view entry_recipients"
  ON public.entry_recipients FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can manage entry_recipients (wiki-like collaboration)
CREATE POLICY "Authenticated users can insert entry_recipients"
  ON public.entry_recipients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update entry_recipients"
  ON public.entry_recipients FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete entry_recipients"
  ON public.entry_recipients FOR DELETE
  TO authenticated
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entry_recipients TO authenticated;

-- 3. Migrate existing recipient_id data to entry_recipients
INSERT INTO public.entry_recipients (entry_id, recipient_id, recipient_type)
SELECT id, recipient_id, 'user'
FROM public.entries
WHERE recipient_id IS NOT NULL
ON CONFLICT DO NOTHING;
