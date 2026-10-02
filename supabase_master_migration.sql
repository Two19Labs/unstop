-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  DEFINITIVE MASTER DATABASE MIGRATION (COMPLETE & UNIFIED)
-- Run this ONCE in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Fully idempotent, non-destructive, safe to run on both fresh and existing setups.
-- ═════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. PROFILES TABLE (Extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  college TEXT,
  course TEXT,
  year TEXT DEFAULT '',
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  education_level TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  profile_last_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns and clean empty defaults exist on existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_last_updated_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Standardize empty defaults for clean first-time signups
ALTER TABLE public.profiles ALTER COLUMN year SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN education_level SET DEFAULT '';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

  CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
END $$;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. AUTH TRIGGER: AUTOMATIC PROFILE CREATION (WITH ZERO PREFILLED LEAKAGE)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, avatar_url, college, course, year, phone, bio, education_level
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'college', ''),
    COALESCE(NEW.raw_user_meta_data->>'course', ''),
    COALESCE(NEW.raw_user_meta_data->>'year', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE(NEW.raw_user_meta_data->>'education_level', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. BOOKMARKS TABLE
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comp_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, comp_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_comp_id ON public.bookmarks(comp_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
  DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
  DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;

  CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. USER NOTIFICATION STATES (Cross-Device Read & Dismissal Sync)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_notification_states (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_id TEXT NOT NULL,
  is_read BOOLEAN DEFAULT TRUE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notif_states_user_id ON public.user_notification_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_states_user_dismissed ON public.user_notification_states(user_id, is_dismissed);

ALTER TABLE public.user_notification_states ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their own notification states" ON public.user_notification_states;
  CREATE POLICY "Users can manage their own notification states" 
    ON public.user_notification_states
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. SQUAD POSTS TABLE (With Auto-Expiry, Spot Tracking & Multi-Platform Ingestion)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.squad_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  competition_name TEXT NOT NULL,
  competition_id TEXT,
  is_custom BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  organizer TEXT,
  competition_link TEXT,
  phone_number TEXT,
  comm_method TEXT DEFAULT 'whatsapp',
  title TEXT NOT NULL,
  description TEXT,
  skills_have TEXT[] DEFAULT '{}',
  skills_looking_for TEXT[] DEFAULT '{}',
  total_members INTEGER DEFAULT 4,
  spots_left INTEGER DEFAULT 1,
  initial_open_spots INTEGER DEFAULT 1,
  is_open BOOLEAN DEFAULT TRUE,
  college TEXT,
  course TEXT,
  year TEXT,
  accepted_emails TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all spot tracking and collegiate columns exist
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS competition_id TEXT;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS comm_method TEXT DEFAULT 'whatsapp';
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS accepted_emails TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS initial_open_spots INT DEFAULT 1;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS total_members INT DEFAULT 4;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS spots_left INT DEFAULT 1;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS year TEXT;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_squad_posts_expires_at ON public.squad_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_squad_posts_competition_id ON public.squad_posts(competition_id);
CREATE INDEX IF NOT EXISTS idx_squad_posts_user_id ON public.squad_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_posts_created_at ON public.squad_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_squad_posts_is_open_created ON public.squad_posts(is_open, created_at DESC);

ALTER TABLE public.squad_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Squad posts viewable by authenticated users" ON public.squad_posts;
  DROP POLICY IF EXISTS "Enable read access on squad_posts for everyone" ON public.squad_posts;
  DROP POLICY IF EXISTS "Authenticated users can create squad posts" ON public.squad_posts;
  DROP POLICY IF EXISTS "Users can update their own squad posts" ON public.squad_posts;
  DROP POLICY IF EXISTS "Users can delete their own squad posts" ON public.squad_posts;

  CREATE POLICY "Enable read access on squad_posts for everyone" ON public.squad_posts FOR SELECT USING (true);
  CREATE POLICY "Authenticated users can create squad posts" ON public.squad_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update their own squad posts" ON public.squad_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can delete their own squad posts" ON public.squad_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
END $$;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 7. SQUAD APPLICATIONS TABLE (Requests to Join Squad)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.squad_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.squad_posts(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  applicant_college TEXT,
  applicant_course TEXT DEFAULT 'General',
  applicant_year TEXT DEFAULT '',
  pitch_note TEXT,
  highlighted_skills TEXT[] DEFAULT '{}',
  comm_method TEXT DEFAULT 'whatsapp',
  lead_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'rejected', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns and updated constraints exist
ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS comm_method TEXT DEFAULT 'whatsapp';
ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS applicant_phone TEXT;
ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS lead_phone TEXT;
ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS applicant_course TEXT DEFAULT 'General';
ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS applicant_year TEXT DEFAULT '';
ALTER TABLE public.squad_applications ALTER COLUMN applicant_year SET DEFAULT '';

-- Update constraint
DO $$ BEGIN
  ALTER TABLE public.squad_applications DROP CONSTRAINT IF EXISTS squad_applications_status_check;
  ALTER TABLE public.squad_applications ADD CONSTRAINT squad_applications_status_check 
    CHECK (status IN ('pending', 'accepted', 'declined', 'rejected', 'removed'));
END $$;

CREATE INDEX IF NOT EXISTS idx_squad_apps_post_id ON public.squad_applications(post_id);
CREATE INDEX IF NOT EXISTS idx_squad_apps_applicant_id ON public.squad_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_squad_apps_status ON public.squad_applications(status);

ALTER TABLE public.squad_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Applications visible to post owner and applicant" ON public.squad_applications;
  DROP POLICY IF EXISTS "Enable read access on squad_applications" ON public.squad_applications;
  DROP POLICY IF EXISTS "Authenticated users can apply" ON public.squad_applications;
  DROP POLICY IF EXISTS "Users can create squad applications" ON public.squad_applications;
  DROP POLICY IF EXISTS "Post owner or applicant can update application" ON public.squad_applications;
  DROP POLICY IF EXISTS "Applicants can update own application" ON public.squad_applications;
  DROP POLICY IF EXISTS "Applicants can delete their own applications" ON public.squad_applications;
  DROP POLICY IF EXISTS "Users can delete applications" ON public.squad_applications;

  CREATE POLICY "Enable read access on squad_applications" 
    ON public.squad_applications FOR SELECT TO authenticated 
    USING (
      applicant_id = auth.uid() 
      OR post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid())
    );

  CREATE POLICY "Users can create squad applications" 
    ON public.squad_applications FOR INSERT TO authenticated 
    WITH CHECK (applicant_id = auth.uid());

  CREATE POLICY "Applicants can update own application" 
    ON public.squad_applications FOR UPDATE TO authenticated 
    USING (applicant_id = auth.uid())
    WITH CHECK (applicant_id = auth.uid());

  CREATE POLICY "Users can delete applications" 
    ON public.squad_applications FOR DELETE TO authenticated 
    USING (
      applicant_id = auth.uid() 
      OR post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid())
    );
END $$;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 8. SQUAD MESSAGES TABLE (Realtime Multi-Member Group & Vetting Chat)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.squad_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id TEXT,
  post_id TEXT NOT NULL,
  competition_id TEXT,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role VARCHAR(20) DEFAULT 'applicant',
  sender_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.squad_messages ADD COLUMN IF NOT EXISTS application_id TEXT;
ALTER TABLE public.squad_messages ADD COLUMN IF NOT EXISTS competition_id TEXT;
ALTER TABLE public.squad_messages ADD COLUMN IF NOT EXISTS sender_role VARCHAR(20) DEFAULT 'applicant';
ALTER TABLE public.squad_messages ADD COLUMN IF NOT EXISTS sender_avatar TEXT;

-- Permit member role for accepted teammates
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'squad_messages_sender_role_check'
      AND table_name = 'squad_messages'
  ) THEN
    ALTER TABLE public.squad_messages DROP CONSTRAINT squad_messages_sender_role_check;
  END IF;
  ALTER TABLE public.squad_messages 
    ADD CONSTRAINT squad_messages_sender_role_check 
    CHECK (sender_role IN ('lead', 'applicant', 'member'));
END $$;

CREATE INDEX IF NOT EXISTS idx_squad_messages_post_id ON public.squad_messages(post_id);
CREATE INDEX IF NOT EXISTS idx_squad_messages_created_at ON public.squad_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_squad_messages_post_created ON public.squad_messages(post_id, created_at ASC);

ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Squad messages viewable by squad participants" ON public.squad_messages;
  DROP POLICY IF EXISTS "Participants can view squad messages" ON public.squad_messages;
  DROP POLICY IF EXISTS "Squad participants can insert messages" ON public.squad_messages;

  CREATE POLICY "Participants can view squad messages" ON public.squad_messages FOR SELECT TO authenticated
    USING (
      sender_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.squad_posts sp
        WHERE sp.id::text = squad_messages.post_id::text
          AND sp.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.squad_applications sa
        WHERE (
          (sa.id IS NOT NULL AND squad_messages.application_id IS NOT NULL AND sa.id::text = squad_messages.application_id::text)
          OR sa.post_id::text = squad_messages.post_id::text
        )
        AND sa.applicant_id = auth.uid()
      )
    );

  CREATE POLICY "Squad participants can insert messages" ON public.squad_messages FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);
