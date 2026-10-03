-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop  -  SQUAD CHAT HOTFIX (run once in the Supabase SQL Editor)
-- The live squad_messages table requires application_id, but chat messages now
-- belong to a conversation instead of a join request. Safe to run more than once.
-- ═════════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.squad_messages ALTER COLUMN application_id DROP NOT NULL;

SELECT 'OneStop squad chat hotfix applied.' AS status;
