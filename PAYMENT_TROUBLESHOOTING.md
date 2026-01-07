# Payment API 404 Error - Troubleshooting Guide

## Issue: 404 Not Found on /api/payment/create-order

The error you're seeing means the API route isn't being found on Vercel. Here's how to fix it:

---

## ✅ Fixes Applied

1. **Added test endpoint**: `/api/payment/test` to verify API routes work
2. **Added GET handler** to create-order endpoint for testing
3. **Enhanced error logging** with detailed console messages
4. **All code committed and pushed** to GitHub

---

## 🔧 Required Actions on Vercel

### Step 1: Redeploy Your Application

**CRITICAL:** The API routes exist in the code but Vercel needs to be redeployed.

1. Go to: https://vercel.com/dashboard
2. Select your project: **Snippets-Factory**
3. Click on **Deployments** tab
4. Find the latest deployment
5. Click the **...** menu → **Redeploy**
6. Select "Use existing Build Cache" (faster) or "Redeploy without Cache" (cleaner)
7. Click **Redeploy**

### Step 2: Verify Environment Variables

While you're in Vercel, double-check these are set:

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_S0uF1hg0a5yaeV
RAZORPAY_KEY_SECRET=u2aY6zRJpC7LdTGYLSN4oqnq
NEXT_PUBLIC_SUPABASE_URL=https://fczcfupxmkfdxbyhkeoc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

---

## 🧪 Testing After Redeployment

### Test 1: Verify API Routes Exist

Visit these URLs in your browser (they should return JSON, not 404):

```
https://snippets-factory.vercel.app/api/payment/test
https://snippets-factory.vercel.app/api/payment/create-order
```

**Expected Response for /test:**
```json
{
  "status": "ok",
  "message": "Payment API routes are working",
  "timestamp": "2026-01-07T...",
  "env": {
    "hasRazorpayKey": true,
    "hasRazorpaySecret": true,
    "hasSupabaseUrl": true
  }
}
```

**Expected Response for /create-order (GET):**
```json
{
  "message": "Payment create-order endpoint is working",
  "timestamp": "2026-01-07T..."
}
```

### Test 2: Try Payment Flow

1. Log in to your account
2. Go to pricing page
3. Click "Upgrade" on Pro plan
4. Check browser console for errors
5. Check Vercel function logs for detailed error messages

---

## 🔍 Debugging Steps

### If you still get 404:

1. **Check Vercel Deployment Logs**
   - Go to your deployment in Vercel
   - Click on "Building" to see build logs
   - Look for any errors related to API routes
   - Ensure no routes are being skipped

2. **Check Vercel Function Logs**
   - Go to deployment → "Functions" tab
   - Look for `/api/payment/create-order` in the list
   - If it's not there, the route wasn't deployed

3. **Clear Browser Cache**
   - The 404 might be cached
   - Try in incognito/private mode
   - Or clear your browser cache completely

4. **Check if Route is Listed**
   - In Vercel deployment → "Functions"
   - You should see:
     - `/api/payment/create-order`
     - `/api/payment/capture-order`
     - `/api/payment/test`

### If you get different errors:

**401 Unauthorized:**
- Your session token isn't being sent
- Check browser console for auth errors
- Try logging out and back in

**400 Bad Request:**
- Missing plan or billing parameter
- Check the request payload in Network tab

**500 Internal Server Error:**
- Check Vercel function logs for details
- Likely Razorpay API key issue
- Or Supabase connection problem

---

## 📝 What Changed in Latest Code

### New Files:
- `src/app/api/payment/test/route.ts` - Test endpoint to verify API works

### Modified Files:
- `src/app/api/payment/create-order/route.ts`
  - Added console.log statements for debugging
  - Added GET handler for testing
  - Enhanced error messages with details

### Build Status:
- ✅ Build successful
- ✅ TypeScript compilation passed
- ✅ All routes generated correctly
- ✅ Code pushed to GitHub

---

## 🚀 Expected Behavior After Fix

1. Visit `/api/payment/test` → Should return success JSON
2. Visit `/api/payment/create-order` → Should return endpoint message
3. Click "Upgrade" button → Should open Razorpay modal
4. Complete payment → Should update user plan
5. No 404 errors anywhere

---

## ⚠️ Common Mistakes

1. **Not redeploying after code changes** ← Most common cause of 404
2. **Environment variables not set on Vercel**
3. **Using old deployment URL**
4. **Browser caching old 404 response**

---

## 📞 If Nothing Works

If you still get 404 after:
- Redeploying on Vercel
- Clearing browser cache
- Checking in incognito mode

Then:
1. Share the Vercel deployment URL
2. Share the Vercel function logs
3. Share the browser console errors
4. Check if the file exists in your Vercel deployment by downloading the build

---

## Summary

**Most Likely Cause:** Vercel hasn't been redeployed with the latest code.

**Solution:** Redeploy your application on Vercel and verify the API routes appear in the Functions tab.

**Test URL:** https://snippets-factory.vercel.app/api/payment/test (should work after redeploy)

Last Updated: January 7, 2026
