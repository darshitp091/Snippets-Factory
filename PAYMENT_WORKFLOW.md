# Payment to Feature Access Workflow

## Complete Payment Flow Documentation

### Overview
This document explains how the payment system works from the moment a user clicks "Upgrade" to when they can access their new plan features.

---

## 1. User Initiates Payment

**Location**: [src/app/pricing/page.tsx](src/app/pricing/page.tsx)

**Process**:
1. User clicks "Upgrade" button on pricing page
2. System fetches user session token from Supabase
3. Makes POST request to `/api/razorpay/create-order` with:
   - `plan`: 'basic', 'pro', or 'enterprise'
   - `billing`: 'monthly' or 'yearly'
   - `Authorization` header with Bearer token

---

## 2. Order Creation

**Location**: [src/app/api/razorpay/create-order/route.ts](src/app/api/razorpay/create-order/route.ts)

**Process**:
1. Validates authentication token with Supabase
2. Validates plan and billing parameters
3. Calculates amount based on plan pricing:
   - Basic: ₹599/month or ₹5,999/year
   - Pro: ₹1,799/month or ₹17,999/year
   - Enterprise: ₹7,999/month or ₹79,999/year
4. Creates Razorpay order with:
   - Receipt ID (max 40 chars)
   - Order notes containing user_id, plan, billing
5. Returns: orderId, amount, currency, keyId

---

## 3. Razorpay Checkout Modal

**Process**:
1. Frontend loads Razorpay checkout.js script
2. Opens Razorpay payment modal with order details
3. User completes payment using:
   - Credit/Debit Card
   - UPI
   - Net Banking
   - Wallets

---

## 4. Payment Verification

**Location**: [src/app/api/razorpay/verify-payment/route.ts](src/app/api/razorpay/verify-payment/route.ts)

**Process**:
1. Receives payment response with:
   - razorpay_order_id
   - razorpay_payment_id
   - razorpay_signature
2. Verifies signature using crypto HMAC SHA256
3. Fetches order details from Razorpay
4. Extracts user_id, plan, billing from order notes
5. **Updates user record in Supabase users table**:
   ```typescript
   {
     plan: 'basic' | 'pro' | 'enterprise',
     max_snippets: 100 | -1 | -1,
     max_collections: 10 | -1 | -1,
     team_members_limit: 1 | 5 | -1,
     ai_generations_limit: 50 | 100 | -1,
     api_calls_limit: 500 | 1000 | -1,
     subscription_status: 'active',
     subscription_start: '2026-01-07T...',
     subscription_end: '2026-02-07T...' // +1 month or +1 year
   }
   ```
6. Logs payment in audit_logs table
7. Returns success response

---

## 5. Feature Access Control

### A. Plan Features Definition

**Location**: [src/lib/plans.ts](src/lib/plans.ts)

**Plan Features**:

| Feature | Free | Basic | Pro | Enterprise |
|---------|------|-------|-----|------------|
| Max Snippets | 10 | 100 | Unlimited | Unlimited |
| Collections | 1 | 10 | Unlimited | Unlimited |
| Team Members | 1 | 1 | 5 | Unlimited |
| AI Generations/mo | 0 | 50 | 100 | Unlimited |
| API Calls/mo | 0 | 500 | 1,000 | Unlimited |
| Analytics | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ✅ | ✅ |
| AI Categorization | ❌ | ✅ | ✅ | ✅ |
| Advanced Search | ❌ | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | ✅ |
| SSO | ❌ | ❌ | ❌ | ✅ |

### B. Server-Side Verification

**Location**: [src/lib/middleware/planVerification.ts](src/lib/middleware/planVerification.ts)

**Functions**:

1. **verifyFeatureAccess(feature)**
   - Checks if user's plan includes specific feature
   - Returns 403 with upgrade prompt if not available

2. **verifySnippetLimit(userId)**
   - Checks current snippet count vs max_snippets
   - Returns 403 if limit reached

3. **verifyTeamMemberLimit(userId)**
   - Checks current team member count vs limit
   - Returns 403 if limit reached

4. **isSubscriptionActive(userId)**
   - Verifies subscription_status === 'active'
   - Checks subscription_end > current date

### C. Client-Side Access Control

**Location**: [src/lib/plans.ts](src/lib/plans.ts)

