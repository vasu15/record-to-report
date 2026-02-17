# Asset Manager - Quick Start for Netlify

This project is configured for split deployment:
- **Frontend** → Netlify (static hosting)
- **Backend** → Render/Railway (Node.js hosting)

## Quick Deploy to Netlify (Frontend Only)

### 1. Deploy Backend First
You must deploy the backend before deploying to Netlify. See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete backend deployment instructions.

**Quick Backend Deploy to Render:**
1. Go to https://render.com
2. Create New → Web Service
3. Connect your GitHub repo
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add environment variables (see DEPLOYMENT.md)
7. Deploy & copy your backend URL

### 2. Deploy Frontend to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

**Or manually:**

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to https://app.netlify.com
   - "Add new site" → "Import an existing project"
   - Select your GitHub repository

3. **Build Settings** (auto-detected from netlify.toml):
   - Build command: `npm run build:client`
   - Publish directory: `dist/public`

4. **Environment Variables**:
   Add this in Netlify Site Settings → Environment Variables:
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   ```

5. **Deploy** 🚀

### 3. Verify Deployment

Open your Netlify URL and test:
- [ ] Site loads
- [ ] Can access login page
- [ ] Can log in (backend connection working)
- [ ] No CORS errors in console

## Configuration Files

- `netlify.toml` - Netlify configuration
- `DEPLOYMENT.md` - Complete deployment guide
- `.env.example` - Environment variables template
- `scripts/deploy-check.sh` - Pre-deployment validation script

## Test Before Deploying

Run the deployment check script:
```bash
./scripts/deploy-check.sh
```

This validates:
- ✅ Git repository setup
- ✅ Required files present
- ✅ Build works correctly
- ✅ Output directory created

## Project Structure

```
.
├── client/              # React frontend (deployed to Netlify)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── config.ts    # API URL configuration
│   │   │   ├── api.ts       # API helpers with base URL
│   │   │   └── queryClient.ts
│   │   └── ...
│   └── index.html
├── server/              # Express backend (deployed to Render/Railway)
│   └── ...
├── netlify.toml         # Netlify configuration
└── DEPLOYMENT.md        # Full deployment guide
```

## Environment Variables

### Frontend (Netlify)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://api.example.com` |

### Backend (Render/Railway)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Session secret key |
| `NODE_ENV` | Set to `production` |
| `PORT` | Port number (usually 3000) |
| `GEMINI_API_KEY` | AI API key (optional) |

## Troubleshooting

### Build Fails on Netlify
- Check build logs in Netlify dashboard
- Ensure `npm run build:client` works locally
- Verify all dependencies are in `package.json` (not devDependencies)

### Can't Connect to Backend
- Verify `VITE_API_BASE_URL` is set correctly in Netlify
- Check backend is running (visit backend URL directly)
- Check CORS configuration in backend

### CORS Errors
Add CORS middleware to backend (`server/index.ts`):
```typescript
import cors from 'cors';
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Login Not Working
- Check browser console for errors
- Verify `credentials: 'include'` in fetch requests
- Check SESSION_SECRET is set in backend
- Verify database connection

## Local Development

No changes needed for local development:
```bash
npm install
npm run dev
```

Vite dev server automatically proxies API requests to the local backend.

## Need Help?

1. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
2. Check Netlify build logs
3. Check backend logs in Render/Railway
4. Verify environment variables are set

## Support

For issues specific to:
- **Netlify**: https://docs.netlify.com
- **Render**: https://render.com/docs
- **Railway**: https://docs.railway.app
