# 🚀 Quick Setup Guide - Fix Fetch Error

## The Issue
You're getting a fetch error because your `.env` file isn't properly configured with your Supabase credentials.

## 🔧 Quick Fix (2 minutes)

### Step 1: Create your .env file
1. Copy the content from `ENV_TEMPLATE_COPY_TO_DOTENV.txt`
2. Create a new file called `.env` in your project root
3. Paste the content into the `.env` file

### Step 2: Get your Supabase credentials
1. Go to [your Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)
   - **service_role** key (also starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

### Step 3: Update your .env file
Replace these placeholders in your `.env` file:
```bash
# Change this:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# To your actual values:
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AND ALSO update the EXPO_PUBLIC versions:
EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Restart your app
```bash
# Stop your current Expo server (Ctrl+C)
# Then restart:
npm start
# or
expo start
```

### Step 5: Reset your database (if needed)
1. Follow the `DATABASE_RESET_GUIDE.md`
2. Run the reset script first
3. Then run the migration

## ✅ Test it works
After restarting, try uploading an image. The fetch error should be gone!

## 🐛 Still having issues?
- Make sure both `SUPABASE_URL` AND `EXPO_PUBLIC_SUPABASE_URL` are set to the same value
- Make sure both `SUPABASE_ANON_KEY` AND `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set to the same value
- Double-check there are no extra spaces or quotes around the values
- Make sure your `.env` file is in the project root (same level as `package.json`)

The fetch error you're seeing is happening because the app can't connect to Supabase without proper credentials! 🔑 