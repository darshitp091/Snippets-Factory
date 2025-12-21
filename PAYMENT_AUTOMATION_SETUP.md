# 💳 Payment Automation Setup Guide

## Complete Automated Plan Upgrade System

This guide explains how to set up the **fully automated payment system** that automatically upgrades user plans when they purchase via Razorpay - no manual intervention required!

---

## 🎯 What This System Does

### Automatic Plan Upgrades
When a user pays for Pro or Enterprise plan:
1. ✅ **Payment captured** by Razorpay
2. ✅ **Webhook triggered** automatically
3. ✅ **User plan upgraded** in database
4. ✅ **Expiry date set** (1 month/1 year)
5. ✅ **Features unlocked** immediately
6. ✅ **Payment recorded** in history

### Automatic Plan Downgrades
When a user's plan expires:
1. ✅ **Daily cron job** checks for expired plans
2. ✅ **Automatic downgrade** to Free plan
3. ✅ **Features locked** automatically
4. ✅ **No manual admin work** required

### Smart Feature Hiding
Based on user's current plan:
- ✅ **Free users**: See only Dashboard, Snippets, Discover, Communities
- ✅ **Pro users**: See everything Free + Analytics + Team
- ✅ **Enterprise users**: See all features
- ✅ **No locked icons** - features are completely hidden if not accessible

---

## 📋 Prerequisites

Before starting, ensure you have:
- [x] Supabase project set up
- [x] Razorpay account created
- [x] Environment variables configured
- [x] Database migrations run

---

## 🗄️ Step 1: Run Database Migration

This migration adds payment tracking and plan expiry automation.

### 1.1 Open Supabase SQL Editor
Go to your Supabase Dashboard → SQL Editor

### 1.2 Run the Migration
Copy and paste the contents of `supabase/migrations/20241220_payment_automation.sql` and click **Run**.

This creates:
- ✅ `payment_history` table - stores all payment transactions
- ✅ `plan_expires_at` column in users table
- ✅ `plan_updated_at` column in users table
- ✅ Automatic triggers for updating timestamps
- ✅ Function to auto-downgrade expired plans
- ✅ RLS policies for security

### 1.3 Enable pg_cron Extension (Optional but Recommended)

For automatic plan expiry checking:

1. Go to Supabase Dashboard → Database → Extensions
2. Search for `pg_cron`
3. Click **Enable**

Then run this SQL:
```sql
SELECT cron.schedule(
  'check-expired-plans',
  '0 0 * * *', -- Run at midnight every day
  $$SELECT check_and_downgrade_expired_plans()$$
);
```

**Note**: If you don't enable pg_cron, expired plans won't auto-downgrade. You'll need to manually run the function or set up an external cron job.

---

## 🔑 Step 2: Configure Razorpay Webhook

### 2.1 Get Your Webhook URL

Your webhook URL will be:
```
https://your-domain.com/api/webhooks/razorpay
```

For local testing:
```
http://localhost:3000/api/webhooks/razorpay
```

