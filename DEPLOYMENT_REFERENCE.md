# Asset Manager - Deployment & Update Guide

## 🌐 Live Application URLs

### Production URLs
- **Frontend**: https://asset-manager-r2r.netlify.app
- **Backend API**: https://asset-manager-api-r2r.onrender.com
- **Health Check**: https://asset-manager-api-r2r.onrender.com/health

### Dashboards
- **Netlify Dashboard**: https://app.netlify.com/projects/asset-manager-r2r
- **Render Dashboard**: https://dashboard.render.com/web/srv-d6a2ed1r0fns738c3seg
- **GitHub Repository**: https://github.com/vasu15/record-to-report
- **Supabase Dashboard**: https://app.supabase.com/project/zqgohvgjkiarhatprrhh

---

## 🚀 How to Deploy Changes

### Quick Deploy (Most Common)

```bash
# 1. Make your code changes

# 2. Stage all changes
git add .

# 3. Commit with a descriptive message
git commit -m "Description of your changes"

# 4. Push to GitHub
git push origin main

# 5. Wait 2-3 minutes for automatic deployment
# Frontend: Auto-deploys via Netlify
# Backend: Auto-deploys via Render
```

### Deploy Specific Files Only

```bash
# Stage specific files
git add path/to/file1.ts path/to/file2.tsx

# Commit
git commit -m "Update specific functionality"

# Push
git push origin main
```

### Deploy with Detailed Commit Message

```bash
git add .
git commit -m "$(cat <<'EOF'
Feature: Add new approval workflow

- Added approval rules engine
- Updated UI components
- Fixed authentication bug
- Updated documentation

Co-authored-by: Your Name <your.email@example.com>
EOF
)"
git push origin main
```

---

## 📋 Common Deployment Scenarios

### Scenario 1: Frontend Changes Only (UI, Components, Pages)

```bash
# Example: Updated a React component
git add client/src/components/YourComponent.tsx
git commit -m "Update: Improved YourComponent UI"
git push origin main

# Netlify will rebuild (1-2 minutes)
# Backend stays unchanged
```

### Scenario 2: Backend Changes Only (API, Routes, Logic)

```bash
# Example: Added new API endpoint
git add server/routes.ts
git commit -m "Add: New API endpoint for reports"
git push origin main

# Render will rebuild (2-3 minutes)
# Frontend stays unchanged
```

### Scenario 3: Database Schema Changes

```bash
# 1. Update schema
git add shared/schema.ts

# 2. Push database changes to Supabase
npm run db:push

# 3. Commit and deploy
git commit -m "Update: Database schema for new features"
git push origin main
```

### Scenario 4: Environment Variable Changes

**Frontend (Netlify):**
1. Go to: https://app.netlify.com/projects/asset-manager-r2r
2. Site settings → Environment variables
3. Add/Update variable
4. Trigger manual deploy or push new commit

**Backend (Render):**
1. Go to: https://dashboard.render.com/web/srv-d6a2ed1r0fns738c3seg
2. Environment → Add/Edit variable
3. Save (auto-triggers deployment)

### Scenario 5: Dependency Updates

```bash
# Update packages
npm update

# Or add new package
npm install package-name

# Commit changes
git add package.json package-lock.json
git commit -m "Update: Dependencies"
git push origin main
```

---

## 🔄 Deployment Status & Monitoring

### Check Deployment Status

**Netlify:**
```bash
# Visit: https://app.netlify.com/projects/asset-manager-r2r/deploys
# Or check via CLI:
netlify status
```

**Render:**
```bash
# Visit: https://dashboard.render.com/web/srv-d6a2ed1r0fns738c3seg
# Check "Logs" tab for deployment progress
```

### Test After Deployment

```bash
# Test backend health
curl https://asset-manager-api-r2r.onrender.com/health

# Test frontend
curl -I https://asset-manager-r2r.netlify.app

# Or visit in browser
open https://asset-manager-r2r.netlify.app
```

---

## 🐛 Troubleshooting Deployments

### Frontend Build Fails

1. Check Netlify build logs
2. Test build locally:
   ```bash
   npm run build:client
   ```
3. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Import path issues

### Backend Deployment Fails

1. Check Render logs at dashboard
2. Test locally:
   ```bash
   npm install
   npx tsx server/index.ts
   ```
3. Common issues:
   - Database connection errors
   - Missing environment variables
   - Port configuration issues
   - Module import errors

### Backend is Slow After Deploy

- Render free tier sleeps after 15 min inactivity
- First request takes 30-60 seconds to wake up
- Solution: Upgrade to paid tier ($7/month) for always-on

---

## 🔐 Environment Variables Reference

### Backend (Render)
```bash
DATABASE_URL=postgresql://postgres:PASSWORD@db.zqgohvgjkiarhatprrhh.supabase.co:5432/postgres
SESSION_SECRET=accruals-secret-key-2026
NODE_ENV=production
PORT=10000
GEMINI_API_KEY=AIzaSyDKQaq_5oxUD4Qo2dmPSixwW7_GXT0-nU0
```

