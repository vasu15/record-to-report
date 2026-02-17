# Netlify Deployment Checklist

Copy this checklist and mark items as you complete them.

## Pre-Deployment
- [ ] Verified build works: `./scripts/deploy-check.sh`
- [ ] Committed all changes to git
- [ ] Pushed code to GitHub

## Backend Deployment (Render)
- [ ] Created Render account
- [ ] Created new Web Service
- [ ] Connected GitHub repository
- [ ] Set build command: `npm install && npm run build`
- [ ] Set start command: `npm start`
- [ ] Added environment variables:
  - [ ] DATABASE_URL
  - [ ] SESSION_SECRET
  - [ ] NODE_ENV=production
  - [ ] PORT=3000
  - [ ] GEMINI_API_KEY
- [ ] Deployed backend
- [ ] Copied backend URL: ______________________________
- [ ] Tested backend: `curl https://your-backend-url/api/health`

## Frontend Deployment (Netlify)
- [ ] Went to https://app.netlify.com
- [ ] Clicked "Add new site" → "Import an existing project"
- [ ] Connected to GitHub
- [ ] Selected repository
- [ ] Verified build settings:
  - [ ] Build command: `npm run build:client`
  - [ ] Publish directory: `dist/public`
- [ ] Added environment variable:
  - [ ] VITE_API_BASE_URL = (backend URL from above)
- [ ] Deployed site
- [ ] Copied Netlify URL: ______________________________

## Testing
- [ ] Opened Netlify site in browser
- [ ] Login page loads correctly
- [ ] Can log in successfully
- [ ] Data loads from backend
- [ ] No console errors
- [ ] Tested on mobile (optional)

## Post-Deployment (Optional)
- [ ] Configured custom domain
- [ ] Enabled HTTPS (automatic)
- [ ] Set up monitoring
- [ ] Configured CORS if needed
- [ ] Added backend URL to bookmarks
- [ ] Added frontend URL to bookmarks
- [ ] Shared with team/users

## Troubleshooting (If Issues)
- [ ] Checked Netlify build logs
- [ ] Checked Render/Railway logs
- [ ] Verified environment variables
- [ ] Tested API endpoint directly
- [ ] Checked browser console
- [ ] Reviewed DEPLOYMENT.md troubleshooting

---

## Quick Reference

**Backend URL**: ______________________________  
**Frontend URL**: ______________________________  
**Deployment Date**: ______________________________  

**Important Links**:
- Netlify Dashboard: https://app.netlify.com
- Render Dashboard: https://dashboard.render.com
- Supabase: https://app.supabase.com
- GitHub Repo: ______________________________

---

## Need Help?
See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.
