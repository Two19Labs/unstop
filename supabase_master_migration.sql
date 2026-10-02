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
  onboarding_completed_at TIMESTAMPTZ,
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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Standardize empty defaults for clean first-time signups
ALTER TABLE public.profiles ALTER COLUMN year SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN education_level SET DEFAULT '';

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

  -- Owner-only reads (+ admin console; keep email in sync with src/lib/admin.js).
  -- Phone numbers & emails are never readable with the public anon key.
  CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT USING (lower(COALESCE(auth.jwt()->>'email', '')) = 'aditya.25015@sscbs.du.ac.in');
  CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
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
-- 3A. REMOVE THE OLD (BYPASSABLE) COOLDOWN TRIGGER
-- ─────────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_check_profile_cooldown ON public.profiles;
DROP FUNCTION IF EXISTS public.check_profile_cooldown();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3B. ONE-TIME BACKFILL FROM AUTH METADATA (runs as admin, before the new trigger)
-- ─────────────────────────────────────────────────────────────────────────────────
-- Create rows for any auth users that are missing a profile
INSERT INTO public.profiles (id, email)
SELECT u.id, COALESCE(u.email, '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Fill only EMPTY profile fields from metadata (never overwrites existing data)
UPDATE public.profiles p SET
  full_name       = COALESCE(NULLIF(p.full_name, ''),       NULLIF(u.raw_user_meta_data->>'full_name', ''), p.full_name),
  college         = COALESCE(NULLIF(p.college, ''),         NULLIF(u.raw_user_meta_data->>'college', ''), p.college),
  course          = COALESCE(NULLIF(p.course, ''),          NULLIF(u.raw_user_meta_data->>'course', ''), p.course),
  year            = COALESCE(NULLIF(p.year, ''),            NULLIF(u.raw_user_meta_data->>'year', ''), p.year),
  phone           = COALESCE(NULLIF(p.phone, ''),           NULLIF(u.raw_user_meta_data->>'phone', ''), p.phone),
  bio             = COALESCE(NULLIF(p.bio, ''),             NULLIF(u.raw_user_meta_data->>'bio', ''), p.bio),
  education_level = COALESCE(NULLIF(p.education_level, ''), NULLIF(u.raw_user_meta_data->>'education_level', ''), p.education_level),
  skills = CASE
    WHEN COALESCE(array_length(p.skills, 1), 0) = 0
     AND jsonb_typeof(u.raw_user_meta_data->'skills') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(u.raw_user_meta_data->'skills'))
    ELSE p.skills
  END,
  profile_last_updated_at = COALESCE(
    p.profile_last_updated_at,
    CASE
      WHEN (u.raw_user_meta_data->>'profile_last_updated_at') ~ '^\d{4}-\d{2}-\d{2}T'
      THEN LEAST((u.raw_user_meta_data->>'profile_last_updated_at')::timestamptz, NOW())
    END
  )
FROM auth.users u
WHERE u.id = p.id;

-- Anyone who has already saved their profile has completed onboarding
UPDATE public.profiles
SET onboarding_completed_at = profile_last_updated_at
WHERE onboarding_completed_at IS NULL
  AND profile_last_updated_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3C. SERVER-ENFORCED 24-HOUR COOLDOWN
--    - Only applies to end users (anon/authenticated JWTs). SQL editor, service
--      role, and auth/admin triggers (e.g. handle_new_user) are exempt.
--    - profile_last_updated_at / onboarding_completed_at / email are server-owned:
--      whatever the client sends for them is ignored.
--    - The first real profile save (onboarding) does NOT start the lock.
--    - Saves with no real change are allowed and do not reset the timer.
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_profile_cooldown()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
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

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_notifications') THEN
    DELETE FROM public.user_notifications WHERE user_id = v_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'squad_messages') THEN
    DELETE FROM public.squad_messages WHERE sender_id = v_user_id;
  END IF;

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

-- ═════════════════════════════════════════════════════════════════════════════════
-- 13. SECURITY HARDENING (same as SECURITY_HARDENING_MIGRATION.sql)
--     Runs last on purpose: it drops every policy created above and recreates the
--     strict set, and replaces the earlier squad functions/triggers.
-- ═════════════════════════════════════════════════════════════════════════════════
-- ─────────────────────────────────────────────────────────────────────────────────
-- 13.1 ADMINS (single source of truth; the client asks is_admin())
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
-- 13.2 NEW COLUMNS / TABLES
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
-- 13.3 STOP AUTO-DELETING EXPIRED SQUADS (they are hidden by the app instead)
-- ─────────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_cleanup_expired_posts ON public.squad_posts;
DROP FUNCTION IF EXISTS public.trigger_cleanup_expired_posts();
DROP FUNCTION IF EXISTS public.delete_expired_squad_posts();

-- ─────────────────────────────────────────────────────────────────────────────────
-- 13.4 ONE APPLICATION PER PERSON PER SQUAD (dedupe first, keeping the best row)
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
-- 13.5 MOVE CONTACT DETAILS OFF THE PUBLIC squad_posts TABLE
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
-- 13.6 APPLICATION GUARD (insert + applicant updates)
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
-- 13.7 respond_to_application (lead phone from the private table; member count by user)
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
-- 13.8 SQUAD CHAT ACCESS
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
-- 13.9 CHAT NOTIFICATIONS (created by the database, one unread row per thread)
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
-- 13.10 ACCOUNT DELETION (also clears email-addressed notifications)
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
-- 13.11 RLS: DROP EVERY EXISTING POLICY, THEN RECREATE A STRICT SET
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
-- 13.12 REALTIME
-- ─────────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

SELECT 'OneStop definitive master migration executed successfully! All tables, indexes, triggers, and RPCs are active.' AS status;