### Frontend (Netlify)
```bash
VITE_API_BASE_URL=https://asset-manager-api-r2r.onrender.com
```

---

## 📦 Project Structure

```
.
├── client/              # React frontend (Netlify)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── ...
│   └── index.html
├── server/              # Express backend (Render)
│   ├── routes.ts
│   ├── index.ts
│   ├── auth.ts
│   └── ...
├── shared/              # Shared types/schemas
│   └── schema.ts
├── netlify.toml         # Netlify configuration
├── render.yaml          # Render configuration
└── package.json
```

---

## 🎯 Deployment Checklist

Before pushing major changes:

- [ ] Test locally: `npm run dev`
- [ ] Build succeeds: `npm run build:client` (for frontend changes)
- [ ] TypeScript compiles: `npm run check`
- [ ] Database migrations applied: `npm run db:push`
- [ ] Environment variables updated (if needed)
- [ ] Commit message is descriptive
- [ ] Code reviewed (if working with team)

After pushing:

- [ ] Monitor Netlify build logs
- [ ] Monitor Render deployment logs
- [ ] Test live application
- [ ] Check health endpoint
- [ ] Verify database connections
- [ ] Test key user flows

---

## 💡 Pro Tips

### Faster Deployments
```bash
# Skip Netlify build if only backend changes
# (Manually trigger deploy later if needed)

# For backend-only changes:
git commit -m "Backend: Your change [skip ci]"  # Won't trigger Netlify
```

### View Real-time Logs
```bash
# Backend logs (Render dashboard)
# https://dashboard.render.com/web/srv-d6a2ed1r0fns738c3seg
# Click "Logs" tab

# Frontend logs (Browser console)
# Visit app → Open DevTools → Console
```

### Rollback Deployment

**Netlify:**
1. Go to Deploys tab
2. Find previous working deploy
3. Click "Publish deploy"

**Render:**
1. Go to service page
2. Click "Manual Deploy"
3. Select previous commit
4. Deploy

### Emergency Fixes

```bash
# Quick fix and force push
git add .
git commit -m "Hotfix: Critical bug fix"
git push origin main --force  # Use carefully!

# Or revert last commit
git revert HEAD
git push origin main
```

---

## 📞 Support & Resources

- **Netlify Docs**: https://docs.netlify.com
- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Issues**: https://github.com/vasu15/record-to-report/issues

---

## 🔄 Auto-Deployment Flow

```
Local Changes
    ↓
git commit & push
    ↓
GitHub Repository
    ├→ Netlify (Frontend)
    │   ↓
    │   Build (1-2 min)
    │   ↓
    │   Deploy to CDN
    │   ↓
    │   Live: asset-manager-r2r.netlify.app
    │
    └→ Render (Backend)
        ↓
        Build (2-3 min)
        ↓
        Deploy to Server
        ↓
        Live: asset-manager-api-r2r.onrender.com
```

---

## 📊 Monitoring & Analytics

### Frontend (Netlify)
- **Analytics**: https://app.netlify.com/projects/asset-manager-r2r/analytics
- **Bandwidth usage**: Site settings → Usage
- **Deploy frequency**: Deploys tab

### Backend (Render)
- **Metrics**: Dashboard → Metrics tab
- **CPU/Memory**: Real-time graphs
- **Request logs**: Logs tab

### Database (Supabase)
- **Usage**: Dashboard → Settings → Usage
- **Database size**: Monitor for free tier limits (500MB)
- **Connections**: Check active connections

---

## 🎓 Learning Resources

### For Frontend Changes
- React docs: https://react.dev
- Vite docs: https://vitejs.dev
- Tailwind CSS: https://tailwindcss.com

### For Backend Changes
- Express.js: https://expressjs.com
- Drizzle ORM: https://orm.drizzle.team
- Node.js: https://nodejs.org/docs

---

## ✅ Quick Reference Commands

```bash
# Development
npm run dev                 # Start local dev server
npm run build              # Build everything
npm run build:client       # Build frontend only
npm run build:server       # Build backend only
npm run check              # TypeScript check
npm run db:push            # Push DB schema changes

# Git
git status                 # Check changes
git add .                  # Stage all changes
git commit -m "message"    # Commit changes
git push origin main       # Deploy changes
git pull origin main       # Get latest changes
git log --oneline          # View commit history

# Testing
curl https://asset-manager-api-r2r.onrender.com/health
open https://asset-manager-r2r.netlify.app

# Netlify CLI (optional)
npm install -g netlify-cli
netlify login
netlify status
netlify open
```

---

**Last Updated**: February 17, 2026  
**Project**: Asset Manager (Record-to-Report)  
**Stack**: React + Express + PostgreSQL  
**Hosting**: Netlify + Render + Supabase

---

**Quick Deploy Command:**
```bash
git add . && git commit -m "Your changes" && git push origin main
```

**That's it! Your changes will be live in 2-3 minutes!** 🚀
