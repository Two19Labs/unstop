-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  CHAT UPGRADE MIGRATION
-- Run this ONCE in your Supabase SQL Editor (Dashboard > SQL Editor > New Query),
-- AFTER SQUAD_CONTACT_AND_CHAT_MIGRATION.sql and SQUAD_CHAT_HOTFIX.sql.
-- Fully idempotent: safe to run more than once.
--
-- What it does:
--   1. Read markers per conversation -> unread counts, "Seen", clearing the bell.
--   2. get_my_chat_summaries(): unread count + last message preview per chat.
--   3. Bell notifications read "<name> messaged you" and clear when the chat opens.
--   4. Unsend your own message within 1 hour (the text is wiped).
--   5. Block: the chat goes read-only for both; the blocked person's chat and join
--      requests to your squads are silently hidden from you. Unblock any time.
--   6. Report a chat: saved with a snapshot of recent messages, admins only.
-- ═════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. COLUMNS + TABLES
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.squad_conversations ADD COLUMN IF NOT EXISTS host_last_read_at TIMESTAMPTZ;
ALTER TABLE public.squad_conversations ADD COLUMN IF NOT EXISTS member_last_read_at TIMESTAMPTZ;
ALTER TABLE public.squad_conversations ADD COLUMN IF NOT EXISTS hidden_from_host BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS hidden_from_lead BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.squad_messages ADD COLUMN IF NOT EXISTS unsent_at TIMESTAMPTZ;

-- Existing chats start as "read", so nobody gets a flood of old unread counts
UPDATE public.squad_conversations
SET host_last_read_at = COALESCE(host_last_read_at, NOW()),
    member_last_read_at = COALESCE(member_last_read_at, NOW())
WHERE status = 'accepted' AND (host_last_read_at IS NULL OR member_last_read_at IS NULL);

-- Message text may be empty only once it has been unsent
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
  CHECK (unsent_at IS NOT NULL OR (char_length(content) > 0 AND char_length(content) <= 2000));

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name TEXT DEFAULT '',
  reported_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_name TEXT DEFAULT '',
  conversation_id UUID REFERENCES public.squad_conversations(id) ON DELETE SET NULL,
  competition_name TEXT DEFAULT '',
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  note TEXT DEFAULT '',
  messages JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_reports_created ON public.chat_reports(created_at DESC);
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;

-- Policies: blocks are visible to the blocker only; reports to admins only.
-- All writes go through the functions below.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('user_blocks', 'chat_reports')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;
CREATE POLICY "user_blocks_select_own" ON public.user_blocks FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);
CREATE POLICY "chat_reports_select_admin" ON public.chat_reports FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "chat_reports_update_admin" ON public.chat_reports FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Is there a block between these two people (either direction)?
CREATE OR REPLACE FUNCTION public.is_blocked_between(p_a UUID, p_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = p_a AND blocked_id = p_b) OR (blocker_id = p_b AND blocked_id = p_a)
  );
