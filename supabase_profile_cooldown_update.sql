-- ════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  24-Hour Profile Change Cooldown Migration
-- ════════════════════════════════════════════════════════════════════════
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Idempotent & safe to run multiple times.
-- ════════════════════════════════════════════════════════════════════════

-- 1. Ensure profile_last_updated_at exists on profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_last_updated_at TIMESTAMPTZ;

-- 2. Database-level trigger to strictly prevent unauthorized edits within 24 hours
CREATE OR REPLACE FUNCTION public.check_profile_cooldown()
RETURNS trigger AS $$
BEGIN
  -- If profile_last_updated_at was set previously
  IF OLD.profile_last_updated_at IS NOT NULL THEN
    -- Check if 24 hours have elapsed
    IF (NOW() - OLD.profile_last_updated_at) < INTERVAL '24 hours' THEN
      -- Check if any user-editable fields actually changed
      IF (
        OLD.full_name IS DISTINCT FROM NEW.full_name OR
        OLD.college IS DISTINCT FROM NEW.college OR
        OLD.course IS DISTINCT FROM NEW.course OR
        OLD.year IS DISTINCT FROM NEW.year OR
        OLD.phone IS DISTINCT FROM NEW.phone OR
        OLD.bio IS DISTINCT FROM NEW.bio OR
        OLD.education_level IS DISTINCT FROM NEW.education_level OR
        OLD.skills IS DISTINCT FROM NEW.skills
      ) THEN
        RAISE EXCEPTION 'Profile details can only be updated once every 24 hours. Please wait before making further changes.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_profile_cooldown ON public.profiles;
CREATE TRIGGER trg_check_profile_cooldown
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_cooldown();
