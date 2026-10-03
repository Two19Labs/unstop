-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  SQUAD CONTACT + REAL-TIME CHAT MIGRATION
-- Run this ONCE in your Supabase SQL Editor (Dashboard > SQL Editor > New Query),
-- AFTER the earlier migrations (master / profile cooldown / security hardening).
-- Fully idempotent: safe to run more than once.
--
-- What it does:
--   1. WhatsApp numbers: strictly 10 digits (starts 6-9), no prefixes, stored as
--      digits only. Existing numbers are cleaned; ones that can't be fixed are
--      cleared (those users are asked for a number on their next login).
--      Adding a missing number never burns the 24-hour profile cooldown.
--   2. Every Team Finder number comes from the person's profile, live:
--        get_squad_host_whatsapp(post)  -> host's number, WhatsApp-mode squads only,
--                                          signed-in users only
--        get_my_applicants_whatsapp()   -> applicants' numbers, only for the host of
--                                          a WhatsApp-mode squad, once they applied
--      Numbers copied onto squads / applications are wiped and never stored again.
--   3. Chat mode: squad_conversations. A person requests to chat (with an intro),
--      the host accepts or declines, and only then can either side send messages.
--      Declined / cancelled requests can be sent again.
--   4. Real-time chat: no turn-taking, 10 messages per 10 seconds, live updates
--      for messages and conversations. No chat at all on WhatsApp-mode squads.
--   5. Existing 1:1 chat history moves into conversations.
-- ═════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. PHONE NUMBERS: ONE RULE EVERYWHERE
-- ─────────────────────────────────────────────────────────────────────────────────
-- Returns a clean 10-digit Indian mobile number, or NULL if it can't be one.
-- Strips spaces/dashes and a leading +91 / 91 / 0 that people paste in.
CREATE OR REPLACE FUNCTION public.normalize_indian_phone(p_raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_digits TEXT := regexp_replace(COALESCE(p_raw, ''), '\D', '', 'g');
BEGIN
  IF length(v_digits) = 12 AND left(v_digits, 2) = '91' THEN
    v_digits := right(v_digits, 10);
  ELSIF length(v_digits) = 11 AND left(v_digits, 1) = '0' THEN
    v_digits := right(v_digits, 10);
  END IF;
  IF v_digits ~ '^[6-9][0-9]{9}$' THEN
    RETURN v_digits;
  END IF;
  RETURN NULL;
END;
$$;

-- Profile trigger: normalizes the phone on every write, requires a valid one when a
-- user edits it, and lets someone ADD a missing number without the 24h cooldown.
-- (Same cooldown rules as before for every other field.)
CREATE OR REPLACE FUNCTION public.enforce_profile_cooldown()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_is_client BOOLEAN := COALESCE(auth.role(), '') IN ('authenticated', 'anon');
  v_clean_phone TEXT := public.normalize_indian_phone(NEW.phone);
BEGIN
  -- Phone: digits only, 10 long, or NULL. A user can never save an invalid one.
  IF v_is_client
     AND (TG_OP = 'INSERT' OR NEW.phone IS DISTINCT FROM OLD.phone)
     AND v_clean_phone IS NULL THEN
    RAISE EXCEPTION 'Please enter a valid 10-digit WhatsApp number.'
      USING ERRCODE = 'P0001', HINT = 'INVALID_PHONE';
  END IF;
  NEW.phone := v_clean_phone;

  IF NOT v_is_client THEN
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

  -- Adding a missing WhatsApp number (and changing nothing else) is always allowed
  -- and does not start the cooldown.
  IF public.normalize_indian_phone(OLD.phone) IS NULL
     AND ROW(OLD.full_name, OLD.college, OLD.course, OLD.year, OLD.bio,
             OLD.education_level, OLD.skills, OLD.avatar_url)
         IS NOT DISTINCT FROM
         ROW(NEW.full_name, NEW.college, NEW.course, NEW.year, NEW.bio,
             NEW.education_level, NEW.skills, NEW.avatar_url)
  THEN
    NEW.updated_at := NOW();
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

-- Clean every stored number (SQL editor runs are exempt from the user checks above)
UPDATE public.profiles
SET phone = public.normalize_indian_phone(phone)
WHERE phone IS DISTINCT FROM public.normalize_indian_phone(phone);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_10_digits;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_10_digits
  CHECK (phone IS NULL OR phone ~ '^[6-9][0-9]{9}$');

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. NO COPIED NUMBERS: squads and applications never store a phone again
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_squad_post_private_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_email := COALESCE(NULLIF(auth.jwt()->>'email', ''), NULLIF(NEW.created_by_email, ''), '');
    INSERT INTO public.squad_post_contacts (post_id, user_id, phone_number, created_by_email)
    VALUES (NEW.id, NEW.user_id, '', v_email)
    ON CONFLICT (post_id) DO UPDATE
      SET phone_number = '',
          created_by_email = EXCLUDED.created_by_email,
          updated_at = NOW();
    NEW.accepted_count := 0;
  ELSE
    NEW.user_id := OLD.user_id;
    -- accepted_count is only changed by respond_to_application / delete trigger
    IF COALESCE(auth.role(), '') IN ('authenticated', 'anon')
       AND current_setting('onestop.squad_rpc', true) IS DISTINCT FROM 'on' THEN
      NEW.accepted_count := OLD.accepted_count;
    END IF;
  END IF;

  IF NEW.comm_method IS DISTINCT FROM 'chat' THEN
    NEW.comm_method := 'whatsapp';
  END IF;

  NEW.phone_number := '';
  NEW.created_by_email := '';
  NEW.accepted_emails := '{}'::TEXT[];
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_squad_post_private_fields ON public.squad_posts;
CREATE TRIGGER trg_protect_squad_post_private_fields
  BEFORE INSERT OR UPDATE ON public.squad_posts
  FOR EACH ROW EXECUTE FUNCTION public.protect_squad_post_private_fields();

CREATE OR REPLACE FUNCTION public.guard_squad_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.squad_posts;
BEGIN
  -- Numbers are never stored on applications (looked up live from profiles)
  NEW.applicant_phone := NULL;
  NEW.lead_phone := NULL;

  -- Service role / dashboard / SQL editor
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT * INTO v_post FROM public.squad_posts WHERE id = NEW.post_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'This squad no longer exists.';
    END IF;
    IF v_post.user_id = auth.uid() THEN
      RAISE EXCEPTION 'You cannot apply to your own squad.';
    END IF;
    IF v_post.is_open IS FALSE OR COALESCE(v_post.spots_left, 0) <= 0 THEN
      RAISE EXCEPTION 'This squad is full or closed.';
    END IF;
    IF v_post.expires_at IS NOT NULL AND v_post.expires_at < NOW() THEN
      RAISE EXCEPTION 'This squad has expired.';
    END IF;

    NEW.applicant_id := auth.uid();
    NEW.applicant_email := COALESCE(NULLIF(auth.jwt()->>'email', ''), NEW.applicant_email);
    NEW.comm_method := COALESCE(v_post.comm_method, 'whatsapp');
    NEW.status := 'pending';
    NEW.created_at := NOW();
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- UPDATE via respond_to_application (squad lead)
  IF EXISTS (SELECT 1 FROM public.squad_posts WHERE id = OLD.post_id AND user_id = auth.uid()) THEN
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- UPDATE by applicant
  IF NEW.post_id IS DISTINCT FROM OLD.post_id
     OR NEW.applicant_id IS DISTINCT FROM OLD.applicant_id
     OR NEW.applicant_email IS DISTINCT FROM OLD.applicant_email THEN
    RAISE EXCEPTION 'Core application fields cannot be modified';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (NEW.status = 'pending' AND OLD.status IN ('declined', 'rejected', 'removed')) THEN
      RAISE EXCEPTION 'Only the squad lead can change an application status';
    END IF;
    -- Re-applying: the squad must still be open
    SELECT * INTO v_post FROM public.squad_posts WHERE id = OLD.post_id;
    IF v_post.is_open IS FALSE OR COALESCE(v_post.spots_left, 0) <= 0
       OR (v_post.expires_at IS NOT NULL AND v_post.expires_at < NOW()) THEN
      RAISE EXCEPTION 'This squad is full, closed or expired.';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_squad_application ON public.squad_applications;
CREATE TRIGGER guard_squad_application
  BEFORE INSERT OR UPDATE ON public.squad_applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_squad_application();

-- Accept / decline / remove: same as before, minus copying the lead's phone
CREATE OR REPLACE FUNCTION public.respond_to_application(p_app_id UUID, p_status TEXT)
RETURNS public.squad_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app  public.squad_applications;
  v_post public.squad_posts;
BEGIN
  IF p_status NOT IN ('accepted', 'declined', 'rejected', 'removed', 'pending') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  SELECT * INTO v_app FROM public.squad_applications WHERE id = p_app_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found: %', p_app_id;
  END IF;

  SELECT * INTO v_post FROM public.squad_posts WHERE id = v_app.post_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated squad post not found';
  END IF;

  IF v_post.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the squad creator can review applications';
  END IF;

  PERFORM set_config('onestop.squad_rpc', 'on', true);

  IF p_status = 'accepted' THEN
    IF v_app.status = 'accepted' THEN
      PERFORM set_config('onestop.squad_rpc', 'off', true);
      RETURN v_app;
    END IF;
    IF COALESCE(v_post.spots_left, 0) <= 0 THEN
      RAISE EXCEPTION 'No open spots left in this squad';
    END IF;

    UPDATE public.squad_posts
    SET spots_left = GREATEST(0, COALESCE(v_post.spots_left, 0) - 1),
        accepted_count = COALESCE(v_post.accepted_count, 0) + 1,
        is_open = (COALESCE(v_post.spots_left, 0) - 1 > 0),
        updated_at = NOW()
    WHERE id = v_post.id;

    UPDATE public.squad_applications
    SET status = 'accepted', lead_phone = NULL, updated_at = NOW()
    WHERE id = v_app.id
    RETURNING * INTO v_app;
  ELSE
    IF v_app.status = 'accepted' THEN
      UPDATE public.squad_posts
      SET spots_left = LEAST(COALESCE(v_post.total_members, 4), COALESCE(v_post.spots_left, 0) + 1),
          accepted_count = GREATEST(0, COALESCE(v_post.accepted_count, 0) - 1),
          is_open = true,
          updated_at = NOW()
      WHERE id = v_post.id;
    END IF;

    UPDATE public.squad_applications
    SET status = p_status, lead_phone = NULL, updated_at = NOW()
    WHERE id = v_app.id
    RETURNING * INTO v_app;
  END IF;

  PERFORM set_config('onestop.squad_rpc', 'off', true);
  RETURN v_app;
END;
$$;
GRANT EXECUTE ON FUNCTION public.respond_to_application(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_application(UUID, TEXT) TO service_role;

-- Wipe every number that was ever copied onto squads or applications
UPDATE public.squad_post_contacts SET phone_number = '', updated_at = NOW()
WHERE COALESCE(phone_number, '') <> '';
UPDATE public.squad_posts SET phone_number = ''
WHERE COALESCE(phone_number, '') <> '';
UPDATE public.squad_applications SET applicant_phone = NULL, lead_phone = NULL
WHERE applicant_phone IS NOT NULL OR lead_phone IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. LIVE NUMBER LOOKUPS (signed-in users only; never callable while logged out)
-- ─────────────────────────────────────────────────────────────────────────────────
-- Host's number for a WhatsApp-mode squad
CREATE OR REPLACE FUNCTION public.get_squad_host_whatsapp(p_post_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.squad_posts;
  v_phone TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Please sign in to contact the squad host.';
  END IF;

  SELECT * INTO v_post FROM public.squad_posts WHERE id = p_post_id;
  IF NOT FOUND OR COALESCE(v_post.comm_method, 'whatsapp') <> 'whatsapp' THEN
    RETURN NULL;
  END IF;

  SELECT public.normalize_indian_phone(phone) INTO v_phone
  FROM public.profiles WHERE id = v_post.user_id;
  RETURN v_phone;
END;
$$;
REVOKE ALL ON FUNCTION public.get_squad_host_whatsapp(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_squad_host_whatsapp(UUID) TO authenticated;

-- Applicants' numbers, for the host of WhatsApp-mode squads, once they requested to join
CREATE OR REPLACE FUNCTION public.get_my_applicants_whatsapp()
RETURNS TABLE (application_id UUID, phone TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, public.normalize_indian_phone(pr.phone)
  FROM public.squad_applications a
  JOIN public.squad_posts p ON p.id = a.post_id
  JOIN public.profiles pr ON pr.id = a.applicant_id
  WHERE auth.uid() IS NOT NULL
    AND p.user_id = auth.uid()
    AND COALESCE(p.comm_method, 'whatsapp') = 'whatsapp'
    AND a.status IN ('pending', 'accepted')
    AND public.normalize_indian_phone(pr.phone) IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.get_my_applicants_whatsapp() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_applicants_whatsapp() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. CONVERSATIONS (chat-mode squads: request -> host accepts -> real-time chat)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.squad_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.squad_posts(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_name TEXT DEFAULT '',
  member_college TEXT DEFAULT '',
  host_name TEXT DEFAULT '',
  intro TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'accepted', 'declined', 'cancelled')),
  responded_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_squad_conversations_host ON public.squad_conversations(host_id);
CREATE INDEX IF NOT EXISTS idx_squad_conversations_member ON public.squad_conversations(member_id);
ALTER TABLE public.squad_conversations ENABLE ROW LEVEL SECURITY;

-- Only the two people in a conversation can see it. All writes go through the
-- functions below (no insert/update/delete policies for clients).
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'squad_conversations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.squad_conversations', r.policyname);
  END LOOP;
END $$;
CREATE POLICY "squad_conversations_select" ON public.squad_conversations FOR SELECT TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = member_id);

-- Send (or re-send after decline/cancel) a chat request
CREATE OR REPLACE FUNCTION public.request_squad_chat(p_post_id UUID, p_intro TEXT)
RETURNS public.squad_conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_post public.squad_posts;
  v_conv public.squad_conversations;
  v_intro TEXT := btrim(COALESCE(p_intro, ''));
  v_name TEXT;
  v_college TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in to chat with the squad host.';
  END IF;
  IF v_intro = '' THEN
    RAISE EXCEPTION 'Add a short intro so the host knows who you are.';
  END IF;
  IF length(v_intro) > 300 THEN
    RAISE EXCEPTION 'Keep your intro under 300 characters.';
  END IF;

  SELECT * INTO v_post FROM public.squad_posts WHERE id = p_post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This squad no longer exists.';
  END IF;
  IF v_post.user_id = v_uid THEN
    RAISE EXCEPTION 'You cannot chat with your own squad.';
  END IF;
  IF COALESCE(v_post.comm_method, 'whatsapp') <> 'chat' THEN
    RAISE EXCEPTION 'This squad host uses WhatsApp, not in-app chat.';
  END IF;
  IF v_post.expires_at IS NOT NULL AND v_post.expires_at < NOW() THEN
    RAISE EXCEPTION 'This squad has expired.';
  END IF;

  SELECT NULLIF(btrim(full_name), ''), COALESCE(college, '') INTO v_name, v_college
  FROM public.profiles WHERE id = v_uid;

  SELECT * INTO v_conv FROM public.squad_conversations
  WHERE post_id = p_post_id AND member_id = v_uid FOR UPDATE;

  IF FOUND THEN
    IF v_conv.status IN ('requested', 'accepted') THEN
      RETURN v_conv;
    END IF;
    UPDATE public.squad_conversations
    SET status = 'requested',
        intro = v_intro,
        member_name = COALESCE(v_name, member_name),
        member_college = v_college,
        responded_at = NULL,
        created_at = NOW(),
        updated_at = NOW()
    WHERE id = v_conv.id
    RETURNING * INTO v_conv;
    RETURN v_conv;
  END IF;

  INSERT INTO public.squad_conversations
    (post_id, host_id, member_id, member_name, member_college, host_name, intro, status)
  VALUES
    (p_post_id, v_post.user_id, v_uid,
     COALESCE(v_name, split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1), 'Student'),
     v_college, COALESCE(v_post.created_by_name, ''), v_intro, 'requested')
  RETURNING * INTO v_conv;
  RETURN v_conv;
END;
$$;
REVOKE ALL ON FUNCTION public.request_squad_chat(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_squad_chat(UUID, TEXT) TO authenticated;

-- Host accepts or declines a chat request
CREATE OR REPLACE FUNCTION public.respond_to_chat_request(p_conversation_id UUID, p_accept BOOLEAN)
RETURNS public.squad_conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.squad_conversations;
BEGIN
  SELECT * INTO v_conv FROM public.squad_conversations WHERE id = p_conversation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chat request not found.';
  END IF;
  IF v_conv.host_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the squad host can respond to chat requests.';
  END IF;
  IF v_conv.status <> 'requested' THEN
    RETURN v_conv;
  END IF;

  UPDATE public.squad_conversations
  SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
      responded_at = NOW(),
      updated_at = NOW()
  WHERE id = v_conv.id
  RETURNING * INTO v_conv;
  RETURN v_conv;
END;
$$;
REVOKE ALL ON FUNCTION public.respond_to_chat_request(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_chat_request(UUID, BOOLEAN) TO authenticated;

-- Person cancels their own pending chat request
CREATE OR REPLACE FUNCTION public.cancel_chat_request(p_conversation_id UUID)
RETURNS public.squad_conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.squad_conversations;
BEGIN
  SELECT * INTO v_conv FROM public.squad_conversations WHERE id = p_conversation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chat request not found.';
  END IF;
  IF v_conv.member_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the person who sent this request can cancel it.';
  END IF;
  IF v_conv.status <> 'requested' THEN
    RETURN v_conv;
  END IF;

  UPDATE public.squad_conversations
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = v_conv.id
  RETURNING * INTO v_conv;
  RETURN v_conv;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_chat_request(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_chat_request(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. MESSAGES BELONG TO CONVERSATIONS
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.squad_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.squad_conversations(id) ON DELETE CASCADE;
-- Messages belong to a conversation now, not a join request. Older setups made
-- application_id / competition_id required and capped messages at 1000 characters.
ALTER TABLE public.squad_messages ALTER COLUMN application_id DROP NOT NULL;
ALTER TABLE public.squad_messages ALTER COLUMN competition_id DROP NOT NULL;
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.squad_messages'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%content%'
  LOOP
    EXECUTE format('ALTER TABLE public.squad_messages DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;
ALTER TABLE public.squad_messages ADD CONSTRAINT squad_messages_content_length_check
  CHECK (char_length(content) > 0 AND char_length(content) <= 2000);
CREATE INDEX IF NOT EXISTS idx_squad_messages_conversation ON public.squad_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_squad_messages_sender_created ON public.squad_messages(sender_id, created_at DESC);

-- Move existing 1:1 threads (keyed by application) into accepted conversations
INSERT INTO public.squad_conversations
  (post_id, host_id, member_id, member_name, member_college, host_name, intro, status, responded_at, last_message_at, created_at, updated_at)
SELECT DISTINCT ON (a.post_id, a.applicant_id)
  a.post_id, p.user_id, a.applicant_id, COALESCE(a.applicant_name, ''), COALESCE(a.applicant_college, ''),
  COALESCE(p.created_by_name, ''), '', 'accepted', NOW(), t.last_at, t.first_at, NOW()
FROM (
  SELECT application_id, min(created_at) AS first_at, max(created_at) AS last_at
  FROM public.squad_messages
  WHERE application_id IS NOT NULL AND conversation_id IS NULL
  GROUP BY application_id
) t
JOIN public.squad_applications a ON a.id::text = t.application_id
JOIN public.squad_posts p ON p.id = a.post_id
WHERE a.applicant_id IS DISTINCT FROM p.user_id
ORDER BY a.post_id, a.applicant_id, t.last_at DESC
ON CONFLICT (post_id, member_id) DO NOTHING;

UPDATE public.squad_messages m
SET conversation_id = c.id
FROM public.squad_applications a
JOIN public.squad_conversations c ON c.post_id = a.post_id AND c.member_id = a.applicant_id
WHERE m.conversation_id IS NULL
  AND m.application_id IS NOT NULL
  AND a.id::text = m.application_id;

-- Can the current user send in this conversation right now?
CREATE OR REPLACE FUNCTION public.can_send_in_conversation(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.squad_conversations;
  v_post public.squad_posts;
BEGIN
  IF auth.uid() IS NULL OR p_conversation_id IS NULL THEN
    RETURN false;
  END IF;
  SELECT * INTO v_conv FROM public.squad_conversations WHERE id = p_conversation_id;
  IF NOT FOUND OR auth.uid() NOT IN (v_conv.host_id, v_conv.member_id) THEN
    RETURN false;
  END IF;
  IF v_conv.status <> 'accepted' THEN
    RETURN false;
  END IF;
  SELECT * INTO v_post FROM public.squad_posts WHERE id = v_conv.post_id;
  IF NOT FOUND OR COALESCE(v_post.comm_method, 'whatsapp') <> 'chat' THEN
    RETURN false;
  END IF;
  -- Removed from the squad: the thread becomes read-only
  IF EXISTS (SELECT 1 FROM public.squad_applications
             WHERE post_id = v_conv.post_id AND applicant_id = v_conv.member_id AND status = 'removed') THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.can_send_in_conversation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_send_in_conversation(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_squad_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.squad_conversations;
  v_post public.squad_posts;
  v_name TEXT;
  v_recent INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;  -- service role / dashboard
  END IF;

  IF NEW.conversation_id IS NULL THEN
    RAISE EXCEPTION 'Please refresh the page to use the updated chat.';
  END IF;

  SELECT * INTO v_conv FROM public.squad_conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND OR auth.uid() NOT IN (v_conv.host_id, v_conv.member_id) THEN
    RAISE EXCEPTION 'You are not part of this chat.';
  END IF;
  IF NOT public.can_send_in_conversation(NEW.conversation_id) THEN
    RAISE EXCEPTION 'This chat is closed.';
  END IF;

  NEW.content := btrim(COALESCE(NEW.content, ''));
  IF NEW.content = '' THEN
    RAISE EXCEPTION 'Message cannot be empty.';
  END IF;
  IF length(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'Message is too long (max 2000 characters).';
  END IF;

  -- Flood limit: 10 messages per 10 seconds per person
  SELECT count(*) INTO v_recent FROM public.squad_messages
  WHERE sender_id = auth.uid() AND created_at > NOW() - INTERVAL '10 seconds';
  IF v_recent >= 10 THEN
    RAISE EXCEPTION 'You''re sending messages too fast. Wait a few seconds.';
  END IF;

  SELECT * INTO v_post FROM public.squad_posts WHERE id = v_conv.post_id;
  SELECT NULLIF(btrim(full_name), '') INTO v_name FROM public.profiles WHERE id = auth.uid();
  NEW.sender_id := auth.uid();
  NEW.sender_role := CASE WHEN auth.uid() = v_conv.host_id THEN 'lead' ELSE 'applicant' END;
  NEW.sender_name := COALESCE(v_name, split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1), 'Student');
  NEW.post_id := v_conv.post_id::text;
  NEW.competition_id := COALESCE(v_post.competition_id, '');
  NEW.application_id := NULL;
  NEW.created_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_squad_message ON public.squad_messages;
CREATE TRIGGER trg_guard_squad_message
  BEFORE INSERT ON public.squad_messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_squad_message();

-- Older setups created user_notifications without an id default and with
-- required user_email / body columns, which made every chat notification fail.
ALTER TABLE public.user_notifications ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.user_notifications ALTER COLUMN user_email DROP NOT NULL;
ALTER TABLE public.user_notifications ALTER COLUMN body DROP NOT NULL;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- One unread notification per conversation for the other person; also bumps
-- last_message_at so inboxes can sort by activity.
CREATE OR REPLACE FUNCTION public.notify_squad_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.squad_conversations;
  v_post public.squad_posts;
  v_recipient UUID;
  v_recipient_email TEXT;
  v_thread TEXT;
  v_snippet TEXT := CASE WHEN length(NEW.content) > 80 THEN left(NEW.content, 80) || '…' ELSE NEW.content END;
BEGIN
  IF NEW.conversation_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT * INTO v_conv FROM public.squad_conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  UPDATE public.squad_conversations SET last_message_at = NEW.created_at WHERE id = v_conv.id;

  -- A notification problem must never stop the message itself from being sent
  BEGIN
    SELECT * INTO v_post FROM public.squad_posts WHERE id = v_conv.post_id;
    v_recipient := CASE WHEN NEW.sender_id = v_conv.host_id THEN v_conv.member_id ELSE v_conv.host_id END;
    SELECT COALESCE(email, '') INTO v_recipient_email FROM auth.users WHERE id = v_recipient;
    v_thread := 'conv:' || v_conv.id::text;

    UPDATE public.user_notifications
    SET title = 'New message from ' || NEW.sender_name,
        message = v_snippet,
        body = v_snippet,
        created_at = NOW(),
        updated_at = NOW(),
        data = jsonb_build_object(
          'thread', v_thread,
          'conversation_id', v_conv.id,
          'post_id', v_conv.post_id,
          'competition_name', v_post.competition_name,
          'count', COALESCE((data->>'count')::int, 1) + 1
        )
    WHERE user_id = v_recipient
      AND type = 'new_message'
      AND is_read = false
      AND data->>'thread' = v_thread;

    IF NOT FOUND THEN
      INSERT INTO public.user_notifications (id, user_id, user_email, type, title, body, message, link, data, is_read, read)
      VALUES (
        gen_random_uuid()::text,
        v_recipient,
        COALESCE(v_recipient_email, ''),
        'new_message',
        'New message from ' || NEW.sender_name,
        v_snippet,
        v_snippet,
        '/teams?chat=' || v_conv.post_id::text,
        jsonb_build_object(
          'thread', v_thread,
          'conversation_id', v_conv.id,
          'post_id', v_conv.post_id,
          'competition_name', v_post.competition_name,
          'count', 1
        ),
        false,
        false
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_squad_message skipped: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_squad_message ON public.squad_messages;
CREATE TRIGGER trg_notify_squad_message
  AFTER INSERT ON public.squad_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_squad_message();

-- Message access: only the two people in the conversation.
-- Drop every existing policy on the table first (older setups used other names).
ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'squad_messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.squad_messages', r.policyname);
  END LOOP;
END $$;
CREATE POLICY "squad_messages_select" ON public.squad_messages FOR SELECT TO authenticated
  USING (
    conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.squad_conversations c
      WHERE c.id = squad_messages.conversation_id
        AND (c.host_id = auth.uid() OR c.member_id = auth.uid())
    )
  );
CREATE POLICY "squad_messages_insert" ON public.squad_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.can_send_in_conversation(conversation_id));

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. ACCOUNT DELETION (also clears conversations)
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
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.bookmarks WHERE user_id = v_user_id;
  DELETE FROM public.squad_conversations WHERE member_id = v_user_id OR host_id = v_user_id;
  DELETE FROM public.squad_applications WHERE applicant_id = v_user_id;
  DELETE FROM public.squad_posts WHERE user_id = v_user_id;          -- cascades contacts + applications
  DELETE FROM public.user_notification_states WHERE user_id = v_user_id;
  DELETE FROM public.user_notifications WHERE user_id = v_user_id OR (v_email <> '' AND lower(user_email) = v_email);
  DELETE FROM public.squad_messages WHERE sender_id = v_user_id;
  DELETE FROM public.profiles WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 7. REAL-TIME (messages + conversations; RLS decides who receives what)
-- ─────────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_conversations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

SELECT 'OneStop squad contact + real-time chat migration applied.' AS status;
