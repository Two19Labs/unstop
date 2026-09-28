-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  DEFINITIVE MASTER DATABASE MIGRATION (FIXED & HARDENED)
-- Run this ONCE in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ═════════════════════════════════════════════════════════════════════════════════

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  college TEXT,
  course TEXT,
  year TEXT DEFAULT '2nd Year',
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  education_level TEXT DEFAULT 'undergraduate',
  skills TEXT[] DEFAULT '{}',
  profile_last_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year TEXT DEFAULT '2nd Year';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT 'undergraduate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_last_updated_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

  CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
END $$;


-- 3. SQUAD POSTS TABLE (With Auto-Expiry, Privacy & Multi-Platform Sourcing)
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

-- Ensure auto-expiry and privacy columns exist
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS competition_id TEXT;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS comm_method TEXT DEFAULT 'whatsapp';

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_squad_posts_expires_at ON public.squad_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_squad_posts_competition_id ON public.squad_posts(competition_id);
CREATE INDEX IF NOT EXISTS idx_squad_posts_user_id ON public.squad_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_posts_created_at ON public.squad_posts(created_at DESC);

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


-- 4. SQUAD APPLICATIONS TABLE (Requests to join squad)
CREATE TABLE IF NOT EXISTS public.squad_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.squad_posts(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  applicant_college TEXT,
  applicant_course TEXT,
  applicant_year TEXT,
  pitch_note TEXT,
  highlighted_skills TEXT[] DEFAULT '{}',
  comm_method TEXT DEFAULT 'whatsapp',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'rejected', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS comm_method TEXT DEFAULT 'whatsapp';
ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS applicant_phone TEXT;
CREATE INDEX IF NOT EXISTS idx_squad_apps_post_id ON public.squad_applications(post_id);
CREATE INDEX IF NOT EXISTS idx_squad_apps_applicant_id ON public.squad_applications(applicant_id);

ALTER TABLE public.squad_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Applications visible to post owner and applicant" ON public.squad_applications;
  DROP POLICY IF EXISTS "Enable read access on squad_applications" ON public.squad_applications;
  DROP POLICY IF EXISTS "Authenticated users can apply" ON public.squad_applications;
  DROP POLICY IF EXISTS "Post owner or applicant can update application" ON public.squad_applications;
  DROP POLICY IF EXISTS "Post owners and applicants can update applications" ON public.squad_applications;
  DROP POLICY IF EXISTS "Applicants can delete their own applications" ON public.squad_applications;

  -- Type-safe comparison: sp.id::text = squad_applications.post_id::text
  CREATE POLICY "Applications visible to post owner and applicant" ON public.squad_applications FOR SELECT TO authenticated
    USING (
      auth.uid() = applicant_id 
      OR EXISTS (
        SELECT 1 FROM public.squad_posts sp 
        WHERE sp.id::text = squad_applications.post_id::text 
          AND sp.user_id = auth.uid()
      )
    );

  CREATE POLICY "Authenticated users can apply" ON public.squad_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id);

  CREATE POLICY "Post owner or applicant can update application" ON public.squad_applications FOR UPDATE TO authenticated
    USING (
      auth.uid() = applicant_id 
      OR EXISTS (
        SELECT 1 FROM public.squad_posts sp 
        WHERE sp.id::text = squad_applications.post_id::text 
          AND sp.user_id = auth.uid()
      )
    );

  CREATE POLICY "Applicants can delete their own applications" ON public.squad_applications FOR DELETE TO authenticated USING (auth.uid() = applicant_id);
END $$;


-- 5. SQUAD MESSAGES TABLE (Realtime in-platform chat for squad)
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

-- Ensure all columns exist whether table was created earlier or now
ALTER TABLE public.squad_messages ADD COLUMN IF NOT EXISTS application_id TEXT;
ALTER TABLE public.squad_messages ADD COLUMN IF NOT EXISTS competition_id TEXT;
ALTER TABLE public.squad_messages ADD COLUMN IF NOT EXISTS sender_role VARCHAR(20) DEFAULT 'applicant';
ALTER TABLE public.squad_messages ADD COLUMN IF NOT EXISTS sender_avatar TEXT;

CREATE INDEX IF NOT EXISTS idx_squad_messages_post_id ON public.squad_messages(post_id);
CREATE INDEX IF NOT EXISTS idx_squad_messages_created_at ON public.squad_messages(created_at ASC);

ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;

-- 100% TYPE-SAFE POLICIES (Resolves operator does not exist: uuid = text)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Squad messages viewable by squad participants" ON public.squad_messages;
  DROP POLICY IF EXISTS "Squad participants can insert messages" ON public.squad_messages;
  DROP POLICY IF EXISTS "Participants can view squad messages" ON public.squad_messages;
  DROP POLICY IF EXISTS "Authenticated users can insert squad messages" ON public.squad_messages;

  CREATE POLICY "Squad messages viewable by squad participants" ON public.squad_messages FOR SELECT TO authenticated
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


-- 6. USER NOTIFICATIONS TABLE (For chat messages and application updates)
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

-- Ensure all flexible columns exist
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
  DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
  DROP POLICY IF EXISTS "Users can insert notifications" ON public.user_notifications;

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


-- 7. INSTITUTIONAL COMPETITIONS TABLE (AI Campus Direct Opportunities)
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
  DROP POLICY IF EXISTS "Service role and admins can insert or update" ON public.institutional_competitions;

  CREATE POLICY "Institutional competitions are viewable by everyone" ON public.institutional_competitions FOR SELECT USING (true);
  CREATE POLICY "Service role and admins can insert or update" ON public.institutional_competitions FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;


-- 8. AUTO-EXPIRY CLEANUP FUNCTION & TRIGGER
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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'hourly-squad-cleanup',
      '0 * * * *',
      'SELECT public.delete_expired_squad_posts();'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not enabled; trigger trg_cleanup_expired_posts handles cleanup on changes.';
END $$;
