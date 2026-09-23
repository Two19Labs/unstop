# OneStop Backend Setup Guide (Supabase, Google OAuth & Brevo SMTP)

This guide walks you through connecting **Supabase** for the backend database & auth, configuring **Google Cloud Console** for 1-click Google Sign-In, and configuring **Brevo (Sendinblue)** to send up to **300 free transactional emails per day** (for verification, welcome, and password resets).

---

## 1. Supabase Project & Database Setup

1. Go to [database.new](https://database.new) or [supabase.com](https://supabase.com) and create a new project (e.g. `arena-backend`).
2. Copy your **Project URL** and **anon public API key** from **Project Settings > API**.
3. In your local project directory, create or update `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. In the Supabase Dashboard, open the **SQL Editor** tab from the left sidebar.
5. Click **New Query**, open [supabase_schema.sql](file:///c:/Users/adity/Downloads/unstop/supabase_schema.sql), copy its entire contents, paste into the query window, and click **Run**.
6. This creates:
   - `profiles`: Linked to `auth.users` with automated profile sync trigger.
   - `squad_posts`: Teammate recruitment postings with RLS security.
   - `squad_applications`: Teammate applications.
   - `bookmarks`: Saved competitions.

---

## 2. Brevo (Sendinblue) Setup  -  300 Free Emails / Day

Supabase's default email service has a strict rate limit of only 3 emails/hour. By connecting Brevo's free tier via Custom SMTP, you get **300 free emails every day** for signup confirmations and password resets.

### A. Get Your Brevo SMTP Credentials:
1. Sign up for a free account at [brevo.com](https://www.brevo.com).
2. Click on your profile name in the top right corner and navigate to **Senders, Domains & Dedicated IPs**.
3. Add and verify your sender email address (e.g., your personal or studio email `connect@two19labs.in` or Gmail).
4. In the top right menu, click **SMTP & API** (or go to **Settings > Configuration > SMTP**).
5. You will see your SMTP credentials:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: Your Brevo account email (or login identifier)
   - **Master Key / Password**: Generate or copy your Brevo SMTP key.

### B. Configure Brevo SMTP in Supabase:
1. In your Supabase Dashboard, go to **Project Settings > Authentication**.
2. Scroll down to the **SMTP Settings** section.
3. Toggle **Enable Custom SMTP** to `ON`.
4. Enter the Brevo SMTP parameters:
   - **Sender email**: Your verified Brevo sender email (e.g. `connect@two19labs.in` or your verified email)
   - **Sender name**: `OneStop by Two19 Labs`
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Minimum interval between emails**: `60` (or default)
   - **Username**: Your Brevo login email
   - **Password**: Your Brevo SMTP Master Key
5. Click **Save Changes**.
6. (Optional): Under **Authentication > URL Configuration**, ensure the **Site URL** is set to:
   - Local development: `http://localhost:5173`
   - Production: `https://onestop.two19labs.in` (or your Vercel deployment URL)

---

## 3. Google Cloud Console  -  Sign In with Google

To enable one-click "Continue with Google" authentication:

### A. Create Google OAuth Credentials:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one (e.g., `OneStop - Two19 Labs`).
3. In the left navigation, go to **APIs & Services > OAuth consent screen**:
   - User Type: **External**
   - App Name: `OneStop`
   - User support email: your email
   - Developer contact information: your email
   - Scopes: standard `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
   - Save and continue.
4. In the left navigation, go to **APIs & Services > Credentials**:
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `OneStop Web Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - `https://<your-supabase-project-id>.supabase.co`
   - Production domain (e.g. `https://your-domain.vercel.app` or `https://onestop.two19labs.in`)
6. Under **Authorized redirect URIs**, add your Supabase Auth callback URL:
   ```text
   https://ncnkzlugelkhafjtupbf.supabase.co/auth/v1/callback
   ```
   *(Find your exact callback URL in Supabase Dashboard > Authentication > Providers > Google)*
7. Click **Create**. Copy the **Client ID** and **Client Secret**.

### B. Enable Google Provider in Supabase:
1. In Supabase Dashboard, go to **Authentication > Providers**.
2. Click on **Google** to expand its settings.
3. Toggle **Google enabled** to `ON`.
4. Paste the **Client ID** and **Client Secret** copied from Google Cloud Console.
5. Click **Save**.

---

## 4. Testing Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:5173`.
3. **Public Discovery Check**: Browse competitions, apply filters, search keywords  -  no sign-in required!
4. **Squad Finder Protection Check**:
   - Click **Squad Finder** in the top navigation or click **Find Teammates** on any competition card.
   - You will see the Teammate Access Gate and Sign-In Modal.
   - Click **Continue with Google** or enter an email to sign up.
   - Once authenticated, you gain full access to view posts, create squads, apply to teams, and message organizers directly on WhatsApp.