$$;
REVOKE ALL ON FUNCTION public.is_blocked_between(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(UUID, UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. HIDE REQUESTS FROM BLOCKED PEOPLE (they are never told)
-- ─────────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "squad_conversations_select" ON public.squad_conversations;
CREATE POLICY "squad_conversations_select" ON public.squad_conversations FOR SELECT TO authenticated
  USING (auth.uid() = member_id OR (auth.uid() = host_id AND NOT hidden_from_host));

DROP POLICY IF EXISTS "squad_apps_select" ON public.squad_applications;
CREATE POLICY "squad_apps_select" ON public.squad_applications FOR SELECT TO authenticated
  USING (
    applicant_id = auth.uid()
    OR (NOT hidden_from_lead AND post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid()))
  );

-- Applications: same guard as before, plus hiding requests from people the host blocked
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
    NEW.hidden_from_lead := EXISTS (
      SELECT 1 FROM public.user_blocks WHERE blocker_id = v_post.user_id AND blocked_id = auth.uid()
    );
    NEW.created_at := NOW();
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- UPDATE via respond_to_application (squad lead)
  IF EXISTS (SELECT 1 FROM public.squad_posts WHERE id = OLD.post_id AND user_id = auth.uid()) THEN
    -- Only block_user / unblock_user may change hidden_from_lead
    IF current_setting('onestop.block_rpc', true) IS DISTINCT FROM 'on' THEN
      NEW.hidden_from_lead := OLD.hidden_from_lead;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- UPDATE by applicant
  IF NEW.post_id IS DISTINCT FROM OLD.post_id
     OR NEW.applicant_id IS DISTINCT FROM OLD.applicant_id
     OR NEW.applicant_email IS DISTINCT FROM OLD.applicant_email THEN
    RAISE EXCEPTION 'Core application fields cannot be modified';
  END IF;
  NEW.hidden_from_lead := OLD.hidden_from_lead;

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
    -- A blocked person re-applying stays hidden
    NEW.hidden_from_lead := EXISTS (
      SELECT 1 FROM public.user_blocks WHERE blocker_id = v_post.user_id AND blocked_id = auth.uid()
    );
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_squad_application ON public.squad_applications;
CREATE TRIGGER guard_squad_application
  BEFORE INSERT OR UPDATE ON public.squad_applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_squad_application();

-- Chat requests: same as before, plus hiding requests from people the host blocked
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
  v_hidden BOOLEAN;
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

  v_hidden := EXISTS (SELECT 1 FROM public.user_blocks WHERE blocker_id = v_post.user_id AND blocked_id = v_uid);

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
        hidden_from_host = v_hidden,
        responded_at = NULL,
        created_at = NOW(),
        updated_at = NOW()
    WHERE id = v_conv.id
    RETURNING * INTO v_conv;
    RETURN v_conv;
  END IF;

  INSERT INTO public.squad_conversations
    (post_id, host_id, member_id, member_name, member_college, host_name, intro, status, hidden_from_host)
  VALUES
    (p_post_id, v_post.user_id, v_uid,
     COALESCE(v_name, split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1), 'Student'),
     v_college, COALESCE(v_post.created_by_name, ''), v_intro, 'requested', v_hidden)
  RETURNING * INTO v_conv;
  RETURN v_conv;
