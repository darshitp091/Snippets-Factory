# Supabase Configuration Setup

## Required: Configure Callback URLs in Supabase

You MUST add the callback URL to your Supabase project for OAuth and email verification to work.

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "URL Configuration"

3. **Add Site URL**
   ```
   https://snippets-factory.vercel.app
   ```

4. **Add Redirect URLs** (Add ALL of these):
   ```
   http://localhost:3000/auth/callback
   https://snippets-factory.vercel.app/auth/callback
   http://localhost:3000/dashboard
   https://snippets-factory.vercel.app/dashboard
   ```

5. **Email Settings** (Optional but recommended):
   - Go to "Authentication" → "Email Templates"
   - Customize confirmation email template if needed
   - Make sure "Confirm email" is enabled or disabled based on your preference

6. **Save Changes**
   - Click "Save" after adding all URLs

### Testing:
After configuration:
- Try signing up with email
- Try logging in
- Try GitHub OAuth login
- All should now redirect properly

## Email Confirmation Settings

You can choose to:

**Option A: Disable Email Confirmation** (Faster signup)
- Go to Authentication → Providers → Email
- Uncheck "Confirm email"
- Users can login immediately after signup

**Option B: Keep Email Confirmation** (More secure)
- Keep it enabled
- Users will receive confirmation email
- They must click link before logging in
