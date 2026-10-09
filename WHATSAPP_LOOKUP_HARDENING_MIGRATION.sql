-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  WHATSAPP LOOKUP HARDENING MIGRATION
-- Run this ONCE in your Supabase SQL Editor (Dashboard > SQL Editor > New Query),
-- AFTER ADMIN_BY_USER_ID_MIGRATION.sql. Fully idempotent, safe to run multiple times.
--
-- get_squad_host_whatsapp() returned a host's number for ANY squad id to any signed-in
-- user, so one account could script through every squad (squad ids are public) and
-- collect every host's phone, including from long-expired squads. The one-tap
-- "Message on WhatsApp" flow stays the same; the number is now only given out when:
--   1. the squad is still open and not expired (people who applied keep access),
--   2. neither person has blocked the other, and
--   3. the caller has looked up fewer than 20 different hosts in the last hour.
-- ═════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.whatsapp_lookups (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  looked_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_lookups_user_time ON public.whatsapp_lookups(user_id, looked_up_at);
-- Only reachable through the function below: RLS on, no policies
ALTER TABLE public.whatsapp_lookups ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_squad_host_whatsapp(p_post_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_post public.squad_posts;
  v_phone TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in to contact the squad host.';
  END IF;

  SELECT * INTO v_post FROM public.squad_posts WHERE id = p_post_id;
  IF NOT FOUND OR COALESCE(v_post.comm_method, 'whatsapp') <> 'whatsapp' THEN
    RETURN NULL;
  END IF;

  IF v_post.user_id <> v_uid THEN
    -- People who applied (pending or accepted) keep access after the squad fills up
    IF (v_post.is_open IS FALSE OR (v_post.expires_at IS NOT NULL AND v_post.expires_at < NOW()))
       AND NOT EXISTS (
         SELECT 1 FROM public.squad_applications
         WHERE post_id = p_post_id AND applicant_id = v_uid AND status IN ('pending', 'accepted')
       ) THEN
      RAISE EXCEPTION 'This squad is closed, so the host''s number is no longer shared.';
    END IF;
    IF public.is_blocked_between(v_uid, v_post.user_id) THEN
      RAISE EXCEPTION 'You can''t contact this host.';
    END IF;

    -- Re-opening a squad you already contacted never counts against the limit
    IF NOT EXISTS (SELECT 1 FROM public.whatsapp_lookups WHERE user_id = v_uid AND post_id = p_post_id) THEN
      IF (SELECT COUNT(*) FROM public.whatsapp_lookups
          WHERE user_id = v_uid AND looked_up_at > NOW() - INTERVAL '1 hour') >= 20 THEN
        RAISE EXCEPTION 'You''ve contacted a lot of hosts in the last hour. Please try again later.';
      END IF;
    END IF;
    INSERT INTO public.whatsapp_lookups (user_id, post_id, looked_up_at)
    VALUES (v_uid, p_post_id, NOW())
    ON CONFLICT (user_id, post_id) DO NOTHING;
  END IF;

  SELECT public.normalize_indian_phone(phone) INTO v_phone
  FROM public.profiles WHERE id = v_post.user_id;
  RETURN v_phone;
END;
$$;
REVOKE ALL ON FUNCTION public.get_squad_host_whatsapp(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_squad_host_whatsapp(UUID) TO authenticated;

SELECT 'WhatsApp lookup hardening applied.' AS status;
