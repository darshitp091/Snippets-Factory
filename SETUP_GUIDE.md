# 🚀 Snippet Factory - Complete Setup Guide

This guide will walk you through setting up Snippet Factory from scratch to deployment.

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Git installed
- [ ] Supabase account (free tier works)
- [ ] PayPal developer account (optional, for payments)
- [ ] Code editor (VS Code recommended)

## 🔧 Step 1: Initial Setup

### 1.1 Install Dependencies

The project is already initialized with all required dependencies. Verify installation:

```bash
npm install
```

Expected packages:
- Next.js 16 (Framework)
- TypeScript (Type safety)
- Tailwind CSS 4 (Styling)
- GSAP (Animations)
- Three.js (3D graphics)
- Supabase (Backend)
- And 30+ more packages

### 1.2 Verify Installation

```bash
npm run type-check
```

This should complete without errors.

## 🗄️ Step 2: Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project name**: snippet-factory
   - **Database password**: (save this!)
   - **Region**: Choose closest to you
5. Wait for project creation (~2 minutes)

### 2.2 Get Your Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY`

### 2.3 Create Database Schema

1. Go to **SQL Editor** in Supabase
2. Open the file: `src/lib/supabase.ts`
3. Copy the entire `DATABASE_SCHEMA` constant
4. Paste it in the SQL Editor
5. Click **Run**

Expected output: "Success. No rows returned"

### 2.4 Verify Database Setup

Go to **Table Editor** and verify these tables exist:
- users
- teams
- team_members
- categories
- snippets
- snippet_usage
- audit_logs

## 🔐 Step 3: Environment Variables

### 3.1 Create .env.local

```bash
cp .env.local.example .env.local
```

### 3.2 Fill in the values

Edit `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# PayPal Configuration (optional for now)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security
ENCRYPTION_KEY=generate_a_random_32_char_string_here
```

### 3.3 Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `ENCRYPTION_KEY`.

## 💳 Step 4: PayPal Setup (Optional)

### 4.1 Create PayPal App

1. Go to [https://developer.paypal.com](https://developer.paypal.com)
2. Log in
3. Click **Apps & Credentials**
4. Click **Create App**
5. Choose **Merchant** and name it "Snippet Factory"

### 4.2 Get Credentials

1. Copy **Client ID** → `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
2. Show and copy **Secret** → `PAYPAL_CLIENT_SECRET`

### 4.3 Configure Webhooks (Later)

We'll configure webhooks after deployment.

## 🎨 Step 5: Run Development Server

### 5.1 Start the Server

```bash
npm run dev
```

Expected output:
```
▲ Next.js 16.0.10
- Local:        http://localhost:3000
- ready in 2.5s
```

### 5.2 Open in Browser

Go to [http://localhost:3000](http://localhost:3000)

You should see:
- ✅ Animated homepage with gradient title
- ✅ Custom cursor effects
- ✅ Rotating 3D mockup
- ✅ Smooth scrolling animations

## 🧪 Step 6: Test Core Features

### 6.1 Test Homepage

- [ ] Custom cursor follows mouse
- [ ] Scroll triggers animations
- [ ] 3D mockup rotates
- [ ] Buttons have hover effects

### 6.2 Test Dashboard

1. Go to `/dashboard`
2. Verify:
   - [ ] Stats cards display
   - [ ] Snippet cards render
   - [ ] Search bar works
   - [ ] "New Snippet" button opens modal

### 6.3 Test Pricing Page

1. Go to `/pricing`
2. Verify:
   - [ ] Three pricing tiers show
   - [ ] Monthly/Annual toggle works
   - [ ] Cards have hover animations

## 🔒 Step 7: Set Up Authentication

### 7.1 Enable Auth in Supabase

1. Go to **Authentication** in Supabase
2. **Providers** → Enable:
   - [x] Email
   - [x] Google (optional)
   - [x] GitHub (optional)

### 7.2 Configure URLs

1. **Site URL**: `http://localhost:3000`
2. **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

### 7.3 Test Sign Up

1. Click "Start Free Trial"
2. Enter email and password
3. Check email for confirmation
4. Verify redirect to dashboard

## 📊 Step 8: Test Database Operations

### 8.1 Create a Snippet

1. Go to Dashboard
2. Click "New Snippet"
3. Fill in:
   - Title: "Test Snippet"
   - Language: JavaScript
   - Code: `console.log('Hello World');`
   - Tags: test, demo
4. Click "Save"

### 8.2 Verify in Supabase

1. Go to **Table Editor** → snippets
2. Your snippet should appear
3. Check timestamp is correct

### 8.3 Test Search

1. Type "test" in search bar
2. Snippet should appear instantly

## 🚀 Step 9: Build for Production

### 9.1 Run Production Build

```bash
npm run build
```

Expected output:
```
✓ Compiled successfully
✓ Generating static pages
✓ Finalizing page optimization
```

### 9.2 Test Production Build

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) and verify everything works.

## 🌐 Step 10: Deploy to Vercel

### 10.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 10.2 Deploy

```bash
vercel
```

Follow prompts:
- Link to existing project? **No**
- Project name: **snippet-factory**
- Directory: **./** (default)
- Build settings: **default**

### 10.3 Add Environment Variables

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add all variables from `.env.local`
3. Make sure to select all environments (Production, Preview, Development)

### 10.4 Redeploy

```bash
vercel --prod
```

Your app is now live! 🎉

## 🔧 Step 11: Configure Production Settings

### 11.1 Update Supabase URLs

1. In Supabase → **Authentication** → **URL Configuration**
2. Add your Vercel URL:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`

### 11.2 Update Environment Variables

Update in Vercel:
```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 11.3 Enable HTTPS Only

In Supabase:
1. **Settings** → **API**
2. Enable "HTTPS Only"

## 📈 Step 12: Monitor and Optimize

### 12.1 Set Up Analytics

1. Vercel Analytics (built-in)
2. Supabase Dashboard → **Reports**

### 12.2 Monitor Performance

Check Vercel:
- **Analytics** tab for usage
- **Speed Insights** for performance
- **Logs** for errors

### 12.3 Database Backups

In Supabase:
1. **Settings** → **Database**
2. Enable automatic backups

## 🎯 Next Steps

### Essential
- [ ] Create user documentation
- [ ] Set up error tracking (Sentry)
- [ ] Configure email templates
- [ ] Set up monitoring alerts

### Nice to Have
- [ ] Add more snippet templates
- [ ] Create browser extension
- [ ] Build mobile app
- [ ] Add more integrations

## 🆘 Troubleshooting

### Issue: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Supabase connection failed"
- Verify credentials in `.env.local`
- Check Supabase project is running
- Verify network connectivity

### Issue: "Build failed"
```bash
npm run type-check
# Fix any TypeScript errors
npm run build
```

### Issue: "3D animations not working"
- Check browser supports WebGL
- Disable browser extensions
- Try different browser

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [GSAP Documentation](https://greensock.com/docs/)
- [Three.js Documentation](https://threejs.org/docs/)

## 🎊 Success!

If you've completed all steps, you now have:
- ✅ Fully functional local development environment
- ✅ Production-ready build
- ✅ Deployed application on Vercel
- ✅ Configured Supabase database
- ✅ Working authentication
- ✅ Payment integration ready

**Congratulations on launching Snippet Factory!** 🚀

Need help? Open an issue on GitHub or contact support.
