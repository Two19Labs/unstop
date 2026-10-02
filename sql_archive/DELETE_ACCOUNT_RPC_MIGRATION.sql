-- ══════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  User Account Self-Deletion Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ══════════════════════════════════════════════════════════════════

-- Create RPC function allowing authenticated users to completely delete their own account
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete public table records across all user interactions
  DELETE FROM public.bookmarks WHERE user_id = v_user_id;
  DELETE FROM public.squad_applications WHERE applicant_id = v_user_id;
  DELETE FROM public.squad_posts WHERE user_id = v_user_id;
  DELETE FROM public.user_notification_states WHERE user_id = v_user_id;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_notifications') THEN
    DELETE FROM public.user_notifications WHERE user_id = v_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'squad_messages') THEN
    DELETE FROM public.squad_messages WHERE sender_id = v_user_id;
  END IF;

  DELETE FROM public.profiles WHERE id = v_user_id;

  -- Delete user from auth.users (cascading all auth tokens & identities)
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Grant execution permission to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO service_role;
