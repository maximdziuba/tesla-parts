# 🚀 Complete Deployment Guide - Tesla Parts Shop

## Overview

This guide covers deploying all three applications:
1. **Backend** (FastAPI) → Render
2. **Admin Panel** (React/Vite) → Vercel
3. **Shop Frontend** (React/Vite) → Vercel

---

## 📦 Deployment Order

Deploy in this order to ensure dependencies are met:

1. ✅ **Backend First** (Render)
2. ✅ **Admin Panel** (Vercel)
3. ✅ **Shop Frontend** (Vercel)

---

## 🎯 Step 1: Deploy Backend to Render

### Quick Commands

**Build Command:**
```bash
./build.sh
```

**Start Command:**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Environment Variables

| Variable | Example | Required |
|----------|---------|----------|
| `ADMIN_SECRET` | `my-secure-password-123` | ✅ Yes |
| `FRONTEND_URL` | `https://tesla-shop.vercel.app` | Optional |

### Steps

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your Git repo
4. Configure:
   - **Name**: `tesla-parts-api`
   - **Environment**: Python 3
   - **Build**: `./build.sh`
   - **Start**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Click **Create Web Service**

### Get Your Backend URL

After deployment, Render provides:
```
https://tesla-parts-api.onrender.com
```

**Save this URL** - you'll need it for the frontends!