**Important**: For local testing, you'll need to expose your localhost using tools like:
- [ngrok](https://ngrok.com/) - `ngrok http 3000`
- [localtunnel](https://localtunnel.github.io/www/) - `lt --port 3000`

### 2.2 Create Webhook in Razorpay Dashboard

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **Webhooks**
3. Click **+ Add New Webhook**

Configure the webhook:
- **URL**: `https://your-domain.com/api/webhooks/razorpay`
- **Secret**: Generate a strong secret (save this!)
- **Events to Send**: Select these events:
  - ✅ `payment.captured`
  - ✅ `payment.failed`
  - ✅ `subscription.activated` (optional, for future use)
  - ✅ `subscription.cancelled` (optional, for future use)

4. Click **Create Webhook**
5. **Copy the webhook secret** - you'll need it in Step 3

---

## 🔐 Step 3: Update Environment Variables

### 3.1 Add Webhook Secret to .env.local

Open your `.env.local` file and add:

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # ← Add this line
```

**Important Security Notes**:
- ✅ Never commit `.env.local` to Git
- ✅ Keep webhook secret secure
- ✅ Use different secrets for test/live modes
- ✅ Rotate secrets periodically

### 3.2 Verify Other Required Variables

Ensure you have all required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Security
ENCRYPTION_KEY=your_encryption_key_here
```

---

## 🧪 Step 4: Test the Automation

### 4.1 Test Payment Flow (Test Mode)

1. **Switch Razorpay to Test Mode**:
   - In Razorpay Dashboard, toggle to "Test Mode"
   - Use test API keys starting with `rzp_test_`

2. **Make a Test Payment**:
   - Login to your app
   - Go to `/pricing`
   - Click "Checkout with Razorpay" for Pro plan
   - Use Razorpay test card details:
     - **Card**: 4111 1111 1111 1111
     - **CVV**: Any 3 digits
     - **Expiry**: Any future date
   - Complete the payment

3. **Verify Automation**:
   - Check webhook logs in Razorpay Dashboard
   - Check browser console for any errors
   - Go to Supabase Dashboard → Table Editor → Users
   - Verify your user's plan is now "pro"
   - Verify `plan_expires_at` is set to 1 month/year from now
   - Check `payment_history` table for the payment record

4. **Verify Feature Access**:
   - Refresh the page
   - Check sidebar navigation - Analytics and Team should now be visible
   - Try accessing `/analytics` - should work now
   - Try accessing `/team` - should work now

### 4.2 Test Feature Hiding (Free Plan)

1. **Downgrade to Free** (for testing):
   ```sql
   -- Run this in Supabase SQL Editor
   UPDATE users
   SET plan = 'free', plan_expires_at = NULL
   WHERE id = 'your-user-id';
   ```

2. **Verify Features Hidden**:
   - Refresh the page
   - Check sidebar - Analytics and Team should be hidden
   - Try accessing `/analytics` directly - should redirect
   - Try accessing `/team` directly - should redirect

### 4.3 Test Plan Expiry (Optional)

To test automatic downgrade when plan expires:

1. **Set plan expiry to past**:
   ```sql
   -- Run this in Supabase SQL Editor
   UPDATE users
   SET
     plan = 'pro',
     plan_expires_at = NOW() - INTERVAL '1 day'
   WHERE id = 'your-user-id';
   ```

2. **Manually trigger the downgrade function**:
   ```sql
   SELECT check_and_downgrade_expired_plans();
   ```

3. **Verify downgrade**:
   - Check users table - plan should be 'free'
   - Refresh app - features should be hidden

---

## 🏗️ Architecture Overview

### Payment Flow Diagram

```
┌─────────────┐
│    User     │
│ Clicks Pay  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend (pricing/page.tsx)        │
│  - User selects plan                │
│  - Clicks checkout button           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  API: /api/payment/create-order     │
│  - Validates user & plan            │
│  - Creates Razorpay order           │
│  - Adds plan info to notes          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Razorpay Checkout Modal            │
│  - User enters card details         │
│  - Razorpay processes payment       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Razorpay captures payment          │
│  - Triggers payment.captured event  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Webhook: /api/webhooks/razorpay    │
│  - Verifies webhook signature       │
│  - Reads plan info from notes       │
│  - Updates user plan in database    │
│  - Sets plan_expires_at             │
│  - Records payment in history       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Database Triggers                   │
│  - Auto-update plan_updated_at      │
│  - User plan = 'pro' ✅             │
│  - Features unlocked ✅             │
└─────────────────────────────────────┘
```

### Daily Expiry Check (pg_cron)

```
┌─────────────────────────────────────┐
│  Every day at midnight              │
│  pg_cron runs scheduled job         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  check_and_downgrade_expired_plans()│
│  - Finds users with expired plans   │
│  - Sets plan = 'free'               │
│  - Updates plan_updated_at          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  User automatically downgraded      │
│  - Features hidden on next login    │
│  - No manual work required ✅       │
└─────────────────────────────────────┘
```

---

## 🔒 Security Features

### Implemented Security Measures

1. **Webhook Signature Verification**
   - Every webhook request is verified using HMAC SHA256
   - Prevents unauthorized requests
   - Rejects invalid signatures

2. **Payment Verification**
   - Razorpay signature verified on frontend
   - Double verification on backend
   - Payment ID, Order ID, Signature all checked

3. **Database Security**
   - Row-Level Security (RLS) enabled on all tables
   - Users can only see their own payment history
   - Service role required for plan updates

4. **Input Validation**
   - All user inputs validated
   - SQL injection protection via parameterized queries
   - Type checking with TypeScript

5. **Environment Variables**
   - Sensitive keys stored in .env.local
   - Never exposed to client
   - Different keys for test/production

---

## 📊 Database Schema

### users Table Updates
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  plan_expires_at TIMESTAMPTZ,      -- NEW: When plan expires
  plan_updated_at TIMESTAMPTZ,      -- NEW: When plan was last updated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### payment_history Table
```sql
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  payment_id TEXT NOT NULL,
  order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  duration_type TEXT CHECK (duration_type IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'razorpay',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 Feature Visibility Logic

### Sidebar Navigation
File: `src/components/layout/DashboardSidebar.tsx`

```typescript
// Hide features based on plan
if (item.requiresPlan) {
  const hasAccess =
    (item.requiresPlan === 'pro' && (userPlan === 'pro' || userPlan === 'enterprise')) ||
    (item.requiresPlan === 'enterprise' && userPlan === 'enterprise');

  if (!hasAccess) {
    return null; // Don't render at all
  }
}
```

### Header Navigation
File: `src/components/layout/Header.tsx`

```typescript
{/* Analytics - only for Pro and Enterprise */}
{(userPlan === 'pro' || userPlan === 'enterprise') && (
  <Link href="/analytics">Analytics</Link>
)}

{/* Team - only for Pro and Enterprise */}
{(userPlan === 'pro' || userPlan === 'enterprise') && (
  <Link href="/team">Team</Link>
)}
```

---

## 🛠️ Troubleshooting

### Webhook not firing?

**Check**:
1. Is webhook URL correct and accessible?
2. Is `RAZORPAY_WEBHOOK_SECRET` set correctly?
3. Check Razorpay Dashboard → Webhooks → Logs
4. Check browser console for errors
5. For localhost: Are you using ngrok/localtunnel?

**Solution**:
```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Expose localhost
ngrok http 3000

# Use the ngrok URL in Razorpay webhook settings
```

### Plan not upgrading after payment?

**Check**:
1. Open browser console during checkout
2. Check for errors in `/api/webhooks/razorpay` logs
3. Verify webhook signature is correct
4. Check Supabase logs for database errors

**Debug**:
```sql
-- Check if payment was recorded
SELECT * FROM payment_history
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 5;

-- Check user plan
SELECT id, email, plan, plan_expires_at, plan_updated_at
FROM users
WHERE id = 'your-user-id';
```

### Features still locked after plan upgrade?

**Solution**:
1. Hard refresh the page (Ctrl+Shift+R)
2. Clear browser cache
3. Logout and login again
4. Check if plan was actually updated in database

### Payment successful but webhook shows error?

**Check**:
1. Webhook logs in Razorpay Dashboard
2. Error message in webhook response
3. Database connection issues
4. RLS policies blocking the update

**Fix**:
```sql
-- Manually upgrade user if webhook failed
UPDATE users
SET
  plan = 'pro',
  plan_expires_at = NOW() + INTERVAL '1 month',
  plan_updated_at = NOW()
WHERE id = 'user-id-from-payment-notes';
```

### Automatic downgrade not working?

**Check**:
1. Is pg_cron extension enabled?
2. Is cron job scheduled?
3. Check if function exists

**Verify**:
```sql
-- Check if cron job is scheduled
SELECT * FROM cron.job;

-- Manually run the function
SELECT check_and_downgrade_expired_plans();

-- Check expired users
SELECT id, email, plan, plan_expires_at
FROM users
WHERE plan != 'free'
  AND plan_expires_at < NOW();
```

---

## 🚀 Production Deployment Checklist

Before going live:

- [ ] Switch Razorpay from Test to Live mode
- [ ] Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` to live key
- [ ] Update `RAZORPAY_KEY_SECRET` to live secret
- [ ] Create new webhook with live mode secret
- [ ] Update `RAZORPAY_WEBHOOK_SECRET` with live webhook secret
- [ ] Verify webhook URL is production domain (not localhost/ngrok)
- [ ] Enable pg_cron extension in production Supabase
- [ ] Schedule cron job in production database
- [ ] Test complete payment flow in live mode with real ₹1 payment
- [ ] Set up monitoring/alerts for webhook failures
- [ ] Configure proper error tracking (Sentry, LogRocket, etc.)
- [ ] Set up email notifications for successful payments
- [ ] Create refund policy and implement refund handling
- [ ] Set up customer support system

---

## 📈 Monitoring & Analytics

### Important Metrics to Track

1. **Payment Success Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate
   FROM payment_history
   WHERE created_at > NOW() - INTERVAL '30 days';
   ```

2. **Revenue by Plan**
   ```sql
   SELECT
     plan_type,
     SUM(amount) as total_revenue,
     COUNT(*) as payment_count
   FROM payment_history
   WHERE status = 'success'
     AND created_at > NOW() - INTERVAL '30 days'
   GROUP BY plan_type;
   ```

3. **Active Subscriptions**
   ```sql
   SELECT
     plan,
     COUNT(*) as active_users
   FROM users
   WHERE plan != 'free'
     AND (plan_expires_at IS NULL OR plan_expires_at > NOW())
   GROUP BY plan;
   ```

4. **Churn Rate (Expired Plans)**
   ```sql
   SELECT
     COUNT(*) as expired_users
   FROM users
   WHERE plan_expires_at < NOW()
     AND plan != 'free';
   ```

---

## 🎉 Summary

You now have a **fully automated SaaS payment system**:

✅ **Automatic plan upgrades** via Razorpay webhooks
✅ **Automatic plan downgrades** via pg_cron
✅ **Smart feature hiding** based on user plan
✅ **Complete payment tracking** in database
✅ **Secure webhook verification**
✅ **Zero manual intervention** required

Users can:
- Purchase plans directly from `/pricing`
- Get instant access to features
- See only features they have access to
- Plans automatically expire and downgrade

Admins don't need to:
- Manually upgrade users
- Track payment status
- Manage feature access
- Handle plan expiries

**It all happens automatically in the backend!** 🚀
