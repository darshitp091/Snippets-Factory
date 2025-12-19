# Razorpay Payment Integration Setup

## Overview

PayPal integration has been successfully replaced with Razorpay payment gateway. This document provides setup instructions and important information about the integration.

## Environment Variables Setup

Update your `.env.local` file with your Razorpay credentials:

```env
# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
```

### How to Get Razorpay Credentials

1. **Sign up for Razorpay**: Go to [https://razorpay.com/](https://razorpay.com/) and create an account
2. **Get API Keys**:
   - Log in to your Razorpay Dashboard
   - Go to Settings → API Keys
   - Generate Test/Live mode keys
   - Copy the `Key ID` and `Key Secret`
3. **Set up Webhooks**:
   - Go to Settings → Webhooks
   - Create a new webhook with URL: `https://yourdomain.com/api/payment/webhook`
   - Select events: `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`
   - Copy the `Webhook Secret`

## Files Created/Modified

### New Files Created

1. **src/lib/razorpay.ts** - Razorpay integration service
2. **src/components/payment/RazorpayCheckout.tsx** - Razorpay checkout button component
3. **src/components/payment/RazorpayCheckout.module.css** - Checkout button styles
4. **src/app/api/payment/webhook/route.ts** - Webhook handler for Razorpay events
5. **src/app/payment/success/page.tsx** - Payment success page
6. **src/app/payment/cancel/page.tsx** - Payment cancellation page

### Files Modified

1. **src/app/pricing/page.tsx** - Updated to use RazorpayCheckout
2. **src/components/payment/UpgradeToPro.tsx** - Updated to use RazorpayCheckout
3. **src/app/api/payment/create-order/route.ts** - Updated for Razorpay order creation
4. **src/app/api/payment/capture-order/route.ts** - Updated for Razorpay payment verification
5. **.env.local** - Updated with Razorpay environment variables

### Files Removed

1. **src/lib/paypal.ts** - Removed PayPal integration service
2. **src/components/payment/PayPalCheckout.tsx** - Removed PayPal checkout component
3. **src/components/payment/PayPalCheckout.module.css** - Removed PayPal checkout styles

## Pricing Configuration

All prices are now configured in **paise** (Indian currency subunit):

- **Pro Plan**:
  - Monthly: ₹29.99 (2999 paise)
  - Yearly: ₹299.99 (29999 paise)

- **Enterprise Plan**:
  - Monthly: ₹99.99 (9999 paise)
  - Yearly: ₹999.99 (99999 paise)

You can update these prices in [src/lib/razorpay.ts](src/lib/razorpay.ts:32-46).

## Payment Flow

### User Flow

1. User logs in and navigates to pricing page
2. User selects plan and billing cycle (monthly/yearly)
3. User clicks "Checkout with Razorpay" button
4. Razorpay modal opens with payment options
5. User completes payment
6. Payment is verified on backend
7. User's plan is upgraded in database
8. User is redirected to success page

### Technical Flow

1. **Order Creation** (`/api/payment/create-order`):
   - Validates user and plan
   - Creates Razorpay order
   - Returns order ID and amount

2. **Payment Processing** (Frontend):
   - Initializes Razorpay checkout
   - User completes payment in Razorpay modal
   - Razorpay returns payment details

3. **Payment Verification** (`/api/payment/capture-order`):
   - Verifies payment signature
   - Updates user plan in database
   - Logs payment in audit logs

4. **Webhook Handler** (`/api/payment/webhook`):
   - Receives Razorpay webhook events
   - Verifies webhook signature
   - Handles payment events (success, failure, etc.)

## Testing

### Test Mode

Razorpay provides test mode for development:

1. Use **Test API Keys** in development
2. Use Razorpay test cards for payments:
   - **Success**: Card number `4111 1111 1111 1111`
   - **Failure**: Card number `4000 0000 0000 0002`
   - CVV: Any 3 digits
   - Expiry: Any future date

### Production Mode

1. Switch to **Live API Keys** in production
2. Update `.env.local` with live keys
3. Configure webhook URL with your production domain
4. Enable live mode in Razorpay dashboard

## Webhook Configuration

### Webhook URL

```
https://yourdomain.com/api/payment/webhook
```

### Events to Subscribe

- `payment.authorized` - When payment is authorized
- `payment.captured` - When payment is captured
- `payment.failed` - When payment fails
- `order.paid` - When order is paid

### Webhook Signature Verification

The webhook handler automatically verifies Razorpay signatures using the `RAZORPAY_WEBHOOK_SECRET`. This ensures webhook requests are authentic.

## Security Features

1. **Payment Signature Verification**: All payments are verified using Razorpay's signature verification
2. **Webhook Signature Verification**: All webhook requests are verified before processing
3. **User Authentication**: Only logged-in users can initiate payments
4. **Plan Validation**: Backend validates plan upgrades to prevent unauthorized changes

## Error Handling

The integration includes comprehensive error handling:

- User not found errors
- Payment signature verification failures
- Webhook signature verification failures
- Order creation failures
- Payment capture failures

All errors are logged to the console and displayed to users appropriately.

## Customization

### Changing Prices

Update prices in [src/lib/razorpay.ts](src/lib/razorpay.ts:32-46):

```typescript
export const PLAN_PRICES = {
  pro: {
    monthly: 2999, // Amount in paise
    yearly: 29999,
  },
  enterprise: {
    monthly: 9999,
    yearly: 99999,
  },
};
```

### Customizing Checkout

Update the Razorpay checkout options in [src/components/payment/RazorpayCheckout.tsx](src/components/payment/RazorpayCheckout.tsx:106-144):

```typescript
const options = {
  key: data.keyId,
  amount: data.amount,
  currency: data.currency,
  name: 'Snippet Factory',
  description: `${plan} Plan`,
  theme: {
    color: '#6366f1', // Change brand color
  },
};
```

## Important Notes

1. **Currency**: All prices are in INR (Indian Rupees) and amounts in paise
2. **Amount Format**: Always use paise (multiply rupees by 100)
3. **Webhook Security**: Never skip webhook signature verification
4. **Test Mode**: Always test in test mode before going live
5. **Error Logging**: Check audit_logs table for payment history

## Troubleshooting

### Payment Not Working

1. Check if Razorpay script is loaded (check browser console)
2. Verify API keys are correct in `.env.local`
3. Ensure user is logged in
4. Check browser console for errors

### Webhook Not Receiving Events

1. Verify webhook URL is correct
2. Check if webhook is active in Razorpay dashboard
3. Verify webhook secret matches `.env.local`
4. Check server logs for webhook errors

### Plan Not Updating After Payment

1. Check if payment verification succeeded
2. Verify database connection
3. Check audit_logs table for payment records
4. Ensure webhook handler is processing events

## Support

For Razorpay-specific issues, refer to:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Razorpay Support](https://razorpay.com/support/)

## Migration Complete

All PayPal integration code has been removed and replaced with Razorpay. The application is now ready to process payments through Razorpay.
