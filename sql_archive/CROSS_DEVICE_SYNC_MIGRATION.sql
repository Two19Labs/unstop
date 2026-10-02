-- ══════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  Cross-Device Cloud Sync Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Idempotent & safe to run multiple times.
-- ══════════════════════════════════════════════════════════════════

-- 1. Create table for persisting notification read & dismissed states per user
CREATE TABLE IF NOT EXISTS public.user_notification_states (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_id TEXT NOT NULL,
  is_read BOOLEAN DEFAULT TRUE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, notification_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_notification_states ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view and manage their own notification states
DROP POLICY IF EXISTS "Users can manage their own notification states" ON public.user_notification_states;
CREATE POLICY "Users can manage their own notification states" 
  ON public.user_notification_states
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fast lookup index by user_id
CREATE INDEX IF NOT EXISTS idx_user_notif_states_user_id ON public.user_notification_states(user_id);

-- 2. Add Bookmarks, Notification States & Profiles to Supabase Realtime Publication
-- This automatically broadcasts changes across all open devices (phone, laptop, tablet).
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notification_states;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
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
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 3. Verification confirmation
SELECT 'OneStop cross-device sync migration completed successfully!' AS status;
