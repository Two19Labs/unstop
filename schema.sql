-- Database Architecture for Universal Squad Finder
-- Run this SQL in your Supabase SQL Editor (safe to re-run / idempotent)

-- 1. Create Universal Squad Posts Table
CREATE TABLE IF NOT EXISTS public.squad_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    competition_name TEXT NOT NULL,
    organizer TEXT,
    competition_link TEXT,
    phone_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    skills_have TEXT[] DEFAULT '{}'::TEXT[],
    skills_looking_for TEXT[] DEFAULT '{}'::TEXT[],
    total_members INT DEFAULT 3,
    initial_open_spots INT DEFAULT 2,
    spots_left INT DEFAULT 2,
    accepted_emails TEXT[] DEFAULT '{}'::TEXT[],
    college TEXT NOT NULL DEFAULT 'University of Delhi',
    major TEXT NOT NULL DEFAULT 'Business / Economics',
    year TEXT NOT NULL DEFAULT '2nd Year',
    is_open BOOLEAN DEFAULT true,
    created_by_email TEXT NOT NULL,
    created_by_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Universal Squad Applications Table
CREATE TABLE IF NOT EXISTS public.squad_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.squad_posts(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    applicant_phone TEXT,
    applicant_college TEXT NOT NULL DEFAULT 'University of Delhi',
    applicant_major TEXT NOT NULL DEFAULT 'Business / Economics',
    applicant_year TEXT NOT NULL DEFAULT '2nd Year',
    pitch_note TEXT NOT NULL,
    highlighted_skills TEXT[] DEFAULT '{}'::TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.squad_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_applications ENABLE ROW LEVEL SECURITY;

-- 4. Policies for squad_posts
CREATE POLICY "Public read squad_posts"
    ON public.squad_posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create squad posts"
    ON public.squad_posts FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Creators can update or delete their squad posts"
    ON public.squad_posts FOR ALL TO authenticated
    USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = created_by_email)
    WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'email' = created_by_email);

-- 5. Policies for squad_applications
CREATE POLICY "Public read squad_applications"
    ON public.squad_applications FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit applications"
    ON public.squad_applications FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = applicant_id OR applicant_id IS NULL);

CREATE POLICY "Host or applicant can update application status"
    ON public.squad_applications FOR ALL TO authenticated
    USING (
        applicant_id = auth.uid() 
        OR post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid())
    );

-- 6. Enable Realtime Replication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_posts;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_applications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
