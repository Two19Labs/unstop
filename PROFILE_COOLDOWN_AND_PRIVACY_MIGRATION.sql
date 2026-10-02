-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  PROFILE COOLDOWN (SERVER-ENFORCED) + PROFILE PRIVACY
-- Run this ONCE in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Fully idempotent, non-destructive, safe to run multiple times.
-- Also folded into supabase_master_migration.sql (section 2B) for fresh setups.
--
-- What it does:
--   1. Adds onboarding_completed_at (first profile setup never starts the lock).
--   2. Backfills profile fields that only ever reached auth user_metadata
--      (incl. skills) into public.profiles, which is now the single source of truth.
--   3. Replaces the old bypassable cooldown trigger with one where the database
--      owns the timestamp: clients cannot fake or reset it.
--   4. Restricts profile reads to the owner (+ admin). Phone numbers and emails are
--      no longer readable by anyone holding the public anon key.
-- ═════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. COLUMNS
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_last_updated_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. REMOVE THE OLD (BYPASSABLE) COOLDOWN TRIGGER
-- ─────────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_check_profile_cooldown ON public.profiles;
DROP FUNCTION IF EXISTS public.check_profile_cooldown();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. ONE-TIME BACKFILL FROM AUTH METADATA (runs as admin, before the new trigger)
-- ─────────────────────────────────────────────────────────────────────────────────
-- Create rows for any auth users that are missing a profile
INSERT INTO public.profiles (id, email)
SELECT u.id, COALESCE(u.email, '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Fill only EMPTY profile fields from metadata (never overwrites existing data)
UPDATE public.profiles p SET
  full_name       = COALESCE(NULLIF(p.full_name, ''),       NULLIF(u.raw_user_meta_data->>'full_name', ''), p.full_name),
  college         = COALESCE(NULLIF(p.college, ''),         NULLIF(u.raw_user_meta_data->>'college', ''), p.college),
  course          = COALESCE(NULLIF(p.course, ''),          NULLIF(u.raw_user_meta_data->>'course', ''), p.course),
  year            = COALESCE(NULLIF(p.year, ''),            NULLIF(u.raw_user_meta_data->>'year', ''), p.year),
  phone           = COALESCE(NULLIF(p.phone, ''),           NULLIF(u.raw_user_meta_data->>'phone', ''), p.phone),
  bio             = COALESCE(NULLIF(p.bio, ''),             NULLIF(u.raw_user_meta_data->>'bio', ''), p.bio),
  education_level = COALESCE(NULLIF(p.education_level, ''), NULLIF(u.raw_user_meta_data->>'education_level', ''), p.education_level),
  skills = CASE
    WHEN COALESCE(array_length(p.skills, 1), 0) = 0
     AND jsonb_typeof(u.raw_user_meta_data->'skills') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(u.raw_user_meta_data->'skills'))
    ELSE p.skills
  END,
  profile_last_updated_at = COALESCE(
    p.profile_last_updated_at,
    CASE
      WHEN (u.raw_user_meta_data->>'profile_last_updated_at') ~ '^\d{4}-\d{2}-\d{2}T'
      THEN LEAST((u.raw_user_meta_data->>'profile_last_updated_at')::timestamptz, NOW())
    END
  )
FROM auth.users u
WHERE u.id = p.id;

-- Anyone who has already saved their profile has completed onboarding
UPDATE public.profiles
SET onboarding_completed_at = profile_last_updated_at
WHERE onboarding_completed_at IS NULL
  AND profile_last_updated_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. SERVER-ENFORCED 24-HOUR COOLDOWN
--    - Only applies to end users (anon/authenticated JWTs). SQL editor, service
--      role, and auth/admin triggers (e.g. handle_new_user) are exempt.
--    - profile_last_updated_at / onboarding_completed_at / email are server-owned:
--      whatever the client sends for them is ignored.
--    - The first real profile save (onboarding) does NOT start the lock.
--    - Saves with no real change are allowed and do not reset the timer.
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_profile_cooldown()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- A client-side insert only happens if the signup trigger missed the row;
    -- treat it as the onboarding save.
    NEW.email := COALESCE(auth.jwt()->>'email', NEW.email, '');
    NEW.profile_last_updated_at := NULL;
    NEW.onboarding_completed_at := NOW();
    RETURN NEW;
  END IF;

  -- Server-owned columns
  NEW.email := OLD.email;
  NEW.profile_last_updated_at := OLD.profile_last_updated_at;
  NEW.onboarding_completed_at := OLD.onboarding_completed_at;
  NEW.created_at := OLD.created_at;

  IF ROW(OLD.full_name, OLD.college, OLD.course, OLD.year, OLD.phone, OLD.bio,
         OLD.education_level, OLD.skills, OLD.avatar_url)
     IS NOT DISTINCT FROM
     ROW(NEW.full_name, NEW.college, NEW.course, NEW.year, NEW.phone, NEW.bio,
         NEW.education_level, NEW.skills, NEW.avatar_url)
  THEN
    RETURN NEW;
  END IF;

  -- First-time profile setup: free, does not start the cooldown
  IF OLD.onboarding_completed_at IS NULL THEN
    NEW.onboarding_completed_at := NOW();
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  IF OLD.profile_last_updated_at IS NOT NULL
     AND OLD.profile_last_updated_at > NOW() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Profile details can only be updated once every 24 hours.'
      USING ERRCODE = 'P0001',
            HINT = 'PROFILE_COOLDOWN',
            DETAIL = to_char(OLD.profile_last_updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  END IF;

  NEW.profile_last_updated_at := NOW();
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_cooldown ON public.profiles;
CREATE TRIGGER trg_enforce_profile_cooldown
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_cooldown();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. PROFILE PRIVACY: owner-only reads (+ admin console)
--    respond_to_application / delete_user_account are SECURITY DEFINER and keep
--    working. Keep the admin email in sync with src/lib/admin.js.
-- ─────────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

  CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Admin can view all profiles" ON public.profiles
    FOR SELECT USING (lower(COALESCE(auth.jwt()->>'email', '')) = 'aditya.25015@sscbs.du.ac.in');
  CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
END $$;

SELECT 'Profile cooldown (server-enforced) + profile privacy migration applied.' AS status;
