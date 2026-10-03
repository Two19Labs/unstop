-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop  -  SQUAD CHAT HOTFIX (run once in the Supabase SQL Editor)
-- The live squad_messages table was created by an older migration that requires
-- application_id and competition_id and caps messages at 1000 characters, and an
-- old user_notifications table with no id default and required user_email / body.
-- Chat messages now belong to a conversation, so those old rules rejected them.
-- Safe to run more than once.
-- ═════════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.squad_messages ALTER COLUMN application_id DROP NOT NULL;
ALTER TABLE public.squad_messages ALTER COLUMN competition_id DROP NOT NULL;

-- Replace any old length check on content with the 2000-character limit
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

-- The database fills in the competition for every new message
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

-- ── Chat notifications ──
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

SELECT 'OneStop squad chat hotfix applied.' AS status;
