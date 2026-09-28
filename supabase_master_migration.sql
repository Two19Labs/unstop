-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  DEFINITIVE MASTER DATABASE MIGRATION
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
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

-- Helpful performance indexes
CREATE INDEX IF NOT EXISTS idx_squad_posts_expires_at ON public.squad_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_squad_posts_competition_id ON public.squad_posts(competition_id);
CREATE INDEX IF NOT EXISTS idx_squad_posts_user_id ON public.squad_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_posts_created_at ON public.squad_posts(created_at DESC);

ALTER TABLE public.squad_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_posts' AND policyname = 'Squad posts viewable by authenticated users') THEN
    CREATE POLICY "Squad posts viewable by authenticated users" ON public.squad_posts FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_posts' AND policyname = 'Authenticated users can create squad posts') THEN
    CREATE POLICY "Authenticated users can create squad posts" ON public.squad_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_posts' AND policyname = 'Users can update their own squad posts') THEN
    CREATE POLICY "Users can update their own squad posts" ON public.squad_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_posts' AND policyname = 'Users can delete their own squad posts') THEN
    CREATE POLICY "Users can delete their own squad posts" ON public.squad_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS comm_method TEXT DEFAULT 'whatsapp';
CREATE INDEX IF NOT EXISTS idx_squad_apps_post_id ON public.squad_applications(post_id);
CREATE INDEX IF NOT EXISTS idx_squad_apps_applicant_id ON public.squad_applications(applicant_id);

ALTER TABLE public.squad_applications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_applications' AND policyname = 'Applications visible to post owner and applicant') THEN
    CREATE POLICY "Applications visible to post owner and applicant" ON public.squad_applications FOR SELECT TO authenticated
      USING (
        auth.uid() = applicant_id 
        OR auth.uid() IN (SELECT user_id FROM public.squad_posts WHERE id = squad_applications.post_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_applications' AND policyname = 'Authenticated users can apply') THEN
    CREATE POLICY "Authenticated users can apply" ON public.squad_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_applications' AND policyname = 'Post owner or applicant can update application') THEN
    CREATE POLICY "Post owner or applicant can update application" ON public.squad_applications FOR UPDATE TO authenticated
      USING (
        auth.uid() = applicant_id 
        OR auth.uid() IN (SELECT user_id FROM public.squad_posts WHERE id = squad_applications.post_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_applications' AND policyname = 'Applicants can delete their own applications') THEN
    CREATE POLICY "Applicants can delete their own applications" ON public.squad_applications FOR DELETE TO authenticated USING (auth.uid() = applicant_id);
  END IF;
END $$;


-- 5. SQUAD MESSAGES TABLE (Realtime in-platform chat for squad)
CREATE TABLE IF NOT EXISTS public.squad_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.squad_posts(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_squad_messages_post_id ON public.squad_messages(post_id);
CREATE INDEX IF NOT EXISTS idx_squad_messages_created_at ON public.squad_messages(created_at ASC);

ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_messages' AND policyname = 'Squad messages viewable by squad participants') THEN
    CREATE POLICY "Squad messages viewable by squad participants" ON public.squad_messages FOR SELECT TO authenticated
      USING (
        auth.uid() = sender_id
        OR auth.uid() IN (SELECT user_id FROM public.squad_posts WHERE id = squad_messages.post_id)
        OR auth.uid() IN (SELECT applicant_id FROM public.squad_applications WHERE post_id = squad_messages.post_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'squad_messages' AND policyname = 'Squad participants can insert messages') THEN
    CREATE POLICY "Squad participants can insert messages" ON public.squad_messages FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;


-- 6. USER NOTIFICATIONS TABLE (For chat messages and application updates)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'chat_message', 'squad_apply', 'squad_accepted', 'squad_rejected'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON public.user_notifications(user_id) WHERE is_read = false;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'Users can view own notifications') THEN
    CREATE POLICY "Users can view own notifications" ON public.user_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'Users can update own notifications') THEN
    CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'Authenticated users can insert notifications') THEN
    CREATE POLICY "Authenticated users can insert notifications" ON public.user_notifications FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'institutional_competitions' AND policyname = 'Institutional competitions are viewable by everyone') THEN
    CREATE POLICY "Institutional competitions are viewable by everyone" ON public.institutional_competitions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'institutional_competitions' AND policyname = 'Service role and admins can insert or update') THEN
    CREATE POLICY "Service role and admins can insert or update" ON public.institutional_competitions FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


-- 8. AUTO-EXPIRY CLEANUP FUNCTION & TRIGGER
-- Hard deletes squad posts where the deadline has elapsed (cascades to applications & messages)
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

-- Trigger to clean up expired squad posts whenever new posts are created or fetched
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

-- If pg_cron extension is available on your Supabase tier, schedule hourly auto-cleanup:
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'hourly-squad-cleanup',
      '0 * * * *',
      'SELECT public.delete_expired_squad_posts();'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback smoothly if pg_cron is not enabled
  RAISE NOTICE 'pg_cron not enabled or available; statement trigger trg_cleanup_expired_posts handles cleanup.';
END $$;

-- ═════════════════════════════════════════════════════════════════════════════════
-- SUCCESS: Definitive migration created successfully!
-- ═════════════════════════════════════════════════════════════════════════════════
