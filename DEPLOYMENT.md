# Deployment Guide - Asset Manager

This guide explains how to deploy the Asset Manager application to production. The application consists of:
- **Frontend**: React + Vite (deployed to Netlify)
- **Backend**: Express.js + PostgreSQL (deployed to Render/Railway)

## Architecture

```
Frontend (Netlify)  →  Backend API (Render/Railway)  →  PostgreSQL (Supabase)
```

---

## Part 1: Deploy Backend API

### Option A: Deploy to Render (Recommended)

1. **Create a Render account** at https://render.com

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Name: `asset-manager-api` (or your choice)
   - Environment: `Node`
   - Region: Choose closest to your users
   - Branch: `main`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Set Environment Variables** in Render dashboard:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.zqgohvgjkiarhatprrhh.supabase.co:5432/postgres
   SESSION_SECRET=your-secure-secret-key-here
   NODE_ENV=production
   PORT=3000
   GEMINI_API_KEY=AIzaSyDKQaq_5oxUD4Qo2dmPSixwW7_GXT0-nU0
   ```

4. **Deploy** and note your backend URL (e.g., `https://asset-manager-api.onrender.com`)

### Option B: Deploy to Railway

1. **Create a Railway account** at https://railway.app

2. **Create a new project**:
   - Connect your GitHub repository
   - Railway will auto-detect Node.js

3. **Add Environment Variables**:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.zqgohvgjkiarhatprrhh.supabase.co:5432/postgres
   SESSION_SECRET=your-secure-secret-key-here
   NODE_ENV=production
   PORT=3000
   GEMINI_API_KEY=AIzaSyDKQaq_5oxUD4Qo2dmPSixwW7_GXT0-nU0
   ```

4. **Configure Build Settings** (if needed):
   - Build Command: `npm run build`
   - Start Command: `npm start`

5. **Deploy** and note your backend URL (e.g., `https://asset-manager-api.up.railway.app`)

---

## Part 2: Deploy Frontend to Netlify

### Prerequisites
- Backend API deployed and URL available
- Netlify account at https://netlify.com

### Steps

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure for Netlify deployment"
   git push origin main
   ```

2. **Create a new Netlify site**:
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

3. **Configure build settings**:
   - Build command: `npm run build:client`
   - Publish directory: `dist/public`
   - These should be auto-detected from `netlify.toml`

4. **Set Environment Variables** in Netlify:
   - Go to Site settings → Environment variables
   - Add: `VITE_API_BASE_URL` = Your backend URL from Part 1
   - Example: `https://asset-manager-api.onrender.com`

5. **Deploy**:
   - Click "Deploy site"
   - Netlify will build and deploy your frontend

6. **Custom Domain** (Optional):
   - Go to Site settings → Domain management
   - Add your custom domain

---

## Part 3: Verify Deployment

### Test Backend API
```bash
curl https://your-backend-url.onrender.com/api/health
```

### Test Frontend
1. Open your Netlify URL in browser
2. Try logging in
3. Check browser console for any CORS or connection errors

### Common Issues

**CORS Errors**:
If you see CORS errors, add this to your backend `server/index.ts`:
```typescript
import cors from 'cors';
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-netlify-site.netlify.app',
  credentials: true
}));
```

**Session Issues**:
Make sure `credentials: 'include'` is set in all fetch requests (already configured in this app).

---

## Part 4: Environment Variables Summary

### Backend (.env)
```bash
DATABASE_URL=postgresql://postgres:PASSWORD@db.zqgohvgjkiarhatprrhh.supabase.co:5432/postgres
SESSION_SECRET=your-secure-secret-here
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=https://your-site.netlify.app  # For CORS
```

### Frontend (Netlify Environment Variables)
```bash
VITE_API_BASE_URL=https://your-backend-api.onrender.com
```

---

## Part 5: Continuous Deployment

Both Netlify and Render/Railway support automatic deployments:

1. **Automatic Deployments**: Push to `main` branch triggers automatic deployment
2. **Preview Deployments**: Pull requests get preview URLs
3. **Rollbacks**: Easy rollback to previous deployments

---

## Quick Deploy Checklist

- [ ] Backend deployed to Render/Railway
- [ ] Backend environment variables configured
- [ ] Backend URL noted
- [ ] Frontend deployed to Netlify
- [ ] `VITE_API_BASE_URL` set in Netlify
- [ ] Test login functionality
- [ ] Test database connections
- [ ] Configure custom domain (optional)
- [ ] Set up CORS if needed
- [ ] Monitor logs for errors

---

## Local Development

For local development, no changes needed:
```bash
npm install
npm run dev
```

The dev server proxies API requests automatically.

---

## Support

If you encounter issues:
1. Check Netlify build logs
2. Check Render/Railway application logs
3. Verify environment variables are set correctly
4. Test backend API endpoint directly
5. Check browser console for frontend errors

---

## Security Notes

1. **Never commit `.env` files** to git
2. **Rotate secrets regularly** (SESSION_SECRET, API keys)
3. **Use strong SESSION_SECRET** (generate with: `openssl rand -base64 32`)
4. **Enable HTTPS only** (default on Netlify/Render)
5. **Review CORS configuration** for production
