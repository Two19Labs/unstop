# OneStop Auth & Account Security Guide
### Two19 Labs  -  Password Reset & Account Deletion Setup

This document provides a comprehensive step-by-step guide on how the **email-based password reset/change** and **password-protected account deletion** systems work, and what actions (if any) you must perform in Supabase.

---

## 1. What Has Been Implemented

### A. Email-Verified Password Change & Forget Password
1. **Change Password (from Profile screen):**
   - When a signed-in user clicks **Change password**, they are prompted to enter their account email (prefilled with their current email).
   - Clicking **Send Confirmation Email** triggers Supabase's `resetPasswordForEmail()` method.
   - Supabase dispatches a confirmation email with a secure recovery link to the user's inbox (via Brevo SMTP).
   - The user cannot directly set a new password in the profile screen without opening and verifying the link in their email.
2. **Forgot Password (from Sign In modal):**
   - Clicking **Forgot password?** prompts the user for their registered email.
   - When submitted, the same secure recovery email is sent.
3. **Password Update Modal:**
   - Clicking the link in the email redirects the user back to the application.
   - OneStop intercepts the `PASSWORD_RECOVERY` event / token and opens the **Set New Password** modal.
   - The user inputs and confirms their new password (minimum 6 characters), which updates `auth.users` in Supabase with end-to-end encryption.

---

### B. Password-Protected Account Deletion
1. When a user navigates to **Profile** > **Delete account**:
   - The dialog requires them to enter their **Current Password**.
   - Includes a view/hide password toggle to avoid typos.
   - The **Permanently Delete Account** button remains disabled until a valid password of at least 6 characters is typed.
2. When submitted:
   - The app verifies their password with Supabase Auth (`signInWithPassword`).
   - **If the password is incorrect:** Deletion is blocked, and the modal shows:  
     `"Incorrect password. Please enter your valid current password to confirm account deletion."`
   - **If the password is correct:** The app invokes the `delete_user_account()` PostgreSQL RPC function, which permanently removes:
     - Saved bookmarks (`public.bookmarks`)
     - Squad applications (`public.squad_applications`)
     - Created squad openings (`public.squad_posts`)
     - Notification preferences & states (`public.user_notification_states`, `public.user_notifications`)
     - Squad messages (`public.squad_messages`)
     - User profile (`public.profiles`)
     - Auth credentials & sessions (`auth.users`)
   - The user is signed out and all cached local storage is wiped.

---

## 2. Step-by-Step Supabase Setup

### Step 1: Run the SQL Script in Supabase
To ensure the `delete_user_account()` RPC is active and up to date, run the following script in your Supabase SQL Editor:

1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your OneStop project: `ncnkzlugelkhafjtupbf`.
3. In the left navigation, click **SQL Editor** (icon with `>_`).
4. Click **New query** (or open an existing query tab).
5. Paste the following SQL script:

```sql
-- ══════════════════════════════════════════════════════════════════
-- OneStop by Two19 Labs  -  User Account Self-Deletion Migration
-- ══════════════════════════════════════════════════════════════════

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

  -- Delete public table records across all user interactions
  DELETE FROM public.bookmarks WHERE user_id = v_user_id;
  DELETE FROM public.squad_applications WHERE applicant_id = v_user_id;
  DELETE FROM public.squad_posts WHERE user_id = v_user_id;
  DELETE FROM public.user_notification_states WHERE user_id = v_user_id;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_notifications') THEN
    DELETE FROM public.user_notifications WHERE user_id = v_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'squad_messages') THEN
    DELETE FROM public.squad_messages WHERE sender_id = v_user_id;
  END IF;

  DELETE FROM public.profiles WHERE id = v_user_id;

  -- Delete user from auth.users (cascading all auth tokens & identities)
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Grant execution permission to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO service_role;
```

6. Click **Run** (or press `Ctrl + Enter` / `Cmd + Enter`).
7. Confirm that the query succeeds with **"Success. No rows returned"**.

---

### Step 2: Configure Supabase Redirect URLs
When users click the password recovery link in their email, Supabase redirects them back to your website.

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**.
2. **Site URL:**  
   Set this to your production URL, for example:  
   `https://unstop.vercel.app` (or your active custom domain).
3. **Redirect URLs:**  
   Add the following patterns to allow local development and production redirects:
   - `http://localhost:5173/**`
   - `http://localhost:3000/**`
   - `https://your-domain.vercel.app/**` (replace with your Vercel deployment URL)
4. Click **Save**.

---

### Step 3: Verify Email Templates & SMTP (Brevo)
1. Go to **Authentication** > **Email Templates** > **Reset Password**.
2. Ensure the template body includes the confirmation URL:
   ```html
   <h2>Reset Password</h2>
   <p>Follow this link to reset the password for your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
   ```
3. Go to **Project Settings** > **Authentication** > **SMTP Settings**:
   - Ensure **Enable Custom SMTP** is turned ON.
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - User: your Brevo login email or API SMTP key.
   - Sender Email: `noreply@two19labs.com` (or your verified Brevo sender).

---

## 3. How to Test

1. **Test Change Password:**
   - Sign in to your account.
   - Navigate to the **Profile** tab.
   - Under the **Account** card, click **Change password**.
   - Confirm your email and click **Send Confirmation Email**.
   - Check your email inbox. Click the **Reset Password** link.
   - The app will open the **Set New Password** modal.
   - Type your new password (minimum 6 characters), confirm it, and click **Save New Password**.

2. **Test Delete Account:**
   - Navigate to **Profile** > **Delete account**.
   - Attempt submitting with an incorrect password to confirm that deletion is blocked.
   - Type your correct current password and click **Permanently Delete Account**.
   - Verify that your account is deleted, your session ends, and you are signed out.
