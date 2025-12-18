-- Migration: Fix evaluator/evaluated role inversion
-- Date: 2025-12-18
-- Purpose: Swap evaluator_id and evaluated_id in existing detailed_evaluations data
--          to match the corrected logic: recipient evaluates contributor

-- Backup existing data (optional, for safety)
-- You can query this table if rollback is needed
CREATE TABLE IF NOT EXISTS public.detailed_evaluations_backup_20251218 AS
SELECT * FROM public.detailed_evaluations;

-- Swap evaluator_id and evaluated_id for all existing records
UPDATE public.detailed_evaluations
SET
  evaluator_id = evaluated_id,
  evaluated_id = evaluator_id
WHERE id IS NOT NULL;

-- Verification query (run manually after migration to check results)
-- SELECT
--   de.id,
--   de.entry_id,
--   evaluator.display_name AS evaluator_name,
--   evaluated.display_name AS evaluated_name,
--   e.contributor_id,
--   e.recipient_id
-- FROM detailed_evaluations de
-- JOIN profiles evaluator ON de.evaluator_id = evaluator.id
-- JOIN profiles evaluated ON de.evaluated_id = evaluated.id
-- JOIN entries e ON de.entry_id = e.id
-- LIMIT 10;

COMMENT ON TABLE public.detailed_evaluations_backup_20251218 IS 'Backup of detailed_evaluations before role swap on 2025-12-18';