END $$;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 9. USER NOTIFICATIONS TABLE (For chat messages & updates)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  message TEXT,
  link TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_email ON public.user_notifications(user_email);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
  DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.user_notifications;

  CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT TO authenticated
    USING (
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR (user_email IS NOT NULL AND user_email = auth.jwt() ->> 'email')
    );

  CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE TO authenticated
    USING (
      (user_id IS NOT NULL AND auth.uid() = user_id)
      OR (user_email IS NOT NULL AND user_email = auth.jwt() ->> 'email')
    );

  CREATE POLICY "Authenticated users can insert notifications" ON public.user_notifications FOR INSERT TO authenticated
    WITH CHECK (true);
END $$;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 10. INSTITUTIONAL COMPETITIONS TABLE (Campus Direct & AI Ingestion Opportunities)
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.institutional_competitions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT,
  host_institution TEXT NOT NULL,
  organizer TEXT,
  category TEXT DEFAULT 'case',
  category_label TEXT DEFAULT 'Case Competition',
  category_emoji TEXT DEFAULT '💼',
  sub_tracks TEXT[] DEFAULT '{}',
  source_platform TEXT DEFAULT 'campus_direct',
  source_label TEXT DEFAULT 'Campus Direct',
  apply_url TEXT NOT NULL,
  website_url TEXT,
  banner_url TEXT,
  logo_url TEXT,
  prizes TEXT DEFAULT 'Certificates & Cash Prize',
  fee TEXT DEFAULT 'Free',
  mode TEXT DEFAULT 'Online',
  location TEXT DEFAULT 'Online',
  min_team INTEGER DEFAULT 1,
  max_team INTEGER DEFAULT 4,
  deadline TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  registered_count INTEGER DEFAULT 100,
  views_count INTEGER DEFAULT 500,
  is_undergrad_eligible BOOLEAN DEFAULT true,
  is_pg_only BOOLEAN DEFAULT false,
  is_mba_or_pg BOOLEAN DEFAULT false,
  is_du BOOLEAN DEFAULT false,
  is_iim_or_iit BOOLEAN DEFAULT false,
  is_premier BOOLEAN DEFAULT false,
  is_flagship BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  raw_scraped_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inst_comps_active ON public.institutional_competitions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_inst_comps_deadline ON public.institutional_competitions(deadline);

