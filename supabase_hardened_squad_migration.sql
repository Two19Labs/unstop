-- ════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  Definitive Atomic Squad & Security Migration
-- ════════════════════════════════════════════════════════════════════════
-- Idempotent, transaction-safe, and zero-downtime compatible.
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ════════════════════════════════════════════════════════════════════════

-- 1. Ensure required columns exist on squad_applications
ALTER TABLE public.squad_applications 
  ADD COLUMN IF NOT EXISTS lead_phone TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS applicant_course TEXT DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS applicant_year TEXT DEFAULT 'UG 2nd Year';

-- Ensure status constraint supports all valid states
ALTER TABLE public.squad_applications 
  DROP CONSTRAINT IF EXISTS squad_applications_status_check;

ALTER TABLE public.squad_applications 
  ADD CONSTRAINT squad_applications_status_check 
  CHECK (status IN ('pending', 'accepted', 'declined', 'rejected', 'removed'));

-- 2. Ensure squad_posts spot tracking & collegiate columns exist
ALTER TABLE public.squad_posts 
  ADD COLUMN IF NOT EXISTS accepted_emails TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS initial_open_spots INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_members INT DEFAULT 4,
  ADD COLUMN IF NOT EXISTS spots_left INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS course TEXT,
  ADD COLUMN IF NOT EXISTS year TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill missing spots and defaults
UPDATE public.squad_posts
SET spots_left = GREATEST(0, COALESCE(spots_left, (COALESCE(total_members, 4) - 1))),
    initial_open_spots = COALESCE(initial_open_spots, COALESCE(spots_left, 1)),
    is_open = COALESCE(is_open, true)
WHERE spots_left IS NULL OR initial_open_spots IS NULL OR is_open IS NULL;

-- 3. Backfill lead_phone for already-accepted applications
UPDATE public.squad_applications a
SET lead_phone = COALESCE(NULLIF(p.phone_number, ''), pr.phone, ''),
    updated_at = NOW()
FROM public.squad_posts p
LEFT JOIN public.profiles pr ON pr.id = p.user_id
WHERE a.post_id = p.id
  AND a.status = 'accepted'
  AND (a.lead_phone IS NULL OR a.lead_phone = '');

-- 4. Guard Trigger: Prevent self-acceptance, enforce pending on INSERT, block tampering
CREATE OR REPLACE FUNCTION public.guard_squad_application()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Service role / Dashboard override
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- A. INSERT: Force initial pending state, scrub client-injected lead phone
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.lead_phone := NULL;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- B. UPDATE by squad owner (inside respond_to_application): allow
  IF EXISTS (
    SELECT 1 FROM public.squad_posts
    WHERE id = OLD.post_id AND user_id = auth.uid()
  ) THEN
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- C. UPDATE by applicant:
  -- Prevent altering core relationship keys or lead phone
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

-- 5. Auto-reclaim spot when an accepted application is deleted/withdrawn
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

-- 6. Atomic, Row-Locking RPC: respond_to_application
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
  IF p_status NOT IN ('accepted', 'declined', 'rejected', 'removed') THEN
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

  ELSIF p_status IN ('declined', 'rejected', 'removed') THEN
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

-- Grant RPC execution permissions
REVOKE ALL ON FUNCTION public.respond_to_application(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_application(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_application(UUID, TEXT) TO service_role;

-- 7. Row Level Security Policies for squad_applications
ALTER TABLE public.squad_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view applications they sent or received" ON public.squad_applications;
DROP POLICY IF EXISTS "Enable read access on squad_applications" ON public.squad_applications;

CREATE POLICY "Enable read access on squad_applications" 
ON public.squad_applications FOR SELECT 
TO authenticated 
USING (
  applicant_id = auth.uid() 
  OR post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create squad applications" ON public.squad_applications;
CREATE POLICY "Users can create squad applications" 
ON public.squad_applications FOR INSERT 
TO authenticated 
WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Applicants can delete their own applications" ON public.squad_applications;
DROP POLICY IF EXISTS "Users can delete applications" ON public.squad_applications;

CREATE POLICY "Users can delete applications" 
ON public.squad_applications FOR DELETE 
TO authenticated 
USING (
  applicant_id = auth.uid() 
  OR post_id IN (SELECT id FROM public.squad_posts WHERE user_id = auth.uid())
);

-- Applicants update directly (for pitch edits & re-applying)
-- Post owners update status solely through respond_to_application() RPC
DROP POLICY IF EXISTS "Post owners can update application status" ON public.squad_applications;
DROP POLICY IF EXISTS "Post owners and applicants can update applications" ON public.squad_applications;
DROP POLICY IF EXISTS "Applicants can update own application" ON public.squad_applications;

CREATE POLICY "Applicants can update own application" 
ON public.squad_applications FOR UPDATE 
TO authenticated 
USING (applicant_id = auth.uid())
WITH CHECK (applicant_id = auth.uid());

-- 8. Ensure Realtime Publication includes both tables
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

SELECT 'OneStop atomic squad migration applied successfully!' AS status;
