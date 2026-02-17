# 🚀 Quick Start - Deploy to Netlify

Follow these steps to get your Asset Manager live on Netlify.

## Prerequisites
- [ ] GitHub account
- [ ] Netlify account (free at netlify.com)
- [ ] Backend deployed (Render/Railway recommended)

---

## Step 1: Deploy Backend (5 minutes)

### Option A: Render (Free tier available)

1. Go to https://render.com and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `asset-manager-api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://postgres:6jFJDHDakAXTTqu!@db.zqgohvgjkiarhatprrhh.supabase.co:5432/postgres
   SESSION_SECRET=accruals-secret-key-2026
   NODE_ENV=production
   PORT=3000
   GEMINI_API_KEY=AIzaSyDKQaq_5oxUD4Qo2dmPSixwW7_GXT0-nU0
   ```
6. Click **"Create Web Service"**
7. Wait for deployment (2-3 minutes)
8. **Copy your backend URL** (e.g., `https://asset-manager-api.onrender.com`)

---

## Step 2: Deploy Frontend to Netlify (3 minutes)

### A. Via Netlify Dashboard (Easiest)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Configure for Netlify deployment"
   git push origin main
   ```

2. Go to https://app.netlify.com

3. Click **"Add new site"** → **"Import an existing project"**

4. Select **GitHub** and choose your repository

5. Build settings (should auto-detect):
   - **Build command**: `npm run build:client`
   - **Publish directory**: `dist/public`

6. Click **"Show advanced"** → **"New variable"**:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your backend URL from Step 1 (e.g., `https://asset-manager-api.onrender.com`)

7. Click **"Deploy site"** 🚀

8. Wait 2-3 minutes for build to complete

9. Your site is live! Click on the site URL to visit

---

## Step 3: Test Your Deployment (1 minute)

1. Open your Netlify site URL
2. You should see the Asset Manager login page
3. Try logging in with your credentials
4. Check that data loads correctly

If you see errors, check the [Troubleshooting](#troubleshooting) section below.

---

## Step 4: Custom Domain (Optional)

1. In Netlify dashboard, go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic with Netlify)

---

## Troubleshooting

### Build Fails

**Error**: `npm run build:client` fails
- Check that you pushed the latest code
- Verify `package.json` has the `build:client` script
- Check Netlify build logs for specific error

### Can't Connect to Backend

**Error**: Network errors or "Failed to fetch"
- Verify `VITE_API_BASE_URL` is set in Netlify environment variables
- Make sure backend URL is correct (no trailing slash)
- Check backend is running: visit `https://your-backend-url/api/health`

### CORS Errors

**Error**: "blocked by CORS policy"

Add to your backend `server/index.ts` (before routes):
```typescript
import cors from 'cors';

app.use(cors({
  origin: 'https://your-netlify-site.netlify.app',
  credentials: true
}));
```

Then redeploy backend.

### Login Not Working

- Check browser console for errors
- Verify database connection in backend logs
- Make sure `SESSION_SECRET` is set in backend environment variables

---

## Update Your App

To deploy updates:

1. Make your changes locally
2. Test locally: `npm run dev`
3. Commit and push:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
4. Netlify automatically rebuilds (2-3 minutes)
5. Backend redeploys automatically on Render/Railway

---

## Important URLs

Save these for reference:

- **Frontend (Netlify)**: `https://your-site.netlify.app`
- **Backend (Render)**: `https://asset-manager-api.onrender.com`
- **Database (Supabase)**: `https://app.supabase.com/project/zqgohvgjkiarhatprrhh`
- **Netlify Dashboard**: `https://app.netlify.com`
- **Render Dashboard**: `https://dashboard.render.com`

---

## Cost Estimate

| Service | Tier | Cost |
|---------|------|------|
| Netlify | Free | $0/month (100GB bandwidth) |
| Render | Free | $0/month (750 hours) |
| Supabase | Free | $0/month (500MB database) |
| **Total** | | **$0/month** |

*Free tiers are sufficient for development and small production use*

---

## Next Steps

- [ ] Set up custom domain
- [ ] Configure SSL certificate (automatic on Netlify)
- [ ] Set up monitoring (Netlify Analytics)
- [ ] Configure backup strategy for database
- [ ] Set up CI/CD for automated testing
- [ ] Enable Netlify deployment previews for PRs

---

## Need More Help?

- 📖 Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🌐 Netlify-specific guide: [NETLIFY.md](./NETLIFY.md)
- 🧪 Test deployment: Run `./scripts/deploy-check.sh`

---

**Congratulations!** 🎉 Your Asset Manager is now live on Netlify!