END;
$$;
REVOKE ALL ON FUNCTION public.request_squad_chat(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_squad_chat(UUID, TEXT) TO authenticated;

-- A host can't act on a request that is hidden from them
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
  IF NOT FOUND OR v_conv.hidden_from_host THEN
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
      host_last_read_at = NOW(),
      updated_at = NOW()
  WHERE id = v_conv.id
  RETURNING * INTO v_conv;
  RETURN v_conv;
END;
$$;
REVOKE ALL ON FUNCTION public.respond_to_chat_request(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_chat_request(UUID, BOOLEAN) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. SENDING: blocked chats are read-only for both people
-- ─────────────────────────────────────────────────────────────────────────────────
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
  -- Blocked (either direction): read-only
  IF public.is_blocked_between(v_conv.host_id, v_conv.member_id) THEN
    RETURN false;
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.can_send_in_conversation(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_send_in_conversation(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. READ MARKERS, UNREAD COUNTS, PREVIEWS
-- ─────────────────────────────────────────────────────────────────────────────────
-- Marks a chat read for the current user and clears its bell notification
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS public.squad_conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.squad_conversations;
BEGIN
  SELECT * INTO v_conv FROM public.squad_conversations WHERE id = p_conversation_id;
  IF NOT FOUND OR auth.uid() IS NULL OR auth.uid() NOT IN (v_conv.host_id, v_conv.member_id) THEN
    RAISE EXCEPTION 'Chat not found.';
  END IF;

  IF auth.uid() = v_conv.host_id THEN
    UPDATE public.squad_conversations SET host_last_read_at = NOW() WHERE id = v_conv.id RETURNING * INTO v_conv;
  ELSE
    UPDATE public.squad_conversations SET member_last_read_at = NOW() WHERE id = v_conv.id RETURNING * INTO v_conv;
  END IF;

  UPDATE public.user_notifications
  SET is_read = true, read = true
  WHERE user_id = auth.uid()
    AND type = 'new_message'
    AND is_read = false
    AND data->>'thread' = 'conv:' || v_conv.id::text;

  RETURN v_conv;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_conversation_read(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID) TO authenticated;

-- One row per chat I'm in: unread count, last message preview, and whether it's blocked
CREATE OR REPLACE FUNCTION public.get_my_chat_summaries()
RETURNS TABLE (
  conversation_id UUID,
  unread INT,
  last_message TEXT,
  last_sender_id UUID,
  last_message_at TIMESTAMPTZ,
  last_unsent BOOLEAN,
  is_blocked BOOLEAN,
  blocked_by_me BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    (SELECT count(*)::int FROM public.squad_messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id IS DISTINCT FROM auth.uid()
        AND m.unsent_at IS NULL
        AND m.created_at > COALESCE(CASE WHEN c.host_id = auth.uid() THEN c.host_last_read_at ELSE c.member_last_read_at END,
                                    '-infinity'::timestamptz)),
    lm.content,
    lm.sender_id,
    lm.created_at,
    lm.unsent_at IS NOT NULL,
    public.is_blocked_between(c.host_id, c.member_id),
    EXISTS (SELECT 1 FROM public.user_blocks b
            WHERE b.blocker_id = auth.uid()
              AND b.blocked_id = CASE WHEN c.host_id = auth.uid() THEN c.member_id ELSE c.host_id END)
  FROM public.squad_conversations c
  LEFT JOIN LATERAL (
    SELECT m.content, m.sender_id, m.created_at, m.unsent_at
    FROM public.squad_messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE auth.uid() IS NOT NULL
    AND (c.member_id = auth.uid() OR (c.host_id = auth.uid() AND NOT c.hidden_from_host));
$$;
REVOKE ALL ON FUNCTION public.get_my_chat_summaries() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_chat_summaries() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. UNSEND (own message, within 1 hour; the text is wiped)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unsend_message(p_message_id UUID)
RETURNS public.squad_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg public.squad_messages;
BEGIN
  SELECT * INTO v_msg FROM public.squad_messages WHERE id = p_message_id FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR v_msg.sender_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You can only unsend your own messages.';
  END IF;
  IF v_msg.unsent_at IS NOT NULL THEN
    RETURN v_msg;
  END IF;
  IF v_msg.created_at < NOW() - INTERVAL '1 hour' THEN
    RAISE EXCEPTION 'Messages can only be unsent within 1 hour.';
  END IF;

  UPDATE public.squad_messages
  SET content = '', unsent_at = NOW()
  WHERE id = v_msg.id
  RETURNING * INTO v_msg;
  RETURN v_msg;
END;
$$;
REVOKE ALL ON FUNCTION public.unsend_message(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unsend_message(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. BLOCK / UNBLOCK
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.block_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Please sign in.';
  END IF;
  IF p_user_id IS NULL OR p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot block yourself.';
  END IF;
  -- Only people you share a chat or a squad request with
  IF NOT EXISTS (
    SELECT 1 FROM public.squad_conversations c
    WHERE (c.host_id = auth.uid() AND c.member_id = p_user_id)
       OR (c.member_id = auth.uid() AND c.host_id = p_user_id)
  ) AND NOT EXISTS (
    SELECT 1 FROM public.squad_applications a JOIN public.squad_posts p ON p.id = a.post_id
    WHERE (p.user_id = auth.uid() AND a.applicant_id = p_user_id)
       OR (a.applicant_id = auth.uid() AND p.user_id = p_user_id)
  ) THEN
    RAISE EXCEPTION 'You can only block people you have been in touch with.';
  END IF;

  SELECT COALESCE(NULLIF(btrim(full_name), ''), 'Student') INTO v_name FROM public.profiles WHERE id = p_user_id;

  INSERT INTO public.user_blocks (blocker_id, blocked_id, blocked_name)
  VALUES (auth.uid(), p_user_id, COALESCE(v_name, 'Student'))
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

  -- Hide their pending requests to my squads
  PERFORM set_config('onestop.block_rpc', 'on', true);
  UPDATE public.squad_conversations
  SET hidden_from_host = true, updated_at = NOW()
  WHERE host_id = auth.uid() AND member_id = p_user_id AND status = 'requested';

  UPDATE public.squad_applications a
  SET hidden_from_lead = true
  FROM public.squad_posts p
  WHERE p.id = a.post_id AND p.user_id = auth.uid() AND a.applicant_id = p_user_id AND a.status = 'pending';
  PERFORM set_config('onestop.block_rpc', 'off', true);
END;
$$;
REVOKE ALL ON FUNCTION public.block_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.block_user(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.unblock_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Please sign in.';
  END IF;
  DELETE FROM public.user_blocks WHERE blocker_id = auth.uid() AND blocked_id = p_user_id;

  -- Requests they sent while blocked become visible again
  PERFORM set_config('onestop.block_rpc', 'on', true);
  UPDATE public.squad_conversations
  SET hidden_from_host = false, updated_at = NOW()
  WHERE host_id = auth.uid() AND member_id = p_user_id AND hidden_from_host;

  UPDATE public.squad_applications a
  SET hidden_from_lead = false
  FROM public.squad_posts p
  WHERE p.id = a.post_id AND p.user_id = auth.uid() AND a.applicant_id = p_user_id AND a.hidden_from_lead;
  PERFORM set_config('onestop.block_rpc', 'off', true);
END;
$$;
REVOKE ALL ON FUNCTION public.unblock_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unblock_user(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 7. REPORT A CHAT (admins review it in the Admin Console)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.report_chat(p_conversation_id UUID, p_reason TEXT, p_note TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.squad_conversations;
  v_post public.squad_posts;
  v_reported UUID;
  v_id UUID;
  v_reporter_name TEXT;
  v_reported_name TEXT;
BEGIN
  SELECT * INTO v_conv FROM public.squad_conversations WHERE id = p_conversation_id;
  IF NOT FOUND OR auth.uid() IS NULL OR auth.uid() NOT IN (v_conv.host_id, v_conv.member_id) THEN
    RAISE EXCEPTION 'Chat not found.';
  END IF;
  IF p_reason NOT IN ('spam', 'harassment', 'inappropriate', 'other') THEN
    RAISE EXCEPTION 'Pick a reason for the report.';
  END IF;

  v_reported := CASE WHEN auth.uid() = v_conv.host_id THEN v_conv.member_id ELSE v_conv.host_id END;
  SELECT * INTO v_post FROM public.squad_posts WHERE id = v_conv.post_id;
  SELECT COALESCE(NULLIF(btrim(full_name), ''), 'Student') INTO v_reporter_name FROM public.profiles WHERE id = auth.uid();
  SELECT COALESCE(NULLIF(btrim(full_name), ''), 'Student') INTO v_reported_name FROM public.profiles WHERE id = v_reported;

  INSERT INTO public.chat_reports
    (reporter_id, reporter_name, reported_id, reported_name, conversation_id, competition_name, reason, note, messages)
  VALUES (
    auth.uid(), COALESCE(v_reporter_name, 'Student'), v_reported, COALESCE(v_reported_name, 'Student'),
    v_conv.id, COALESCE(v_post.competition_name, ''), p_reason, left(btrim(COALESCE(p_note, '')), 1000),
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('sender', s.sender_name, 'content', s.content, 'at', s.created_at) ORDER BY s.created_at)
      FROM (
        SELECT sender_name, content, created_at FROM public.squad_messages
        WHERE conversation_id = v_conv.id AND unsent_at IS NULL
        ORDER BY created_at DESC LIMIT 30
      ) s
    ), '[]'::jsonb)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.report_chat(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_chat(UUID, TEXT, TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 8. BELL NOTIFICATION: "<name> messaged you" (never blocks the message itself)
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_notifications ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.user_notifications ALTER COLUMN user_email DROP NOT NULL;
ALTER TABLE public.user_notifications ALTER COLUMN body DROP NOT NULL;

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

  -- Sending a message also means you've read the chat up to here
  UPDATE public.squad_conversations
  SET last_message_at = NEW.created_at,
      host_last_read_at = CASE WHEN NEW.sender_id = v_conv.host_id THEN NEW.created_at ELSE host_last_read_at END,
      member_last_read_at = CASE WHEN NEW.sender_id = v_conv.member_id THEN NEW.created_at ELSE member_last_read_at END
  WHERE id = v_conv.id;

  -- A notification problem must never stop the message itself from being sent
  BEGIN
    SELECT * INTO v_post FROM public.squad_posts WHERE id = v_conv.post_id;
    v_recipient := CASE WHEN NEW.sender_id = v_conv.host_id THEN v_conv.member_id ELSE v_conv.host_id END;
    SELECT COALESCE(email, '') INTO v_recipient_email FROM auth.users WHERE id = v_recipient;
    v_thread := 'conv:' || v_conv.id::text;

    UPDATE public.user_notifications
    SET title = NEW.sender_name || ' messaged you',
        message = v_snippet,
        body = v_snippet,
        created_at = NOW(),
        updated_at = NOW(),
        data = jsonb_build_object(
          'thread', v_thread,
          'conversation_id', v_conv.id,
          'post_id', v_conv.post_id,
          'sender_name', NEW.sender_name,
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
        NEW.sender_name || ' messaged you',
        v_snippet,
        v_snippet,
        '/?chat=' || v_conv.id::text,
        jsonb_build_object(
          'thread', v_thread,
          'conversation_id', v_conv.id,
          'post_id', v_conv.post_id,
          'sender_name', NEW.sender_name,
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

-- ─────────────────────────────────────────────────────────────────────────────────
-- 9. ACCOUNT DELETION (also clears blocks)
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
  DELETE FROM public.user_blocks WHERE blocker_id = v_user_id OR blocked_id = v_user_id;
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
-- 10. REAL-TIME (unsends + read markers reach the other person live)
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
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_blocks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

SELECT 'OneStop chat upgrade migration applied.' AS status;
