-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  ADMIN STATS MIGRATION
-- Run this ONCE in your Supabase SQL Editor (Dashboard > SQL Editor > New Query),
-- AFTER ADMIN_BY_USER_ID_MIGRATION.sql. Fully idempotent, safe to run multiple times.
-- Creates one new function and changes nothing else.
--
-- The admin console counted squad applications with a normal query, but row-level
-- security only shows anyone (admins included) the applications they sent or received,
-- so "applications submitted" only counted the admin's own. This returns platform-wide
-- totals to admins only, without opening up the applications table, plus sign-up
-- numbers from auth.users (which the browser can't read): confirmed vs unconfirmed
-- accounts and new sign-ups.
-- ═════════════════════════════════════════════════════════════════════════════════

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

SELECT 'Admin stats function created.' AS status;
