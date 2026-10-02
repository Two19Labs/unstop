-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  SECURITY HARDENING MIGRATION
-- Run this ONCE in your Supabase SQL Editor (Dashboard > SQL Editor > New Query),
-- AFTER PROFILE_COOLDOWN_AND_PRIVACY_MIGRATION.sql.
-- Fully idempotent, safe to run multiple times. Also appended to the end of
-- supabase_master_migration.sql (section 13) so a re-run of master never reopens holes.
--
-- What it does:
--   1. One admin list in the database (app_admins + is_admin()).
--   2. Drops EVERY existing RLS policy on the app tables (old migrations left
--      permissive policies under other names) and recreates a strict set.
--   3. Competitions: public read-only; writes need the service role key or admin.
--   4. Squad contact details (lead phone, creator email) move to a private table;
--      accepted members are tracked by user (accepted_count), not by email.
--   5. One application per person per squad; no applying to your own, closed,
--      full or expired squad; applicant email is locked to the account email.
--   6. Squad chat: only the lead and that applicant (or accepted members for the
--      group thread) can read/post; role + name set by the server; pending chats
--      strictly alternate turns.
--   7. Chat notifications are created by the database (users can no longer insert
--      notifications for other users).
--   8. Expired squads are kept (no more auto-delete), they just stop showing.
-- ═════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. ADMINS (single source of truth; the client asks is_admin())
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_admins (
  email TEXT PRIMARY KEY
);
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;  -- no policies: not readable by clients
INSERT INTO public.app_admins (email) VALUES ('aditya.25015@sscbs.du.ac.in') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_admins
    WHERE lower(email) = lower(COALESCE(auth.jwt()->>'email', ''))
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. NEW COLUMNS / TABLES
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS accepted_count INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.squad_post_contacts (
  post_id UUID PRIMARY KEY REFERENCES public.squad_posts(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT DEFAULT '',
  created_by_email TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_squad_post_contacts_user_id ON public.squad_post_contacts(user_id);
ALTER TABLE public.squad_post_contacts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created ON public.user_notifications(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. STOP AUTO-DELETING EXPIRED SQUADS (they are hidden by the app instead)
-- ─────────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_cleanup_expired_posts ON public.squad_posts;
DROP FUNCTION IF EXISTS public.trigger_cleanup_expired_posts();
DROP FUNCTION IF EXISTS public.delete_expired_squad_posts();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. ONE APPLICATION PER PERSON PER SQUAD (dedupe first, keeping the best row)
-- ─────────────────────────────────────────────────────────────────────────────────
DELETE FROM public.squad_applications a
USING (
  SELECT id,
         row_number() OVER (
           PARTITION BY post_id, applicant_id
           ORDER BY (status = 'accepted') DESC, (status = 'pending') DESC, updated_at DESC NULLS LAST, created_at DESC
         ) AS rn
  FROM public.squad_applications
) d
WHERE a.id = d.id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_squad_applications_post_applicant
  ON public.squad_applications(post_id, applicant_id);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. MOVE CONTACT DETAILS OFF THE PUBLIC squad_posts TABLE
-- ─────────────────────────────────────────────────────────────────────────────────
INSERT INTO public.squad_post_contacts (post_id, user_id, phone_number, created_by_email)
SELECT id, user_id, COALESCE(phone_number, ''), COALESCE(created_by_email, '')
FROM public.squad_posts
WHERE COALESCE(phone_number, '') <> '' OR COALESCE(created_by_email, '') <> ''
ON CONFLICT (post_id) DO UPDATE
  SET phone_number = CASE WHEN EXCLUDED.phone_number <> '' THEN EXCLUDED.phone_number ELSE public.squad_post_contacts.phone_number END,
      created_by_email = CASE WHEN EXCLUDED.created_by_email <> '' THEN EXCLUDED.created_by_email ELSE public.squad_post_contacts.created_by_email END,
      updated_at = NOW();

-- accepted_count replaces accepted_emails (members are tracked by user, not email)
UPDATE public.squad_posts p
SET accepted_count = COALESCE((
  SELECT count(*) FROM public.squad_applications a
  WHERE a.post_id = p.id AND a.status = 'accepted'
), 0);

-- Strips private fields from every write to squad_posts and stores them privately.
-- Runs BEFORE the row is written, so realtime never broadcasts them.
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
    VALUES (NEW.id, NEW.user_id,
            CASE WHEN NEW.comm_method = 'chat' THEN '' ELSE COALESCE(NEW.phone_number, '') END,
            v_email)
    ON CONFLICT (post_id) DO UPDATE
      SET phone_number = EXCLUDED.phone_number,
          created_by_email = EXCLUDED.created_by_email,
          updated_at = NOW();
    NEW.accepted_count := 0;
  ELSE
    IF NEW.comm_method = 'chat' THEN
      UPDATE public.squad_post_contacts SET phone_number = '', updated_at = NOW() WHERE post_id = NEW.id;
    ELSIF COALESCE(NEW.phone_number, '') <> '' AND NEW.phone_number IS DISTINCT FROM OLD.phone_number THEN
      INSERT INTO public.squad_post_contacts (post_id, user_id, phone_number)
      VALUES (NEW.id, NEW.user_id, NEW.phone_number)
      ON CONFLICT (post_id) DO UPDATE SET phone_number = EXCLUDED.phone_number, updated_at = NOW();
    END IF;
    NEW.user_id := OLD.user_id;
    -- accepted_count is only changed by respond_to_application / delete trigger
    IF COALESCE(auth.role(), '') IN ('authenticated', 'anon')
       AND current_setting('onestop.squad_rpc', true) IS DISTINCT FROM 'on' THEN
      NEW.accepted_count := OLD.accepted_count;
    END IF;
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

-- Scrub what is already stored (contacts were copied above)
UPDATE public.squad_posts
SET phone_number = '', created_by_email = '', accepted_emails = '{}'::TEXT[]
WHERE COALESCE(phone_number, '') <> '' OR COALESCE(created_by_email, '') <> '' OR COALESCE(array_length(accepted_emails, 1), 0) > 0;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. APPLICATION GUARD (insert + applicant updates)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_squad_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.squad_posts;
BEGIN
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
    NEW.status := 'pending';
    NEW.lead_phone := NULL;
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
     OR NEW.applicant_email IS DISTINCT FROM OLD.applicant_email
     OR NEW.lead_phone IS DISTINCT FROM OLD.lead_phone THEN
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

-- Reclaim a spot when an accepted application is deleted/withdrawn
CREATE OR REPLACE FUNCTION public.handle_squad_application_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'accepted' THEN
    PERFORM set_config('onestop.squad_rpc', 'on', true);
    UPDATE public.squad_posts
    SET spots_left = LEAST(COALESCE(total_members, 4), COALESCE(spots_left, 0) + 1),
        accepted_count = GREATEST(0, COALESCE(accepted_count, 0) - 1),
        is_open = true,
        updated_at = NOW()
    WHERE id = OLD.post_id;
    PERFORM set_config('onestop.squad_rpc', 'off', true);
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_squad_application_deleted ON public.squad_applications;
CREATE TRIGGER on_squad_application_deleted
  AFTER DELETE ON public.squad_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_squad_application_deleted();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 7. respond_to_application (lead phone from the private table; member count by user)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.respond_to_application(p_app_id UUID, p_status TEXT)
RETURNS public.squad_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app        public.squad_applications;
  v_post       public.squad_posts;
  v_lead_phone TEXT;
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

    SELECT COALESCE(NULLIF(c.phone_number, ''), '') INTO v_lead_phone
    FROM public.squad_post_contacts c WHERE c.post_id = v_post.id;
    IF COALESCE(v_lead_phone, '') = '' AND v_post.comm_method IS DISTINCT FROM 'chat' THEN
      SELECT COALESCE(phone, '') INTO v_lead_phone FROM public.profiles WHERE id = v_post.user_id;
    END IF;
    IF v_post.comm_method = 'chat' THEN
      v_lead_phone := '';
    END IF;

    UPDATE public.squad_posts
    SET spots_left = GREATEST(0, COALESCE(v_post.spots_left, 0) - 1),
        accepted_count = COALESCE(v_post.accepted_count, 0) + 1,
        is_open = (COALESCE(v_post.spots_left, 0) - 1 > 0),
        updated_at = NOW()
    WHERE id = v_post.id;

    UPDATE public.squad_applications
    SET status = 'accepted', lead_phone = v_lead_phone, updated_at = NOW()
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

-- ─────────────────────────────────────────────────────────────────────────────────
-- 8. SQUAD CHAT ACCESS
--    1:1 thread (application_id set): the squad lead + that applicant while the
--    application is pending or accepted. Group thread (no application_id): lead +
--    accepted members. Declined/removed applicants lose access.
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.squad_chat_role(p_post_id TEXT, p_application_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_status TEXT;
BEGIN
  IF v_uid IS NULL OR p_post_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.squad_posts WHERE id::text = p_post_id AND user_id = v_uid) THEN
    IF p_application_id IS NULL
       OR EXISTS (SELECT 1 FROM public.squad_applications WHERE id::text = p_application_id AND post_id::text = p_post_id) THEN
      RETURN 'lead';
    END IF;
    RETURN NULL;
  END IF;

  IF p_application_id IS NOT NULL THEN
    SELECT status INTO v_status FROM public.squad_applications
    WHERE id::text = p_application_id AND post_id::text = p_post_id AND applicant_id = v_uid;
    IF v_status IN ('pending', 'accepted') THEN
      RETURN 'applicant';
    END IF;
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.squad_applications
             WHERE post_id::text = p_post_id AND applicant_id = v_uid AND status = 'accepted') THEN
    RETURN 'member';
  END IF;
  RETURN NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.squad_chat_role(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_squad_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_status TEXT;
  v_last_sender UUID;
  v_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;  -- service role / dashboard
  END IF;

  v_role := public.squad_chat_role(NEW.post_id, NEW.application_id);
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'You are not part of this squad chat.';
  END IF;

  NEW.content := btrim(COALESCE(NEW.content, ''));
  IF NEW.content = '' THEN
    RAISE EXCEPTION 'Message cannot be empty.';
  END IF;
  IF length(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'Message is too long (max 2000 characters).';
  END IF;

  -- Pending applications: lead and applicant strictly take turns
  IF NEW.application_id IS NOT NULL THEN
    SELECT status INTO v_status FROM public.squad_applications WHERE id::text = NEW.application_id;
    IF v_status = 'pending' THEN
      SELECT sender_id INTO v_last_sender FROM public.squad_messages
      WHERE application_id = NEW.application_id
      ORDER BY created_at DESC LIMIT 1;
      IF v_last_sender = auth.uid() THEN
        RAISE EXCEPTION 'Wait for a reply before sending another message.';
      END IF;
    END IF;
  END IF;

  SELECT NULLIF(btrim(full_name), '') INTO v_name FROM public.profiles WHERE id = auth.uid();
  NEW.sender_id := auth.uid();
  NEW.sender_role := v_role;
  NEW.sender_name := COALESCE(v_name, split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1), 'Student');
  NEW.created_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_squad_message ON public.squad_messages;
CREATE TRIGGER trg_guard_squad_message
  BEFORE INSERT ON public.squad_messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_squad_message();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 9. CHAT NOTIFICATIONS (created by the database, one unread row per thread)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_squad_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post public.squad_posts;
  v_recipient UUID;
  v_thread TEXT := COALESCE(NEW.application_id, 'group');
  v_snippet TEXT := CASE WHEN length(NEW.content) > 80 THEN left(NEW.content, 80) || '…' ELSE NEW.content END;
BEGIN
  SELECT * INTO v_post FROM public.squad_posts WHERE id::text = NEW.post_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  FOR v_recipient IN
    SELECT DISTINCT r FROM (
      SELECT v_post.user_id AS r
      UNION ALL
      SELECT a.applicant_id FROM public.squad_applications a
      WHERE a.post_id = v_post.id
        AND (
          (NEW.application_id IS NOT NULL AND a.id::text = NEW.application_id)
          OR (NEW.application_id IS NULL AND a.status = 'accepted')
        )
    ) t
    WHERE r IS NOT NULL AND r IS DISTINCT FROM NEW.sender_id
  LOOP
    UPDATE public.user_notifications
    SET title = 'New message from ' || NEW.sender_name,
        message = v_snippet,
        created_at = NOW(),
        updated_at = NOW(),
        data = jsonb_build_object(
          'thread', NEW.post_id || ':' || v_thread,
          'post_id', NEW.post_id,
          'application_id', NEW.application_id,
          'competition_name', v_post.competition_name,
          'count', COALESCE((data->>'count')::int, 1) + 1
        )
    WHERE user_id = v_recipient
      AND type = 'new_message'
      AND is_read = false
      AND data->>'thread' = NEW.post_id || ':' || v_thread;

    IF NOT FOUND THEN
      INSERT INTO public.user_notifications (user_id, type, title, message, link, data, is_read, read)
      VALUES (
        v_recipient,
        'new_message',
        'New message from ' || NEW.sender_name,
        v_snippet,
        '/teams?chat=' || NEW.post_id,
        jsonb_build_object(
          'thread', NEW.post_id || ':' || v_thread,
          'post_id', NEW.post_id,
          'application_id', NEW.application_id,
          'competition_name', v_post.competition_name,
          'count', 1
        ),
        false,
        false
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Recipients may only flip read flags on their own notifications
CREATE OR REPLACE FUNCTION public.guard_notification_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND (
       OLD.user_id = auth.uid()
       OR (OLD.user_email IS NOT NULL AND lower(OLD.user_email) = lower(COALESCE(auth.jwt()->>'email', '')))
     ) THEN
    NEW.user_id := OLD.user_id;
    NEW.user_email := OLD.user_email;
    NEW.type := OLD.type;
    NEW.title := OLD.title;
    NEW.body := OLD.body;
    NEW.message := OLD.message;
    NEW.link := OLD.link;
    NEW.data := OLD.data;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_keep_notification_thread ON public.user_notifications;
DROP FUNCTION IF EXISTS public.keep_notification_thread();
DROP TRIGGER IF EXISTS trg_guard_notification_update ON public.user_notifications;
CREATE TRIGGER trg_guard_notification_update
  BEFORE UPDATE ON public.user_notifications
  FOR EACH ROW EXECUTE FUNCTION public.guard_notification_update();

DROP TRIGGER IF EXISTS trg_notify_squad_message ON public.squad_messages;
CREATE TRIGGER trg_notify_squad_message
  AFTER INSERT ON public.squad_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_squad_message();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 10. ACCOUNT DELETION (also clears email-addressed notifications)
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
-- 11. RLS: DROP EVERY EXISTING POLICY, THEN RECREATE A STRICT SET
-- ─────────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'bookmarks', 'user_notification_states', 'squad_posts',
                        'squad_post_contacts', 'squad_applications', 'squad_messages',
                        'user_notifications', 'institutional_competitions', 'app_admins')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_competitions ENABLE ROW LEVEL SECURITY;

-- Profiles: owner + admin
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Bookmarks / notification states: owner only
CREATE POLICY "bookmarks_select_own" ON public.bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_own" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete_own" ON public.bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_states_all_own" ON public.user_notification_states FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Squad posts: public listing (no contact details stored here anymore)
CREATE POLICY "squad_posts_select_all" ON public.squad_posts FOR SELECT USING (true);
CREATE POLICY "squad_posts_insert_own" ON public.squad_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "squad_posts_update_own" ON public.squad_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "squad_posts_delete_own" ON public.squad_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Squad contacts: the squad lead (+ admin). Members get the lead phone on acceptance.
CREATE POLICY "squad_contacts_select_owner" ON public.squad_post_contacts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Applications: applicant + squad lead
CREATE POLICY "squad_apps_select" ON public.squad_applications FOR SELECT TO authenticated
  USING (applicant_id = auth.uid() OR post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid()));
CREATE POLICY "squad_apps_insert" ON public.squad_applications FOR INSERT TO authenticated
  WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "squad_apps_update_applicant" ON public.squad_applications FOR UPDATE TO authenticated
  USING (applicant_id = auth.uid()) WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "squad_apps_delete" ON public.squad_applications FOR DELETE TO authenticated
  USING (applicant_id = auth.uid() OR post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid()));

-- Messages: only chat participants
CREATE POLICY "squad_messages_select" ON public.squad_messages FOR SELECT TO authenticated
  USING (public.squad_chat_role(post_id, application_id) IS NOT NULL);
CREATE POLICY "squad_messages_insert" ON public.squad_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.squad_chat_role(post_id, application_id) IS NOT NULL);

-- Notifications: read / mark read / delete your own. No client inserts.
CREATE POLICY "notifications_select_own" ON public.user_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (user_email IS NOT NULL AND lower(user_email) = lower(auth.jwt()->>'email')));
CREATE POLICY "notifications_update_own" ON public.user_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (user_email IS NOT NULL AND lower(user_email) = lower(auth.jwt()->>'email')));
CREATE POLICY "notifications_delete_own" ON public.user_notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Competitions: public read-only; scraper uses the service role key (bypasses RLS)
CREATE POLICY "inst_comps_select_all" ON public.institutional_competitions FOR SELECT USING (true);
CREATE POLICY "inst_comps_admin_write" ON public.institutional_competitions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────────
-- 12. REALTIME
-- ─────────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

SELECT 'OneStop security hardening migration applied.' AS status;
