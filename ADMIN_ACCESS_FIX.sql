-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  ADMIN ACCESS FIX (all-in-one)
-- Run in your Supabase SQL Editor (Dashboard > SQL Editor > New Query).
-- Fully idempotent, safe to run multiple times. Touches admin access only.
--
-- Rolls up everything the Admin Console needs from the database:
--   1. app_admins table with the user_id column (ADMIN_BY_USER_ID_MIGRATION.sql)
--   2. The admin row, linked to the account that currently owns the email
--      (re-creates it if the account was deleted and signed up again)
--   3. is_admin() that checks the account ID
--   4. admin_platform_stats() (ADMIN_STATS_MIGRATION.sql)
--   5. Admins can read all profiles (the console's user list)
--
-- Re-run this after any re-run of supabase_master_migration.sql or
-- SECURITY_HARDENING_MIGRATION.sql (those still define the older is_admin()).
-- ═════════════════════════════════════════════════════════════════════════════════

-- 1. TABLE
CREATE TABLE IF NOT EXISTS public.app_admins (
  email TEXT PRIMARY KEY
);
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;  -- no policies: not readable by clients
ALTER TABLE public.app_admins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_app_admins_user_id ON public.app_admins(user_id);

-- 2. ADMIN ROW, LINKED TO THE CURRENT ACCOUNT FOR THAT EMAIL
INSERT INTO public.app_admins (email, user_id)
SELECT lower(u.email), u.id
FROM auth.users u
WHERE lower(u.email) = 'aditya.25015@sscbs.du.ac.in'
ORDER BY u.created_at DESC
LIMIT 1
ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id;

-- Link any other admin rows that are still missing their account
UPDATE public.app_admins a
SET user_id = u.id
FROM auth.users u
WHERE a.user_id IS NULL
  AND lower(u.email) = lower(a.email)
  AND u.email_confirmed_at IS NOT NULL;

-- 3. is_admin() CHECKS THE ACCOUNT ID
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.app_admins WHERE user_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 4. PLATFORM-WIDE STATS FOR THE CONSOLE
CREATE OR REPLACE FUNCTION public.admin_platform_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  RETURN json_build_object(
    'accounts_total',       (SELECT count(*) FROM auth.users),
    'accounts_confirmed',   (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL),
    'accounts_new_24h',     (SELECT count(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '24 hours'),
    'accounts_new_7d',      (SELECT count(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '7 days'),
    'signed_in_24h',        (SELECT count(*) FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '24 hours'),
    'applications_total',   (SELECT count(*) FROM public.squad_applications),
    'applications_pending', (SELECT count(*) FROM public.squad_applications WHERE status = 'pending'),
    'applications_accepted',(SELECT count(*) FROM public.squad_applications WHERE status = 'accepted')
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_platform_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_platform_stats() TO authenticated;

-- 5. ADMINS CAN READ ALL PROFILES
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());

-- CHECK: has_account and linked should both be true. If this returns no row, or
-- has_account is false, no account with that email exists yet: sign up, then re-run.
SELECT
  'aditya.25015@sscbs.du.ac.in' AS admin_email,
  EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'aditya.25015@sscbs.du.ac.in') AS has_account,
  EXISTS (
    SELECT 1 FROM public.app_admins a JOIN auth.users u ON u.id = a.user_id
    WHERE lower(u.email) = 'aditya.25015@sscbs.du.ac.in'
  ) AS linked;
