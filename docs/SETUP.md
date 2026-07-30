# NEO Reels Setup Guide

Complete setup from zero to running both apps locally.

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- Git
- Supabase account ([sign up](https://supabase.com))
- Vercel account (optional, for admin deployment)

## Step 1: Supabase Setup

### 1a. Create a Supabase Project

1. Go to https://supabase.com and sign up
2. Create a new project:
   - Organization: Create or select one
   - Project name: `neo-reels`
   - Database password: Generate strong password (save it!)
   - Region: Pick closest to your location
   - Pricing: Free tier is fine for MVP

3. Wait ~2 min for project to initialize

### 1b. Get Your Credentials

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1c. Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy the entire contents of `docs/supabase-schema.sql`
4. Paste into the SQL editor
5. Click **Run**

Wait for all tables to be created (you should see 14+ tables in the sidebar).

### 1d. Set Up Auth

1. Go to **Authentication** > **Providers**
2. Email provider is already enabled by default ✓
3. Go to **Authentication** > **Policies**
4. Make sure "Enable email confirmations" is checked (for production; can disable for MVP testing)

## Step 2: Admin Web App Setup

```bash
cd admin

# Install dependencies
npm install

# Create env file
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Start dev server
npm run dev
```

Open http://localhost:3000

### Create Admin Account

1. Click "Sign in" on the login page
2. You'll get an error (no account yet) — that's fine
3. Go back to Supabase dashboard
4. In **Authentication** > **Users**, click **Add user**
5. Enter:
   - Email: `admin@neohomeloans.com`
   - Password: `Test1234!` (dev only)
   - Auto confirm: checked
6. Click **Create user**

Now sign in at http://localhost:3000/login with those credentials.

You should see the dashboard with:
- Sidebar with navigation
- Stats cards (placeholder data)
- Adoption gaps panel
- Render queue panel
- Published videos grid

## Step 3: Officer Mobile App Setup

```bash
cd officer

# Install dependencies
npm install

# Create env file
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
# REACT_APP_SUPABASE_URL=https://your-project.supabase.co
# REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Start Expo dev server
npm start
```

### Run on Simulator/Emulator

From the Expo terminal:
- Press `i` for iOS Simulator (Mac only)
- Press `a` for Android Emulator
- Press `w` for web preview (recommended for quick testing)

### Create Officer Account

1. Go back to Supabase **Authentication** > **Users**
2. Click **Add user**
3. Enter:
   - Email: `dana@example.com`
   - Password: `Test1234!`
   - Auto confirm: checked
4. Click **Create user**

Now sign in at the mobile app login screen with those credentials.

You should see:
- Greeting ("Hey Dana")
- Progress card ("2 of 3 done")
- Assigned scripts section
- "Write your own script" card

## Step 4: Quick Test

### Admin App
- [ ] Can log in
- [ ] Can see Dashboard
- [ ] Can navigate to Users, Scripts, Videos, Branding
- [ ] All placeholder data displays

### Officer App
- [ ] Can log in
- [ ] Can see Home screen
- [ ] Can navigate to Videos and Profile tabs
- [ ] Can tap "Write your own script" (goes to Compose)

## Step 5: Next Steps

You're now ready to start development! Here's the recommended order:

### Week 1: Database + CRUD
1. Hook admin Users page to Supabase
2. Hook admin Scripts page to Supabase
3. Create user/script/scene CRUD endpoints
4. Officer app: Home screen fetches assigned scripts

### Week 2: Recording Flow
1. Officer recording screen (camera integration)
2. Upload clips to Supabase Storage
3. Review/retake flow

### Week 3: Render Pipeline
1. Integrate Shotstack API
2. Render job polling
3. Download finished video

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install
```

### "Invalid credentials" on login
- Check Supabase credentials in `.env.local`
- Make sure user exists in Supabase **Authentication** > **Users**
- Try creating a fresh user

### Expo app won't start
```bash
npm start -- --clear
```

### "RLS policy violation"
This means Row Level Security is blocking access. For MVP, you can temporarily disable RLS:
1. In Supabase, go to each table (e.g., `users`)
2. Click the 🔐 icon
3. Disable RLS (toggle off)
4. Re-enable and fix policies later

## Next Phases

Once Phase 1 (CRUD) is working:

**Phase 2:** Wire up the recording flow
- Officer camera access
- Upload scene clips
- Store in Supabase Storage

**Phase 3:** Integrate Shotstack
- Create Shotstack account
- API key in env vars
- Test render pipeline with sample clips

**Phase 4:** Polish
- AI script generation
- End card templates
- Notifications
- Deploy to Vercel + EAS

---

**Stuck?** Check:
1. Supabase SQL Editor for table errors
2. Browser console (admin) or Expo logs (officer)
3. Supabase logs in dashboard
4. GitHub issues: https://github.com/cmjaxin/FINFREE-REELS/issues
