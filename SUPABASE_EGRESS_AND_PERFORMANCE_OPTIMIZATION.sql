-- ══════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  Supabase Egress & Performance Optimization
-- ══════════════════════════════════════════════════════════════════
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Idempotent, safe to run multiple times, and requires zero downtime.
-- ══════════════════════════════════════════════════════════════════

-- 1. USER ACCOUNT SELF-DELETION RPC
-- Enables authenticated students to completely delete their account and cascades data.
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

  -- Delete from auth.users (cascades sessions, refresh tokens, identities)
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO service_role;


-- 2. HIGH-PERFORMANCE INDEXES FOR EGRESS & QUERY OPTIMIZATION
-- These indexes accelerate user-specific queries and allow Supabase Realtime
-- to filter change events by user_id efficiently without full table scans.

-- Fast index for user bookmarks lookups and Realtime filter (user_id=eq.X)
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_comp_id ON public.bookmarks(comp_id);

-- Fast index for cross-device notification states and Realtime filter (user_id=eq.X)
CREATE INDEX IF NOT EXISTS idx_user_notif_states_user_id ON public.user_notification_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_states_user_dismissed ON public.user_notification_states(user_id, is_dismissed);

-- Fast index for squad applications (applicant & post lookups)
CREATE INDEX IF NOT EXISTS idx_squad_applications_applicant_id ON public.squad_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_squad_applications_post_id ON public.squad_applications(post_id);
CREATE INDEX IF NOT EXISTS idx_squad_applications_status ON public.squad_applications(status);

-- Fast composite index for active squad listings
CREATE INDEX IF NOT EXISTS idx_squad_posts_is_open_created ON public.squad_posts(is_open, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_squad_posts_user_id ON public.squad_posts(user_id);

-- Fast index for squad messages thread retrieval
CREATE INDEX IF NOT EXISTS idx_squad_messages_app_created ON public.squad_messages(application_id, created_at ASC);


-- 3. REPLICA IDENTITY OPTIMIZATION (Minimizes Realtime WAL egress)
-- Setting REPLICA IDENTITY DEFAULT ensures PostgreSQL only sends primary keys
-- and changed column values across the replication stream rather than full table row duplication.
ALTER TABLE public.bookmarks REPLICA IDENTITY DEFAULT;
ALTER TABLE public.user_notification_states REPLICA IDENTITY DEFAULT;
ALTER TABLE public.squad_posts REPLICA IDENTITY DEFAULT;
ALTER TABLE public.squad_applications REPLICA IDENTITY DEFAULT;
ALTER TABLE public.profiles REPLICA IDENTITY DEFAULT;
ALTER TABLE public.squad_messages REPLICA IDENTITY DEFAULT;


-- 4. ENSURE ALL CORE TABLES ARE IN REALTIME PUBLICATION
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


-- 5. VERIFICATION QUERY
SELECT 
  'Egress & performance optimization migration completed successfully!' AS status,
  NOW() AS applied_at;