**Usage Example**:
```typescript
import { usePlanAccess } from '@/lib/plans';

function AnalyticsDashboard() {
  const user = useUser(); // Get user from Supabase
  const planAccess = usePlanAccess(user.plan);

  if (!planAccess.hasFeature('analytics')) {
    return <UpgradePrompt feature="analytics" />;
  }

  return <AnalyticsCharts />;
}
```

---

## 6. Feature Gating Implementation

### API Routes
```typescript
// Example: API route that requires Pro plan
import { verifyFeatureAccess } from '@/lib/middleware/planVerification';

export async function POST(req: Request) {
  const verification = await verifyFeatureAccess('api_access');

  if (!verification.authorized) {
    return verification.errorResponse;
  }

  // Proceed with API logic
}
```

### Frontend Components
```typescript
// Example: Component that checks feature access
import { PLAN_FEATURES } from '@/lib/plans';

function TeamInvite({ userPlan }) {
  const maxMembers = PLAN_FEATURES[userPlan].maxTeamMembers;

  if (currentMembers >= maxMembers) {
    return <UpgradeToPro message="Add more team members" />;
  }

  return <InviteForm />;
}
```

---

## 7. Post-Payment User Experience

**Immediate Effects**:
1. ✅ User plan updated in database
2. ✅ New limits applied (snippets, collections, etc.)
3. ✅ Feature access granted
4. ✅ Redirect to success page
5. ✅ Audit log created

**Next Page Load**:
1. ✅ Dashboard shows new plan badge
2. ✅ Previously locked features now accessible
3. ✅ Sidebar shows new menu items (Analytics, Team, API Keys)
4. ✅ Usage counters updated with new limits

---

## 8. Subscription Management

### Expiry Handling
- Subscription end date stored in `subscription_end` field
- Automatic checks via `isSubscriptionActive()` function
- Expired subscriptions downgrade to Free plan

### Renewal Process
- User can upgrade again before expiry
- New subscription_end = current_end + billing_period
- No interruption in service

---

## 9. Testing the Complete Flow

### Test Mode (Razorpay)
Use test cards:
- Success: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

### Verification Checklist
1. ✅ Payment modal opens
2. ✅ Payment succeeds
3. ✅ User redirected to success page
4. ✅ User plan updated in database
5. ✅ Feature access granted immediately
6. ✅ Usage limits updated
7. ✅ Audit log created

---

## 10. Error Handling

### Payment Failures
- User stays on pricing page
- Error message displayed
- No database changes

### Verification Failures
- Payment captured but verification fails
- Manual intervention required
- Check audit_logs for payment_id

### Feature Access Denied
- Clear error messages
- Upgrade prompt with current plan info
- Direct link to pricing page

---

## Database Schema Requirements

### users table fields:
```sql
- plan: TEXT ('free' | 'basic' | 'pro' | 'enterprise')
- max_snippets: INTEGER
- max_collections: INTEGER
- team_members_limit: INTEGER
- ai_generations_limit: INTEGER
- api_calls_limit: INTEGER
- subscription_status: TEXT ('active' | 'inactive' | 'expired')
- subscription_start: TIMESTAMP
- subscription_end: TIMESTAMP
- updated_at: TIMESTAMP
```

---

## Troubleshooting

### Payment Not Reflecting
1. Check audit_logs table for payment record
2. Verify razorpay_order_id in Razorpay dashboard
3. Check users table for updated plan
4. Look for errors in server logs

### Feature Still Locked
1. Clear browser cache and reload
2. Check user.plan value in session
3. Verify PLAN_FEATURES configuration
4. Check middleware verification logic

---

## Security Considerations

✅ **Implemented**:
- Payment signature verification
- Server-side plan validation
- JWT token authentication
- Audit logging
- No client-side pricing
- Subscription expiry checks

🔒 **Best Practices**:
- Never trust client-side plan data
- Always verify on server
- Log all payment events
- Monitor for unusual activity
- Implement rate limiting on payment endpoints

---

## Maintenance

### Regular Tasks:
1. Monitor subscription expirations
2. Review audit logs for failed payments
3. Update plan pricing in both frontend and backend
4. Test payment flow monthly
5. Sync Razorpay webhooks for auto-renewals

---

**Last Updated**: January 7, 2026
**Razorpay Integration Version**: 2.9.6
**Next.js Version**: 16.0.10
