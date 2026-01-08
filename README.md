# Snippet Factory ⚡

**A Modern SaaS Platform for Code Snippet Management**

Snippet Factory is a production-ready, AI-powered code snippet manager built with Next.js 16, Supabase, and Razorpay. It provides developers and teams with a powerful platform to organize, search, and share code snippets with enterprise-grade security, multi-currency payment support, and automated subscription management.

## Features

### 🎯 Core Features
- **Smart Organization**: AI-powered categorization and tagging
- **Lightning Fast Search**: Find any snippet in milliseconds
- **Team Collaboration**: Share snippets with your team seamlessly
- **Cloud Sync**: Access your snippets from anywhere
- **Advanced Analytics**: Track usage and discover insights
- **Security First**: Enterprise-grade encryption and access control

### 💎 Premium Features
- **API Access**: RESTful API for custom integrations
- **AI Categorization**: Automatic snippet organization
- **Audit Logs**: Complete activity tracking (Enterprise)
- **SSO Authentication**: Single sign-on support (Enterprise)
- **Custom Branding**: White-label solution (Enterprise)

## Tech Stack

- **Frontend**: Next.js 16 (App Router with Turbopack), React 19, TypeScript
- **Styling**: CSS Modules, Framer Motion
- **Authentication**: Supabase Auth with email confirmation
- **Database**: PostgreSQL (Supabase) with Row Level Security
- **Payment Gateway**: Razorpay (Live Mode) with multi-currency support
- **Subscription Management**: Automated cron jobs via Vercel Cron
- **Deployment**: Vercel (production-ready)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/snippet-factory.git
   cd snippet-factory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Razorpay Configuration (Live API Keys)
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Security
   ENCRYPTION_KEY=generate-random-32-byte-base64-key
   CRON_SECRET=generate-random-secret-for-cron

   # Google AdSense (Optional)
   NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
   ```

4. **Set up the database**

   Follow the instructions in [DATABASE_SETUP.md](./DATABASE_SETUP.md) to configure your Supabase database.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
snippet-factory/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Homepage
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   ├── dashboard/         # User dashboard
│   │   ├── settings/          # User settings
│   │   ├── features/          # Features page
│   │   ├── pricing/           # Pricing page
│   │   ├── about/             # About page
│   │   └── contact/           # Contact page
│   ├── components/            # React components
│   │   ├── layout/           # Header, Footer
│   │   ├── dashboard/        # Dashboard components
│   │   ├── animations/       # Animation components
│   │   └── effects/          # Visual effects
│   └── lib/                  # Utility libraries
│       ├── supabase.ts       # Supabase client & schema
│       └── plans.ts          # Plan-based access control
├── public/                   # Static assets
├── DATABASE_SETUP.md        # Database setup guide
└── README.md               # This file
```

## Authentication Flow

### User Signup
1. User fills out signup form with name, email, and password
2. Form validates password strength (min 8 characters)
3. Supabase creates auth user
4. Confirmation email sent to user
5. User must confirm email before logging in
6. Database trigger auto-creates user profile and personal team

### User Login
1. User enters email and password
2. Supabase validates credentials
3. Checks if email is confirmed
4. Redirects to dashboard on success
5. Session maintained via Supabase auth

### Authenticated Navigation
- Header shows user avatar and dropdown menu when logged in
- Dropdown includes: Dashboard, Settings, Logout
- Protected routes redirect to login if not authenticated

## Plan-Based Access Control

The application supports four subscription tiers with anniversary-based billing:

### Free Plan
- 10 snippets maximum
- 1 collection
- 1 team member (personal use)
- Cloud sync
- Basic search

### Basic Plan (₹399/month or ₹3,999/year)
- 100 snippets maximum
- 10 collections
- 1 team member
- 50 AI generations/month
- 500 API calls/month
- Cloud sync
- Basic analytics

