-- ══════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ══════════════════════════════════════════════════════════════════

-- 1. PROFILES TABLE (Extends Supabase auth.users)
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
  profile_last_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created earlier:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year TEXT DEFAULT '2nd Year';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_last_updated_at TIMESTAMPTZ;

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies:
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);


-- 2. SQUAD POSTS TABLE (Teammate recruitment postings)
CREATE TABLE IF NOT EXISTS public.squad_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  competition_name TEXT NOT NULL,
  organizer TEXT,
  competition_link TEXT,
  phone_number TEXT,
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

-- Enable RLS on squad_posts
ALTER TABLE public.squad_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad posts viewable by authenticated users" 
  ON public.squad_posts FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create squad posts" 
  ON public.squad_posts FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own squad posts" 
  ON public.squad_posts FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own squad posts" 
  ON public.squad_posts FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);


-- 3. SQUAD APPLICATIONS TABLE (Applications to join a squad)
CREATE TABLE IF NOT EXISTS public.squad_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.squad_posts(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  applicant_college TEXT,
  pitch_note TEXT,
  highlighted_skills TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on squad_applications
ALTER TABLE public.squad_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view applications they sent or received" 
  ON public.squad_applications FOR SELECT 
  TO authenticated 
  USING (
    auth.uid() = applicant_id OR 
    EXISTS (
      SELECT 1 FROM public.squad_posts 
      WHERE public.squad_posts.id = public.squad_applications.post_id 
      AND public.squad_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create squad applications" 
  ON public.squad_applications FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can delete their own applications" 
  ON public.squad_applications FOR DELETE 
  TO authenticated 
  USING (auth.uid() = applicant_id);

CREATE POLICY "Post owners can update application status" 
  ON public.squad_applications FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.squad_posts 
      WHERE public.squad_posts.id = public.squad_applications.post_id 
      AND public.squad_posts.user_id = auth.uid()
    )
  );


-- 4. BOOKMARKS TABLE (Saved competitions per user)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comp_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, comp_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks" 
  ON public.bookmarks FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add bookmarks" 
  ON public.bookmarks FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their bookmarks" 
  ON public.bookmarks FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);


-- 5. TRIGGER: Auto-create Profile on Auth Signup (Email or Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, college, course, year, phone, bio)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'college', ''),
    COALESCE(NEW.raw_user_meta_data->>'course', ''),
    COALESCE(NEW.raw_user_meta_data->>'year', '2nd Year'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    college = COALESCE(NULLIF(EXCLUDED.college, ''), public.profiles.college),
    course = COALESCE(NULLIF(EXCLUDED.course, ''), public.profiles.course),
    year = COALESCE(NULLIF(EXCLUDED.year, ''), public.profiles.year),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    bio = COALESCE(NULLIF(EXCLUDED.bio, ''), public.profiles.bio),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for blazing fast lookups
CREATE INDEX IF NOT EXISTS idx_squad_posts_user_id ON public.squad_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_posts_created_at ON public.squad_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_squad_applications_post_id ON public.squad_applications(post_id);
CREATE INDEX IF NOT EXISTS idx_squad_applications_applicant_id ON public.squad_applications(applicant_id);
