-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  PLATFORM FIXES MIGRATION (October 2026)
-- Run this ONCE in your Supabase SQL Editor (Dashboard > SQL Editor > New Query),
-- AFTER CHAT_UPGRADE_MIGRATION.sql.
-- Fully idempotent: safe to run more than once.
--
-- What it does:
--   1. Host WhatsApp numbers: only for open, unexpired squads, and each person can
--      look up at most 15 different hosts per 24 hours (every lookup is logged).
--   2. Account deletion needs a sign-in within the last 10 minutes (password or
--      Google), checked here on the server, not just in the browser.
--   3. Anti-spam limits: 8 open squads per person, 10 new squads per day,
--      30 join requests per day, 20 chat requests per day.
--   4. Two helper functions are no longer callable while logged out.
-- ═════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. HOST WHATSAPP LOOKUPS
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.whatsapp_lookups (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_lookups_user_created
  ON public.whatsapp_lookups(user_id, created_at DESC);
ALTER TABLE public.whatsapp_lookups ENABLE ROW LEVEL SECURITY;  -- no policies: server-only

CREATE OR REPLACE FUNCTION public.get_squad_host_whatsapp(p_post_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.squad_posts;
  v_hosts INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Please sign in to contact the squad host.';
  END IF;

  SELECT * INTO v_post FROM public.squad_posts WHERE id = p_post_id;
  IF NOT FOUND OR COALESCE(v_post.comm_method, 'whatsapp') <> 'whatsapp' THEN
    RETURN NULL;
  END IF;
  IF v_post.user_id = auth.uid() THEN
    RETURN NULL;
  END IF;
  IF v_post.is_open IS FALSE OR (v_post.expires_at IS NOT NULL AND v_post.expires_at < NOW()) THEN
    RAISE EXCEPTION 'This squad is closed or has expired.';
  END IF;

  -- Looking up the same squad again doesn't count toward the limit
  SELECT count(DISTINCT post_id) INTO v_hosts
  FROM public.whatsapp_lookups
  WHERE user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours'
    AND post_id <> p_post_id;
  IF v_hosts >= 15 THEN
    RAISE EXCEPTION 'You''ve contacted a lot of squad hosts today. Try again tomorrow.';
  END IF;

  INSERT INTO public.whatsapp_lookups (user_id, post_id) VALUES (auth.uid(), p_post_id);

  RETURN (SELECT public.normalize_indian_phone(phone) FROM public.profiles WHERE id = v_post.user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.get_squad_host_whatsapp(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_squad_host_whatsapp(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. ACCOUNT DELETION: RECENT SIGN-IN REQUIRED
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT := lower(COALESCE(auth.jwt()->>'email', ''));
  v_last_sign_in TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- The app re-signs the user in (password or Google) right before calling this
  SELECT last_sign_in_at INTO v_last_sign_in FROM auth.users WHERE id = v_user_id;
  IF v_last_sign_in IS NULL OR v_last_sign_in < NOW() - INTERVAL '10 minutes' THEN
    RAISE EXCEPTION 'REAUTH_REQUIRED';
  END IF;

  DELETE FROM public.bookmarks WHERE user_id = v_user_id;
  DELETE FROM public.user_blocks WHERE blocker_id = v_user_id OR blocked_id = v_user_id;
  DELETE FROM public.squad_conversations WHERE member_id = v_user_id OR host_id = v_user_id;
  DELETE FROM public.squad_applications WHERE applicant_id = v_user_id;
  DELETE FROM public.squad_posts WHERE user_id = v_user_id;          -- cascades contacts + applications
  DELETE FROM public.user_notification_states WHERE user_id = v_user_id;
  DELETE FROM public.user_notifications WHERE user_id = v_user_id OR (v_email <> '' AND lower(user_email) = v_email);
  DELETE FROM public.squad_messages WHERE sender_id = v_user_id;
  DELETE FROM public.whatsapp_lookups WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. ANTI-SPAM LIMITS (dashboard / service role are never limited)
-- ─────────────────────────────────────────────────────────────────────────────────
-- Squads: 8 open at a time, 10 new per 24 hours
CREATE OR REPLACE FUNCTION public.limit_squad_posts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF (SELECT count(*) FROM public.squad_posts
      WHERE user_id = auth.uid() AND is_open IS NOT FALSE
        AND (expires_at IS NULL OR expires_at > NOW())) >= 8 THEN
    RAISE EXCEPTION 'You can have at most 8 open squads. Close one before posting another.';
  END IF;
  IF (SELECT count(*) FROM public.squad_posts
      WHERE user_id = auth.uid() AND created_at > NOW() - INTERVAL '24 hours') >= 10 THEN
    RAISE EXCEPTION 'You''ve posted a lot of squads today. Try again tomorrow.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_limit_squad_posts ON public.squad_posts;
CREATE TRIGGER trg_limit_squad_posts
  BEFORE INSERT ON public.squad_posts
  FOR EACH ROW EXECUTE FUNCTION public.limit_squad_posts();

-- Join requests: 30 new per 24 hours
CREATE OR REPLACE FUNCTION public.limit_squad_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF (SELECT count(*) FROM public.squad_applications
      WHERE applicant_id = auth.uid() AND created_at > NOW() - INTERVAL '24 hours') >= 30 THEN
    RAISE EXCEPTION 'You''ve sent a lot of join requests today. Try again tomorrow.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_limit_squad_applications ON public.squad_applications;
CREATE TRIGGER trg_limit_squad_applications
  BEFORE INSERT ON public.squad_applications
  FOR EACH ROW EXECUTE FUNCTION public.limit_squad_applications();

-- Chat requests: 20 new or re-sent per 24 hours (request_squad_chat resets
-- created_at when a request is re-sent, so re-sends count too)
CREATE OR REPLACE FUNCTION public.limit_chat_requests()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM NEW.member_id OR NEW.status <> 'requested' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'requested' THEN
    RETURN NEW;
  END IF;
  IF (SELECT count(*) FROM public.squad_conversations
      WHERE member_id = auth.uid() AND created_at > NOW() - INTERVAL '24 hours'
        AND id IS DISTINCT FROM NEW.id) >= 20 THEN
    RAISE EXCEPTION 'You''ve sent a lot of chat requests today. Try again tomorrow.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_limit_chat_requests ON public.squad_conversations;
CREATE TRIGGER trg_limit_chat_requests
  BEFORE INSERT OR UPDATE OF status ON public.squad_conversations
  FOR EACH ROW EXECUTE FUNCTION public.limit_chat_requests();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. HELPERS: SIGNED-IN USERS ONLY
-- ─────────────────────────────────────────────────────────────────────────────────
-- normalize_indian_phone runs inside the profile trigger as the signed-in user,
-- so authenticated keeps access; logged-out visitors lose it.
REVOKE ALL ON FUNCTION public.normalize_indian_phone(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.normalize_indian_phone(TEXT) TO authenticated, service_role;

DO $$
BEGIN
  IF to_regprocedure('public.squad_chat_role(text, text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.squad_chat_role(TEXT, TEXT) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.squad_chat_role(TEXT, TEXT) TO authenticated, service_role;
  END IF;
END $$;

SELECT 'OneStop platform fixes migration applied.' AS status;
