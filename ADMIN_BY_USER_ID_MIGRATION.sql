-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  ADMIN BY ACCOUNT ID MIGRATION
-- Run this ONCE in your Supabase SQL Editor (Dashboard > SQL Editor > New Query),
-- AFTER PLATFORM_FIXES_MIGRATION.sql. Fully idempotent, safe to run multiple times.
--
-- IMPORTANT: run this again after any re-run of supabase_master_migration.sql or
-- SECURITY_HARDENING_MIGRATION.sql (those still define the older email-based
-- is_admin()).
--
-- What it does:
--   1. Admins are identified by their account ID (auth.uid()) instead of the email
--      inside the login token. The admin email is public, so admin rights now
--      depend on owning that exact account, not on any account with that address.
--   2. Existing admin rows are linked to their accounts automatically (confirmed
--      emails only). No email addresses are written in this file.
--   3. respond_to_application() can no longer be called while logged out.
-- ═════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. LINK ADMIN ROWS TO ACCOUNT IDS
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.app_admins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_app_admins_user_id ON public.app_admins(user_id);

UPDATE public.app_admins a
SET user_id = u.id
FROM auth.users u
WHERE a.user_id IS NULL
  AND lower(u.email) = lower(a.email)
  AND u.email_confirmed_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. is_admin() CHECKS THE ACCOUNT ID
-- ─────────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. SIGNED-IN USERS ONLY
-- ─────────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.respond_to_application(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_application(UUID, TEXT) TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────────
-- CHECK: every admin row should show a user_id. A NULL means that person has not
-- signed up (or confirmed their email) yet: re-run this file after they do.
-- ─────────────────────────────────────────────────────────────────────────────────
SELECT email, user_id FROM public.app_admins;
