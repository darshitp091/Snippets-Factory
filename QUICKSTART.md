# ⚡ Quick Start Guide

Get Snippet Factory running in **under 10 minutes**!

## 🏃 Fast Track Setup

### 1. Install Dependencies (2 min)
```bash
npm install
```

### 2. Set Up Supabase (3 min)

**A. Create Project**
- Go to [supabase.com](https://supabase.com)
- Create new project: "snippet-factory"
- Copy your credentials

**B. Run Database Schema**
- Open Supabase SQL Editor
- Copy schema from `src/lib/supabase.ts` (the `DATABASE_SCHEMA` constant)
- Paste and run in SQL Editor

### 3. Configure Environment (2 min)

```bash
# Copy template
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
# Minimum required:
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### 4. Run Development Server (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## ✅ Verify It's Working

You should see:
- ✨ Animated homepage with gradient text
- 🖱️ Custom cursor following your mouse
- 🌀 Rotating 3D mockup in the center
- 🎨 Smooth scroll animations

## 🎯 Test Core Features

### Homepage
```
http://localhost:3000
```
- Scroll to see animations
- Hover over buttons for effects
- Check custom cursor

### Dashboard
```
http://localhost:3000/dashboard
```
- View stats cards
- See snippet cards
- Click "New Snippet" button

### Pricing
```
http://localhost:3000/pricing
```
- Toggle Monthly/Annual
- Hover over pricing cards

## 🚨 Common Issues

### "Module not found"
```bash
rm -rf node_modules
npm install
```

### "Supabase error"
- Check `.env.local` credentials
- Verify Supabase project is active
- Ensure database schema is created

### "Port 3000 in use"
```bash
# Use different port
npm run dev -- -p 3001
```

## 📚 Next Steps

1. **Read Full Documentation**: Check [README.md](README.md)
2. **Setup Guide**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
3. **Project Overview**: Read [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)

## 🎨 Customize

### Change Colors
Edit `tailwind.config.js`:
```js
colors: {
  'tech-blue': '#00d4ff',    // Change to your brand color
  'tech-purple': '#8b5cf6',  // Secondary color
}
```

### Modify Animations
Edit `src/components/animations/CustomCursor.tsx` for cursor effects

### Update Content
Edit `src/app/page.tsx` for homepage content

## 🚀 Deploy to Production

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

Follow prompts and add environment variables in Vercel dashboard.

### Build Locally
```bash
npm run build
npm start
```

## 📊 Project Structure

```
src/
├── app/                 # Pages (Next.js App Router)
│   ├── page.tsx        # Homepage
│   ├── dashboard/      # Dashboard page
│   └── pricing/        # Pricing page
├── components/         # React components
│   ├── animations/     # Animation components
│   └── dashboard/      # Dashboard components
├── lib/               # Services and utilities
│   ├── supabase.ts    # Database client
│   └── snippetService.ts  # Snippet operations
├── types/             # TypeScript types
└── utils/             # Helper functions
```

## 🎓 Learn More

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Tailwind**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

## 💬 Get Help

- Check [README.md](README.md) for detailed docs
- Open an issue on GitHub
- Join our Discord community

---

**That's it!** You're now running Snippet Factory locally. 🚀

Happy coding!
