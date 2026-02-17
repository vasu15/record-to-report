# 🚀 Quick Deploy Guide

## Your Live App
- **Frontend**: https://asset-manager-r2r.netlify.app
- **Backend**: https://asset-manager-api-r2r.onrender.com
- **GitHub**: https://github.com/vasu15/record-to-report

---

## 📝 To Deploy Changes (90% of the time)

```bash
git add .
git commit -m "Your change description"
git push origin main
```

**Wait 2-3 minutes. Done!** ✅

---

## 🔧 Common Tasks

### Frontend Changes (UI/Components)
```bash
git add client/
git commit -m "Update: Frontend changes"
git push origin main
```

### Backend Changes (API/Routes)
```bash
git add server/
git commit -m "Update: Backend changes"  
git push origin main
```

### Database Changes
```bash
npm run db:push              # Push schema first
git add shared/schema.ts
git commit -m "Update: Database schema"
git push origin main
```

### Add New Package
```bash
npm install package-name
git add package.json package-lock.json
git commit -m "Add: package-name dependency"
git push origin main
```

---

## 🐛 If Something Breaks

1. **Check logs**:
   - Netlify: https://app.netlify.com/projects/asset-manager-r2r/deploys
   - Render: https://dashboard.render.com/web/srv-d6a2ed1r0fns738c3seg

2. **Test locally**:
   ```bash
   npm run dev
   ```

3. **Rollback** (if needed):
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## 📊 Check Status

```bash
# Backend health
curl https://asset-manager-api-r2r.onrender.com/health

# Open app
open https://asset-manager-r2r.netlify.app
```

---

## 💡 Pro Tips

- **Descriptive commits**: Help you track changes
- **Test locally first**: `npm run dev`
- **Small commits**: Easier to debug if something breaks
- **Check logs**: If deploy fails, always check the logs

---

## 🆘 Need More Help?

See `DEPLOYMENT_REFERENCE.md` for detailed guide.

---

**That's it! Keep it simple.** 🎯