ALTER TABLE public.institutional_competitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Institutional competitions are viewable by everyone" ON public.institutional_competitions;
  DROP POLICY IF EXISTS "Allow scanner upsert on institutional_competitions" ON public.institutional_competitions;

  CREATE POLICY "Institutional competitions are viewable by everyone" ON public.institutional_competitions FOR SELECT USING (true);
  CREATE POLICY "Allow scanner upsert on institutional_competitions" ON public.institutional_competitions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
END $$;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 11. SECURITY TRIGGERS & ATOMIC SQUAD FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────────

-- A. Guard Trigger: Prevent self-acceptance, enforce pending on INSERT, block tampering
CREATE OR REPLACE FUNCTION public.guard_squad_application()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Service role / Dashboard override
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1. INSERT: Force initial pending state, scrub client-injected lead phone
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.lead_phone := NULL;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- 2. UPDATE by squad owner (inside respond_to_application): allow
  IF EXISTS (
    SELECT 1 FROM public.squad_posts
    WHERE id = OLD.post_id AND user_id = auth.uid()
  ) THEN
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- 3. UPDATE by applicant:
  IF NEW.post_id IS DISTINCT FROM OLD.post_id
     OR NEW.applicant_id IS DISTINCT FROM OLD.applicant_id
     OR NEW.lead_phone IS DISTINCT FROM OLD.lead_phone THEN
    RAISE EXCEPTION 'Core application fields cannot be modified';
  END IF;

  -- Prevent applicant self-acceptance; only permit re-applying back to pending
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (NEW.status = 'pending' AND OLD.status IN ('declined', 'rejected', 'removed')) THEN
    RAISE EXCEPTION 'Only the squad lead can change an application status';
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_squad_application ON public.squad_applications;
CREATE TRIGGER guard_squad_application
  BEFORE INSERT OR UPDATE ON public.squad_applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_squad_application();

