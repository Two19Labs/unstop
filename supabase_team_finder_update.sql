-- ════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  Complete Team Finder & Realtime Parity Migration
-- ════════════════════════════════════════════════════════════════════════
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Idempotent & safe to run multiple times.
-- ════════════════════════════════════════════════════════════════════════

-- 1. Ensure squad_applications has collegiate course & year columns
ALTER TABLE public.squad_applications 
ADD COLUMN IF NOT EXISTS applicant_course TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS applicant_year TEXT DEFAULT '2nd Year';

-- 2. Update squad_applications status check constraint to support 'declined' and 'removed'
ALTER TABLE public.squad_applications 
DROP CONSTRAINT IF EXISTS squad_applications_status_check;

ALTER TABLE public.squad_applications 
ADD CONSTRAINT squad_applications_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'rejected', 'removed'));

-- 3. Ensure squad_posts has all dynamic spot tracking columns
ALTER TABLE public.squad_posts 
ADD COLUMN IF NOT EXISTS accepted_emails TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS initial_open_spots INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_members INT DEFAULT 4,
ADD COLUMN IF NOT EXISTS spots_left INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS college TEXT,
ADD COLUMN IF NOT EXISTS course TEXT,
ADD COLUMN IF NOT EXISTS year TEXT;

-- Backfill initial_open_spots from total_members or spots_left if empty
UPDATE public.squad_posts
SET initial_open_spots = COALESCE(spots_left, 1)
WHERE initial_open_spots IS NULL;

-- 4. Enable public read access for squad postings (so visitors can explore before signing in)
DROP POLICY IF EXISTS "Squad posts viewable by authenticated users" ON public.squad_posts;
DROP POLICY IF EXISTS "Enable read access on squad_posts for everyone" ON public.squad_posts;

CREATE POLICY "Enable read access on squad_posts for everyone" 
ON public.squad_posts FOR SELECT 
USING (true);

-- 5. Enable read access on squad_applications for applicants and post owners
DROP POLICY IF EXISTS "Users can view applications they sent or received" ON public.squad_applications;
DROP POLICY IF EXISTS "Enable read access on squad_applications" ON public.squad_applications;

CREATE POLICY "Enable read access on squad_applications" 
ON public.squad_applications FOR SELECT 
TO authenticated 
USING (
  applicant_id = auth.uid() 
  OR post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid())
);

-- 6. Update policy on squad_applications (allows post owner to accept/decline/remove and applicant to re-apply)
DROP POLICY IF EXISTS "Post owners can update application status" ON public.squad_applications;
DROP POLICY IF EXISTS "Post owners and applicants can update applications" ON public.squad_applications;

CREATE POLICY "Post owners and applicants can update applications" 
ON public.squad_applications FOR UPDATE 
TO authenticated 
USING (
  applicant_id = auth.uid() 
  OR post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid())
)
WITH CHECK (
  applicant_id = auth.uid() 
  OR post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid())
);

-- 7. Create user_notifications table for real-time notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_type TEXT,
    action_data JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications FOR SELECT TO authenticated
USING (user_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Users can insert notifications" ON public.user_notifications;
CREATE POLICY "Users can insert notifications"
ON public.user_notifications FOR INSERT TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.user_notifications;
CREATE POLICY "Users can update their own notifications"
ON public.user_notifications FOR UPDATE TO authenticated
USING (user_email = auth.jwt() ->> 'email');

-- 8. Enable Realtime Replication for Team Finder tables
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
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 9. Verification Query
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'squad_applications' 
  AND column_name IN ('applicant_course', 'applicant_year', 'status');
