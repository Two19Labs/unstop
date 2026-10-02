-- ═════════════════════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs - SQUAD LEAD UNDO DECLINE / PENDING STATUS UPDATE
-- Run this query in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Allows squad leads to move applications back to 'pending' atomically via respond_to_application.
-- ═════════════════════════════════════════════════════════════════════════════════

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
  IF p_status NOT IN ('accepted', 'declined', 'rejected', 'removed', 'pending') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- 1. Fetch application
  SELECT * INTO v_app FROM public.squad_applications WHERE id = p_app_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found: %', p_app_id;
  END IF;

  -- 2. Lock post row to serialize concurrent updates
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

  ELSIF p_status IN ('declined', 'rejected', 'removed', 'pending') THEN
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

GRANT EXECUTE ON FUNCTION public.respond_to_application(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_application(UUID, TEXT) TO service_role;
