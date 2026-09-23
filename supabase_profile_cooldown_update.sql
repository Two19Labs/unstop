-- ════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  24-Hour Profile Change Cooldown Migration
-- ════════════════════════════════════════════════════════════════════════
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Idempotent & safe to run multiple times.
-- ════════════════════════════════════════════════════════════════════════

-- 1. Ensure profile_last_updated_at exists on profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_last_updated_at TIMESTAMPTZ;

-- 2. Ensure RLS policies allow users to update their own profile_last_updated_at
-- (Existing policies on public.profiles already allow users to update their own row: auth.uid() = id)
