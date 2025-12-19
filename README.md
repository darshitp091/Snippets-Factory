# Snippet Factory ⚡

A modern, AI-powered code snippet manager with team collaboration, analytics, and enterprise security features.

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

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: CSS Modules, Framer Motion
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel (recommended)

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
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
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

The application supports three subscription tiers:

### Free Plan
- 50 snippets maximum
- 1 team member (personal use)
- Cloud sync
- Basic search

### Pro Plan ($12/month)
- Unlimited snippets
- Up to 10 team members
- Advanced analytics
- API access
- AI categorization
- Advanced search
- Custom categories
- Priority support

### Enterprise Plan ($49/month)
- Everything in Pro
- Unlimited team members
- Audit logs
- SSO authentication
- Custom branding
- Dedicated support

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

## Features Implementation Status

✅ **Completed**
- User authentication (signup, login, logout)
- Email confirmation flow
- Authenticated navigation with user menu
- Settings page (profile, password, notifications)
- Plan-based access control system
- Database schema and setup
- Responsive design
- Glassmorphism UI with animations

🚧 **In Progress**
- Dashboard sidebar navigation
- Snippet CRUD operations
- Team management
- Analytics dashboard

📋 **Planned**
- Payment integration (Stripe)
- API endpoints
- CLI tool
- Mobile app
- Browser extensions

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