### Pro Plan (₹799/month or ₹7,999/year)
- Unlimited snippets
- Unlimited collections
- Up to 5 team members
- 100 AI generations/month
- 1,000 API calls/month
- Advanced analytics
- API access
- AI categorization
- Advanced search
- Custom categories
- Priority support

### Enterprise Plan (₹1,999/month or ₹19,999/year)
- Everything in Pro
- Unlimited team members
- Unlimited AI generations
- Unlimited API calls
- Audit logs
- SSO authentication
- Custom branding
- Dedicated support

**Multi-Currency Support**: Pricing available in INR, USD, EUR, GBP, AUD, SGD, and AED.

**Billing Cycle**: Subscriptions are anniversary-based (e.g., purchase on Jan 28 → renews Feb 28), ensuring users always get a full billing period.

See [src/lib/plans.ts](./src/lib/plans.ts) for implementation details.

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User profiles and plan information
- **teams**: Team/workspace management
- **team_members**: Team membership relationships
- **snippets**: Code snippets with metadata
- **categories**: Custom categorization
- **snippet_usage**: Usage tracking for analytics
- **audit_logs**: Security and compliance logging

Full schema and setup instructions in [DATABASE_SETUP.md](./DATABASE_SETUP.md).

## Payment & Subscription System

The application features a complete payment and subscription management system:

### Payment Integration (Razorpay)
- **Live Payment Gateway**: Fully integrated Razorpay payment processing
- **Secure Verification**: HMAC SHA256 signature verification for all payments
- **Multi-Currency**: Support for 7 currencies with real-time conversion
- **Order Management**: Automated order creation and tracking

### Subscription Management
- **Anniversary-Based Billing**: Users get full billing periods from purchase date
- **Automated Expiry Checks**: Vercel Cron job runs daily at 2 AM UTC
- **Automatic Downgrade**: Expired subscriptions automatically revert to Free plan
- **Feature Access Control**: Plan limits enforced at database and application level
- **Audit Logging**: Complete payment and subscription history tracking

See [PAYMENT_WORKFLOW.md](./PAYMENT_WORKFLOW.md) for detailed workflow documentation.

## Features Implementation Status

✅ **Completed (Production-Ready)**
- User authentication (signup, login, logout)
- Email confirmation flow
- Authenticated navigation with user menu
- Settings page (profile, password, notifications)
- Complete Razorpay payment integration (Live Mode)
- Multi-currency pricing and payment support
- Plan-based access control system
- Automated subscription management with cron jobs
- Anniversary-based billing cycle
- Payment verification and signature validation
- Subscription expiry handling
- Database schema and setup with RLS policies
- Responsive design
- Glassmorphism UI with animations
- Audit logging for compliance

🚧 **In Progress**
- Dashboard sidebar navigation
- Snippet CRUD operations
- Team management
- Analytics dashboard

📋 **Planned**
- AI-powered snippet categorization
- API endpoints for external integrations
- CLI tool
- Mobile app
- Browser extensions

## Recent Updates

### January 2026
- **Payment System Rewrite**: Complete reimplementation of Razorpay integration with Next.js 16 App Router patterns
- **Subscription Management**: Automated subscription expiry checks with Vercel Cron jobs
- **Multi-Currency Support**: Added currency selector with 7 supported currencies
- **Bug Fixes**: Fixed TypeScript build errors, currency selector visibility issues
- **Security Enhancements**: Added encryption key for sensitive data, cron secret authentication
- **UI Improvements**: Removed trial messaging, updated pricing page with current plans

## Support

For support and questions:
- 📧 Email: support@snippetfactory.com
- 💬 Discord: Join our community
- 🐛 Issues: GitHub Issues

## Acknowledgments

- Icons by [Lucide React](https://lucide.dev/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Database by [Supabase](https://supabase.com/)
- Hosting by [Vercel](https://vercel.com/)

---

Made with ❤️ by the Snippet Factory Team