📖 **Detailed Guide**: [`tesla-parts-backend/DEPLOY.md`](file:///Users/maximdziuba/projects/freelance/tesla-shop/tesla-parts-backend/DEPLOY.md)

---

## 🎯 Step 2: Deploy Admin Panel to Vercel

### Environment Variable

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Render backend URL |

Example:
```
VITE_API_URL=https://tesla-parts-api.onrender.com
```

### Quick Deploy

```bash
cd tesla-parts-admin
vercel
```

Or use [Vercel Dashboard](https://vercel.com/new):
1. Import Git repository
2. Set root directory: `tesla-parts-admin`
3. Add environment variable: `VITE_API_URL`
4. Deploy

### Get Your Admin URL

After deployment:
```
https://tesla-parts-admin.vercel.app
```

📖 **Detailed Guide**: [`tesla-parts-admin/VERCEL_DEPLOY.md`](file:///Users/maximdziuba/projects/freelance/tesla-shop/tesla-parts-admin/VERCEL_DEPLOY.md)

---

## 🎯 Step 3: Deploy Shop Frontend to Vercel

### Environment Variable

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Render backend URL (same as admin) |

Example:
```
VITE_API_URL=https://tesla-parts-api.onrender.com
```

### Quick Deploy

```bash
cd tesla-parts-shop
vercel
```

Or use [Vercel Dashboard](https://vercel.com/new):
1. Import Git repository
2. Set root directory: `tesla-parts-shop`
3. Add environment variable: `VITE_API_URL`
4. Deploy

### Get Your Shop URL

After deployment:
```
https://tesla-parts-shop.vercel.app
```

📖 **Detailed Guide**: [`tesla-parts-shop/VERCEL_DEPLOY.md`](file:///Users/maximdziuba/projects/freelance/tesla-shop/tesla-parts-shop/VERCEL_DEPLOY.md)

---

## 🔄 Step 4: Update Backend CORS

After deploying both frontends, update backend CORS:

Edit `tesla-parts-backend/main.py`:

```python
origins = [
    # Local development
    "http://localhost:3000",
    "http://localhost:5173",
    # Production
    "https://tesla-parts-admin.vercel.app",
    "https://tesla-parts-shop.vercel.app",
]
```

Then **redeploy backend** on Render!

---

## ✅ Verification Checklist

### Backend (Render)
- [ ] Health check: `https://your-api.onrender.com/` returns message
- [ ] Products endpoint: `https://your-api.onrender.com/products/`
- [ ] Categories endpoint: `https://your-api.onrender.com/categories/`
- [ ] Pages endpoint: `https://your-api.onrender.com/pages/`

### Admin Panel (Vercel)
- [ ] Site loads without errors
- [ ] Can login with admin secret
- [ ] Can view products list
- [ ] Can create new product
- [ ] Can edit categories
- [ ] Can manage pages in CMS

### Shop Frontend (Vercel)
- [ ] Site loads without errors
- [ ] Products display correctly
- [ ] Can browse categories
- [ ] Can add to cart
- [ ] Can complete checkout
- [ ] Static pages load (About, Contacts, etc.)

---

## 🌐 Your Deployed URLs

After completing all steps, you'll have:

| Application | URL | Purpose |
|------------|-----|---------|
| **Backend API** | `https://tesla-parts-api.onrender.com` | Data & business logic |
| **Admin Panel** | `https://tesla-parts-admin.vercel.app` | Manage products, orders, content |
| **Shop Frontend** | `https://tesla-parts-shop.vercel.app` | Customer-facing shop |

---

## 🎨 Optional: Custom Domains

### Backend (Render)
1. Render Dashboard → Custom Domain
2. Add: `api.yourdomain.com`
3. Update DNS records

### Frontends (Vercel)
1. Vercel Dashboard → Domains
2. Add custom domains:
   - Admin: `admin.yourdomain.com`
   - Shop: `shop.yourdomain.com` or `www.yourdomain.com`
3. Update DNS records

---

## 🔐 Environment Variables Summary

### Backend (Render)
```bash
ADMIN_SECRET=your-secure-admin-password
FRONTEND_URL=https://tesla-parts-shop.vercel.app
```

### Admin Panel (Vercel)
```bash
VITE_API_URL=https://tesla-parts-api.onrender.com
```

### Shop Frontend (Vercel)
```bash
VITE_API_URL=https://tesla-parts-api.onrender.com
```

---

## 🚨 Common Issues & Solutions

### CORS Errors
**Problem**: Browser shows CORS error  
**Solution**: Add frontend URLs to backend CORS origins, redeploy backend

### API Not Found (404)
**Problem**: Frontend can't reach backend  
**Solution**: Check `VITE_API_URL` is set correctly in Vercel

### Build Fails
**Problem**: Deployment fails during build  
**Solution**: Test build locally first: `npm run build` or `./build.sh`

### Images Not Loading
**Problem**: Product images don't display  
**Solution**: 
- Check backend `/static` endpoint is accessible
- Verify image URLs in database are correct
- For production, consider using cloud storage (Cloudinary, S3)

### Database Empty After Restart
**Problem**: Products/categories disappear (Render free tier)  
**Solution**: Upgrade to PostgreSQL or paid tier for persistence

---

## 📊 Monitoring

### Backend (Render)
- View logs in Render dashboard
- Monitor response times
- Check health endpoint regularly

### Frontends (Vercel)
- Vercel Analytics for traffic
- Speed Insights for performance
- Real-time function logs

---

## 🔄 Continuous Deployment

### Automatic Deployments
Connect Git repositories to both platforms:

**Render**:
- Auto-deploys on push to main branch
- Manual deploys from dashboard

**Vercel**:
- Auto-deploys on every push
- Preview deployments for PRs
- Branch previews

### Manual Deployments

**Backend**:
```bash
git push origin main  # Triggers Render deploy
```

**Frontends**:
```bash
vercel --prod  # Deploy to production
```

---

## 💡 Production Tips

### Performance
- ✅ Enable caching on backend
- ✅ Optimize images before upload
- ✅ Use Vercel Analytics to monitor
- ✅ Consider CDN for static assets

### Security
- ✅ Use strong admin secret
- ✅ Enable HTTPS (automatic on both platforms)
- ✅ Implement rate limiting
- ✅ Regular dependency updates

### Scalability
- 💰 Upgrade Render tier if needed
- 📦 Consider PostgreSQL for persistence
- 🖼️ Use cloud storage for images
- 📈 Monitor usage and scale accordingly

---

## 🎯 Next Steps

1. ✅ Set up custom domains
2. ✅ Configure Google Analytics
3. ✅ Set up error monitoring (Sentry)
4. ✅ Implement backup strategy
5. ✅ Add monitoring/alerting
6. ✅ Plan for scaling

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Vite Docs**: https://vitejs.dev

---

## ✨ Deployment Complete!

All three applications are now live and working together:

1. 🖥️ **Backend** processes all data and business logic
2. ⚙️ **Admin Panel** manages all content
3. 🛍️ **Shop Frontend** serves customers

**Congratulations!** Your Tesla Parts Shop is now deployed and ready for business! 🎉
