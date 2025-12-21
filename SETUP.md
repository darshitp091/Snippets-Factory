# Snippet Factory - Setup Guide

## 🚀 Quick Setup

### 1. Create New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose a name (e.g., "snippet-factory")
4. Set a strong database password
5. Select a region close to you
6. Click "Create new project"
7. **Wait for project to finish setting up** (2-3 minutes)

### 2. Run Database Migration

1. In Supabase Dashboard, click **"SQL Editor"**
2. Click **"+ New query"**
3. Open file: `supabase/migrations/setup.sql`
4. Copy ALL contents
5. Paste into SQL Editor
6. Click **"Run"**
7. You should see: ✅ "Database setup complete!"

### 3. Get Your API Keys

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 4. Update Environment Variables

#### For Vercel Deployment:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

3. Add Razorpay keys (optional):
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

4. Click **"Redeploy"** to apply changes

#### For Local Development:

1. Create `.env.local` file in project root
2. Copy from `.env.local.example` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Test Signup

1. Go to your app (local or deployed)
2. Navigate to `/signup`
3. Create a new account
4. Should work without errors! ✅

---

## 📁 Project Structure

```
snippet-factory/
├── src/
│   ├── app/              # Next.js app pages
│   ├── components/       # React components
│   └── lib/
│       └── supabase.ts   # Supabase client
├── supabase/
│   └── migrations/
│       └── setup.sql     # Database setup (RUN THIS)
├── .env.local.example    # Example environment variables
└── README.md            # Project documentation
```

---

## 🔧 Troubleshooting

### Signup returns 500 error

**Check:**
1. Did you run `setup.sql` in Supabase SQL Editor?
2. Are environment variables set correctly in Vercel?
3. Check Supabase Dashboard → **Logs** → **Database** for errors

### Placeholder.supabase.co error

**Fix:** Environment variables are not set correctly. Make sure:
- Variables have `NEXT_PUBLIC_` prefix for client-side access
- You redeployed Vercel after adding variables

### Email confirmation not working

**Check:** Supabase Dashboard → **Authentication** → **Email Settings**
- For testing, you can disable email confirmation
- For production, configure SMTP settings

---

## ✅ What the Setup Does

The `setup.sql` migration creates:
- ✅ `users` table (linked to auth.users)
- ✅ `teams` table (for team workspaces)
- ✅ `team_members` table (team membership)
- ✅ `categories` table (snippet categories)
- ✅ `snippets` table (code snippets)
- ✅ Row Level Security policies
- ✅ Trigger to auto-create user records on signup
- ✅ Default categories for new teams

---

## 📞 Need Help?

If you encounter issues:
1. Check Supabase **Database Logs** for detailed errors
2. Verify all environment variables are set correctly
3. Make sure you ran the `setup.sql` migration

---

**That's it! Your Snippet Factory is ready to use.** 🎉
