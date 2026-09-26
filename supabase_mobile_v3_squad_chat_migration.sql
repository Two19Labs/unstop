-- ============================================================================
-- OneStop Mobile v3 & In-Platform Squad Communication Migration Script
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- 1. Ensure comm_method column exists on squad_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'squad_posts' 
      AND column_name = 'comm_method'
  ) THEN
    ALTER TABLE public.squad_posts 
    ADD COLUMN comm_method VARCHAR(20) DEFAULT 'whatsapp';
  END IF;
END $$;

-- 2. Create squad_messages table for competition-scoped squad communications
CREATE TABLE IF NOT EXISTS public.squad_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('lead', 'applicant')),
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. High-performance indexes for instant thread retrieval
CREATE INDEX IF NOT EXISTS idx_squad_messages_app_id 
  ON public.squad_messages(application_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_squad_messages_post_id 
  ON public.squad_messages(post_id);

CREATE INDEX IF NOT EXISTS idx_squad_messages_comp_id 
  ON public.squad_messages(competition_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Participants can view squad messages" ON public.squad_messages;
DROP POLICY IF EXISTS "Authenticated users can insert squad messages" ON public.squad_messages;

-- Policy: Allow users who are party to the thread (lead or applicant) or authenticated to read
CREATE POLICY "Participants can view squad messages"
  ON public.squad_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.squad_posts sp
      WHERE (sp.id::text = squad_messages.post_id OR sp.id = squad_messages.post_id::uuid)
        AND sp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.squad_applications sa
      WHERE (sa.id::text = squad_messages.application_id OR sa.id = squad_messages.application_id::uuid)
        AND sa.applicant_id = auth.uid()
    )
  );

-- Policy: Allow authenticated users to send messages in their threads
CREATE POLICY "Authenticated users can insert squad messages"
  ON public.squad_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
  );

-- 5. Enable Supabase Realtime for live instant messaging
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'squad_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_messages;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if publication permissions are restricted
  RAISE NOTICE 'Realtime publication skipped or already enabled';
END $$;

-- 6. Verification query
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'squad_messages' 
ORDER BY ordinal_position;
