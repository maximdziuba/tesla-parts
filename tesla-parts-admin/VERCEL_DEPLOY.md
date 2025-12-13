# 🚀 Vercel Deployment Guide - Admin Panel

## Quick Start

### 1. Deploy to Vercel

```bash
cd tesla-parts-admin
vercel
```

Or use the Vercel dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your Git repository
4. Select `tesla-parts-admin` as root directory

---

## ⚙️ Configuration

### Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Example |
|----------|-------|---------|
| `VITE_API_URL` | Your backend URL | `https://tesla-parts-api.onrender.com` |

**Important**: Don't include trailing slash in the URL.

### Vercel Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Root Directory** | `tesla-parts-admin` |

---

## 📋 Pre-Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Backend URL added to environment variables
- [ ] `.env.local` created locally (copy from `.env.example`)
- [ ] Test build locally: `npm run build`
- [ ] All dependencies in `package.json`

---

## 🧪 Test Locally

```bash
# 1. Create .env.local
cp .env.example .env.local

# 2. Edit .env.local and set your backend URL
echo "VITE_API_URL=https://your-backend.onrender.com" > .env.local

# 3. Install dependencies
npm install

# 4. Test development
npm run dev

# 5. Test production build
npm run build
npm run preview
```

---

## 🔄 Deployment Steps

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd tesla-parts-admin
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - What's your project's name? tesla-parts-admin
# - In which directory is your code located? ./
# - Want to override settings? No
```

### Option 2: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository**
3. **Configure Project**:
   - Root Directory: `tesla-parts-admin`
   - Framework: Vite
4. **Add Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.onrender.com`
5. **Deploy**

---

## ✅ Verify Deployment

1. Visit your Vercel URL: `https://tesla-parts-admin.vercel.app`
2. Try logging in with your admin secret
3. Check browser console for errors
4. Test creating/editing a product

### Common Issues

**CORS Error**:
- Add your Vercel URL to backend CORS origins
- Redeploy backend after adding

**API URL Not Set**:
- Check environment variable in Vercel dashboard
- Variable must be named exactly `VITE_API_URL`
- Redeploy after adding variable

**404 on Refresh**:
- Ensure `vercel.json` is present with rewrites
- Redeploy if needed

---

## 🔐 Production Considerations

### Security
- ✅ Admin secret stored in localStorage (client-side)
- ✅ HTTPS enforced by Vercel
- ⚠️ Consider implementing proper JWT authentication

### Performance
- ✅ Vite optimizes bundle size
- ✅ Vercel CDN for fast global delivery
- ✅ Automatic code splitting

---

## 🔄 Updating Deployment

### Automatic (Recommended)
Connect your Git repository to Vercel:
- Every push to main branch auto-deploys
- Preview deployments for pull requests

### Manual
```bash
vercel --prod
```

---

## 📊 Monitoring

Access in Vercel Dashboard:
- **Deployments**: See all deployments and logs
- **Analytics**: Page views and performance
- **Logs**: Real-time function logs
- **Speed Insights**: Performance metrics

---

## 🎯 Post-Deployment

### Update Backend CORS

Add your admin URL to backend `main.py`:

```python
origins = [
    "https://tesla-parts-admin.vercel.app",
    # ... other origins
]
```

Then redeploy backend.

### Test Full Flow

1. Login to admin panel
2. Create a product
3. Upload images
4. Verify data in backend
5. Check shop frontend displays correctly

---

## 🔗 Links After Deployment

- **Production URL**: `https://tesla-parts-admin.vercel.app`
- **Backend API**: Your Render URL
- **Vercel Dashboard**: See all deployments and settings

---

## 💡 Tips

- Use preview deployments to test changes
- Keep environment variables in sync
- Monitor build times in dashboard
- Use Vercel CLI for quick deployments
- Enable automatic deployments from Git

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check build logs, ensure dependencies installed |
| Can't login | Verify admin secret, check network tab |
| CORS errors | Add Vercel URL to backend CORS |
| Images not loading | Check static file serving on backend |
| Blank page | Check console, verify API_URL is set |

**Need help?** Check Vercel logs in dashboard for detailed error messages.