-- B. Auto-reclaim spot when an accepted application is deleted/withdrawn
CREATE OR REPLACE FUNCTION public.handle_squad_application_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'accepted' THEN
    UPDATE public.squad_posts
    SET spots_left = LEAST(COALESCE(total_members, 4), COALESCE(spots_left, 0) + 1),
        is_open = true,
        accepted_emails = array_remove(COALESCE(accepted_emails, '{}'::TEXT[]), OLD.applicant_email),
        updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_squad_application_deleted ON public.squad_applications;
CREATE TRIGGER on_squad_application_deleted
  AFTER DELETE ON public.squad_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_squad_application_deleted();

-- C. Atomic, Row-Locking RPC: respond_to_application
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

  -- 1. Fetch application
  SELECT * INTO v_app FROM public.squad_applications WHERE id = p_app_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found: %', p_app_id;
  END IF;

  -- 2. Lock post row to serialize concurrent acceptances
  SELECT * INTO v_post FROM public.squad_posts WHERE id = v_app.post_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated squad post not found';
  END IF;

  -- 3. Verify caller is the squad creator
  IF v_post.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the squad creator can review applications';
  END IF;

  -- Resolve squad lead phone
  v_lead_phone := COALESCE(NULLIF(v_post.phone_number, ''), '');
  IF v_lead_phone = '' THEN
    SELECT COALESCE(phone, '') INTO v_lead_phone FROM public.profiles WHERE id = v_post.user_id;
  END IF;

  -- 4. Process state transitions
  IF p_status = 'accepted' THEN
    IF v_app.status = 'accepted' THEN
      RETURN v_app; -- Idempotent
    END IF;

    IF COALESCE(v_post.spots_left, 0) <= 0 THEN
      RAISE EXCEPTION 'No open spots left in this squad';
    END IF;

    -- Decrement spot & append email
    UPDATE public.squad_posts
    SET spots_left = GREATEST(0, v_post.spots_left - 1),
        is_open = (v_post.spots_left - 1 > 0),
        accepted_emails = array_append(
          array_remove(COALESCE(v_post.accepted_emails, '{}'::TEXT[]), v_app.applicant_email),
          v_app.applicant_email
        ),
        updated_at = NOW()
    WHERE id = v_post.id;

    -- Update application with status & lead phone
    UPDATE public.squad_applications
    SET status = 'accepted',
        lead_phone = v_lead_phone,
        updated_at = NOW()
    WHERE id = v_app.id
    RETURNING * INTO v_app;

  ELSIF p_status IN ('declined', 'rejected', 'removed', 'pending') THEN
    -- If previously accepted, reclaim the spot
    IF v_app.status = 'accepted' THEN
      UPDATE public.squad_posts
      SET spots_left = LEAST(COALESCE(v_post.total_members, 4), COALESCE(v_post.spots_left, 0) + 1),
          is_open = true,
          accepted_emails = array_remove(COALESCE(v_post.accepted_emails, '{}'::TEXT[]), v_app.applicant_email),
          updated_at = NOW()
      WHERE id = v_post.id;
    END IF;

    UPDATE public.squad_applications
    SET status = p_status,
        lead_phone = NULL,
        updated_at = NOW()
    WHERE id = v_app.id
    RETURNING * INTO v_app;
  END IF;

  RETURN v_app;
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_to_application(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_application(UUID, TEXT) TO service_role;

-- D. User Account Self-Deletion RPC
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

  -- Delete user records across public tables
  DELETE FROM public.bookmarks WHERE user_id = v_user_id;
  DELETE FROM public.squad_applications WHERE applicant_id = v_user_id;
  DELETE FROM public.squad_posts WHERE user_id = v_user_id;
  DELETE FROM public.user_notification_states WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE id = v_user_id;

  -- Delete from auth.users (cascades sessions, identities)
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO service_role;

-- E. Auto-Expiry Squad Cleanup
CREATE OR REPLACE FUNCTION public.delete_expired_squad_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.squad_posts
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired_posts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.delete_expired_squad_posts();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_expired_posts ON public.squad_posts;
CREATE TRIGGER trg_cleanup_expired_posts
AFTER INSERT OR UPDATE ON public.squad_posts
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_cleanup_expired_posts();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 12. SUPABASE REALTIME REPLICATION CONFIGURATION
-- ─────────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notification_states;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_posts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_applications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

SELECT 'OneStop definitive master migration executed successfully! All tables, indexes, triggers, and RPCs are active.' AS status;
