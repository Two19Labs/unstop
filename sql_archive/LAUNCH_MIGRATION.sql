-- ══════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  Launch Day Database Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Idempotent & safe to run multiple times.
-- ══════════════════════════════════════════════════════════════════

-- 1. Ensure profiles table has all required collegiate and cooldown columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year TEXT DEFAULT 'UG 2nd Year';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT 'undergraduate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_last_updated_at TIMESTAMPTZ;

-- 2. Ensure squad_applications has collegiate course & year columns
ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS applicant_course TEXT DEFAULT 'General';
ALTER TABLE public.squad_applications ADD COLUMN IF NOT EXISTS applicant_year TEXT DEFAULT 'UG 2nd Year';

-- 3. Update squad_applications status check constraint to support 'declined' and 'removed'
ALTER TABLE public.squad_applications DROP CONSTRAINT IF EXISTS squad_applications_status_check;
ALTER TABLE public.squad_applications 
  ADD CONSTRAINT squad_applications_status_check 
  CHECK (status IN ('pending', 'accepted', 'declined', 'rejected', 'removed'));

-- 4. Ensure squad_posts has spot tracking and collegiate columns
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS accepted_emails TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS initial_open_spots INT DEFAULT 1;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS total_members INT DEFAULT 4;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS spots_left INT DEFAULT 1;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.squad_posts ADD COLUMN IF NOT EXISTS year TEXT;

-- 5. Enable Realtime Replication for Team Finder tables
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_posts;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_applications;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 6. Verification confirmation
SELECT 'OneStop database migration completed successfully!' AS status;
