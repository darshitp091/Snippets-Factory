# 📝 Snippet Factory - Command Reference

Quick reference for all commonly used commands.

## 🚀 Development Commands

### Start Development Server
```bash
npm run dev
```
Opens: http://localhost:3000

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Type Check
```bash
npm run type-check
```

### Lint Code
```bash
npm run lint
```

## 📦 Package Management

### Install Dependencies
```bash
npm install
```

### Add New Package
```bash
npm install package-name
```

### Remove Package
```bash
npm uninstall package-name
```

### Update All Packages
```bash
npm update
```

### Check for Outdated Packages
```bash
npm outdated
```

## 🗄️ Supabase Commands

### Run Database Migration
Copy `DATABASE_SCHEMA` from `src/lib/supabase.ts` and run in Supabase SQL Editor

### Reset Database
⚠️ Warning: Deletes all data!
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then run DATABASE_SCHEMA again
```

### Backup Database
In Supabase Dashboard:
Settings → Database → Download backup

## 🚢 Deployment Commands

### Deploy to Vercel
```bash
# First time
npm install -g vercel
vercel

# Subsequent deployments
vercel --prod
```

### Deploy to Other Platforms

**Netlify:**
```bash
npm run build
# Upload .next folder
```

**Docker:**
```bash
docker build -t snippet-factory .
docker run -p 3000:3000 snippet-factory
```

## 🧪 Testing Commands

### Run All Tests (when added)
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

## 🔧 Utility Commands

### Clear Cache
```bash
rm -rf .next
rm -rf node_modules
npm install
```

### Check Bundle Size
```bash
npm run build
# Check .next/static folder size
```

### Generate TypeScript Types
```bash
npm run type-check
```

### Format Code (if Prettier is added)
```bash
npx prettier --write .
```

## 🌐 Environment Commands

### Copy Environment Template
```bash
cp .env.local.example .env.local
```

### Check Environment Variables
```bash
# In development
echo $NEXT_PUBLIC_SUPABASE_URL

# Or open .env.local in editor
```

## 📊 Database Queries

### Count All Snippets
```sql
SELECT COUNT(*) FROM snippets;
```

### Find Popular Snippets
```sql
SELECT title, usage_count
FROM snippets
ORDER BY usage_count DESC
LIMIT 10;
```

### User Activity
```sql
SELECT u.email, COUNT(s.id) as snippet_count
FROM users u
LEFT JOIN snippets s ON u.id = s.created_by
GROUP BY u.email;
```

### Team Statistics
```sql
SELECT t.name, COUNT(tm.id) as members
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
GROUP BY t.name;
```

## 🔐 Security Commands

### Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Check for Vulnerabilities
```bash
npm audit
```

### Fix Vulnerabilities
```bash
npm audit fix
```

## 📝 Git Commands

### Initialize Git (if needed)
```bash
git init
git add .
git commit -m "Initial commit"
```

### Create .gitignore
Already created! Check [.gitignore](./.gitignore)

### Push to GitHub
```bash
git remote add origin https://github.com/yourusername/snippet-factory.git
git branch -M main
git push -u origin main
```

## 🎨 Styling Commands

### Rebuild Tailwind
```bash
# Automatic in dev mode
npm run dev
```

### Purge Unused CSS
```bash
npm run build
# Automatically purges unused styles
```

## 📱 Mobile Development

### Test on Mobile
```bash
# Find your local IP
# Windows:
ipconfig

# Mac/Linux:
ifconfig

# Then access: http://YOUR_IP:3000
```

## 🔍 Debugging Commands

### Enable Debug Mode
```bash
# In .env.local
DEBUG=*
```

### Check Logs
```bash
# Development logs
npm run dev

# Production logs (Vercel)
vercel logs
```

### Inspect Bundle
```bash
# Install analyzer
npm install @next/bundle-analyzer

# Add to next.config.js and run
npm run build
```

## 📊 Performance Commands

### Lighthouse Audit
```bash
# Install globally
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view
```

### Check Load Time
```bash
# Using curl
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000
```

## 🛠️ Maintenance Commands

### Update Next.js
```bash
npm install next@latest react@latest react-dom@latest
```

### Clean Install
```bash
rm -rf node_modules package-lock.json
npm install
```

### Check Disk Usage
```bash
du -sh node_modules
du -sh .next
```

## 🎯 Quick Start Sequence

**First time setup:**
```bash
# 1. Install
npm install

# 2. Setup environment
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 3. Run
npm run dev
```

**Daily development:**
```bash
npm run dev
```

**Before commit:**
```bash
npm run type-check
npm run build
```

**Deploy:**
```bash
vercel --prod
```

## 🆘 Troubleshooting Commands

### Port Already in Use
```bash
# Find process using port 3000
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -ti:3000

# Kill the process or use different port
npm run dev -- -p 3001
```

### Module Not Found
```bash
npm install
# or
rm -rf node_modules
npm install
```

### TypeScript Errors
```bash
npm run type-check
# Fix errors shown
```

### Build Fails
```bash
rm -rf .next
npm run build
```

## 📚 Helpful Aliases (Optional)

Add to your `.bashrc` or `.zshrc`:

```bash
alias sf-dev='cd ~/snippet-factory && npm run dev'
alias sf-build='cd ~/snippet-factory && npm run build'
alias sf-type='cd ~/snippet-factory && npm run type-check'
alias sf-deploy='cd ~/snippet-factory && vercel --prod'
```

## 🎓 Learning Commands

### Generate Component
```bash
# Create new component
mkdir -p src/components/new-component
touch src/components/new-component/index.tsx
```

### View Dependencies Tree
```bash
npm list --depth=0
```

### Check Package Info
```bash
npm info package-name
```

## 💡 Pro Tips

### Speed up npm install
```bash
# Use npm ci for faster clean installs
npm ci
```

### Run Multiple Commands
```bash
# Install and run in one command
npm install && npm run dev
```

### Background Process
```bash
# Run dev server in background (Mac/Linux)
npm run dev &

# Stop background process
killall node
```

---

## 🔖 Bookmark This Page!

Keep this reference handy for quick access to all commands.

**Most Used Commands:**
1. `npm run dev` - Start development
2. `npm run build` - Build for production
3. `npm run type-check` - Check TypeScript
4. `vercel --prod` - Deploy to production

**Emergency Commands:**
1. `rm -rf node_modules && npm install` - Fix dependencies
2. `rm -rf .next` - Clear Next.js cache
3. `npm audit fix` - Fix security issues

---

*Last updated: December 2025*
