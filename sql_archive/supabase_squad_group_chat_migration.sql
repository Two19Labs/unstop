-- ============================================================================
-- OneStop Squad Communication & Multi-Member Group Chat Migration Script
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- Idempotent & safe to run multiple times.
-- ============================================================================

-- 1. Extend sender_role check constraint to permit 'member' for accepted teammates
DO $$
BEGIN
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

-- 2. Ensure post_id and application_id columns exist and are properly indexed
CREATE INDEX IF NOT EXISTS idx_squad_messages_post_created 
  ON public.squad_messages(post_id, created_at ASC);

-- 3. Policy update: Allow accepted squad members to read and participate in thread
DROP POLICY IF EXISTS "Participants can view squad messages" ON public.squad_messages;
CREATE POLICY "Participants can view squad messages"
  ON public.squad_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.squad_posts sp
      WHERE (sp.id::text = squad_messages.post_id OR sp.id::text = squad_messages.post_id)
        AND sp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.squad_applications sa
      WHERE (sa.id::text = squad_messages.application_id OR sa.post_id::text = squad_messages.post_id)
        AND sa.applicant_id = auth.uid()
    )
  );

-- 4. Verification confirmation
SELECT 'OneStop squad group chat migration applied successfully!' AS status;
