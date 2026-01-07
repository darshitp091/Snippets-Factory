# Vercel Environment Variables Update Guide

## Critical: Update These Environment Variables in Vercel

After deploying, you MUST update these environment variables in your Vercel dashboard:

### 1. Go to Vercel Dashboard
- Navigate to: https://vercel.com/dashboard
- Select your project: `Snippets-Factory`
- Go to: **Settings** → **Environment Variables**

### 2. Update Razorpay API Keys (CRITICAL)

**Delete the old keys and add these new LIVE API keys:**

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_S0uF1hg0a5yaeV
```

```
RAZORPAY_KEY_SECRET=u2aY6zRJpC7LdTGYLSN4oqnq
```

```
RAZORPAY_WEBHOOK_SECRET=Darshit@2208#2005
```

⚠️ **IMPORTANT**: Make sure to:
- Set these for **Production**, **Preview**, and **Development** environments
- Click **Save** after each variable
- **Redeploy** your application after saving

### 3. Verify Other Environment Variables

Make sure these are also set correctly:

```
NEXT_PUBLIC_SUPABASE_URL=https://fczcfupxmkfdxbyhkeoc.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemNmdXB4bWtmZHhieWhrZW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzUwNTAsImV4cCI6MjA4MTcxMTA1MH0.LcHYPtY3EjrILIzXIZv_DqbjSYtlTa_c6PjTkjHmJvM
```

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemNmdXB4bWtmZHhieWhrZW9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzNTA1MCwiZXhwIjoyMDgxNzExMDUwfQ.iplqs_Xpb_QdxqulBJxYyX3Jw1X3OWw8nAaLgTpNz6o
```

```
NEXT_PUBLIC_APP_URL=https://snippets-factory.vercel.app
```

### 4. After Updating Variables

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy** (three dots menu → Redeploy)
4. Select **Use existing Build Cache** (faster)
5. Click **Redeploy**

### 5. Test the Payment Flow

After redeployment:
1. Sign up or log in to your account
2. Go to the Pricing page
3. Click "Upgrade" on any plan
4. Razorpay checkout should open successfully
5. Test with Razorpay test cards (if using test mode)

---

## What Was Fixed

✅ **Authentication Issues**
- Login/Signup no longer requires page refresh
- Proper session handling with window.location.href
- OAuth callback properly configured

✅ **Razorpay Integration**
- Updated to new LIVE API keys
- Fixed payment capture endpoint
- Fixed parameter naming consistency
- Added support for all pricing tiers (Basic, Pro, Enterprise)

✅ **Payment Flow**
- Proper order creation with correct notes format
- Payment verification with correct field names
- Database updates for user plan upgrades

---

## Troubleshooting

### If payment still doesn't work:

1. **Check Vercel Logs**
   - Go to your deployment → **Functions** tab
   - Check logs for `/api/payment/create-order` and `/api/payment/capture-order`

2. **Verify Razorpay Dashboard**
   - Login to https://dashboard.razorpay.com
   - Check if test/live mode is correctly set
   - Verify webhook URL if using webhooks

3. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console for any JavaScript errors
   - Check Network tab for failed API calls

### Common Issues:

- **401 Unauthorized**: User session expired, need to log in again
- **400 Bad Request**: Check if environment variables are set correctly on Vercel
- **Invalid API key**: Razorpay keys not updated in Vercel environment

---

## Security Note

⚠️ **NEVER commit .env.local to Git**
- It's already in .gitignore
- Environment variables are set separately on Vercel
- This file is for your reference only
