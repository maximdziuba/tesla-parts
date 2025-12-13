# 🚀 Vercel Deployment Guide - Shop Frontend

## Quick Start

### 1. Deploy to Vercel

```bash
cd tesla-parts-shop
vercel
```

Or use the Vercel dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your Git repository
4. Select `tesla-parts-shop` as root directory

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
| **Root Directory** | `tesla-parts-shop` |

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
cd tesla-parts-shop
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - What's your project's name? tesla-parts-shop
# - In which directory is your code located? ./
# - Want to override settings? No
```

### Option 2: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository**
3. **Configure Project**:
   - Root Directory: `tesla-parts-shop`
   - Framework: Vite
4. **Add Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.onrender.com`
5. **Deploy**

---

## ✅ Verify Deployment

1. Visit your Vercel URL: `https://tesla-parts-shop.vercel.app`
2. Browse products
3. Try adding to cart
4. Test checkout flow
5. Visit static pages (About, Contacts, etc.)
6. Check browser console for errors

### Common Issues

**CORS Error**:
- Add your Vercel URL to backend CORS origins
- Redeploy backend after adding

**Products Not Loading**:
- Check VITE_API_URL is set correctly
- Verify backend is running
- Check network tab in browser

**404 on Page Refresh**:
- Ensure `vercel.json` is present with rewrites
- Redeploy if needed

---

## 🎨 Production Optimizations

### Performance
- ✅ Vite optimizes and minifies code
- ✅ Vercel Edge Network for global CDN
- ✅ Automatic image optimization
- ✅ HTTP/2 and compression

### SEO
- ✅ Meta tags in index.html
- ✅ Semantic HTML structure
- ✅ Fast loading times
- ⚠️ Consider SSR/SSG for better SEO (Next.js migration)

---

## 🔄 Updating Deployment

### Automatic (Recommended)
Connect your Git repository to Vercel:
- Every push to main branch auto-deploys
- Preview deployments for pull requests
- Branch previews for testing

### Manual
```bash
vercel --prod
```

---

## 📊 Monitoring

Access in Vercel Dashboard:
- **Deployments**: See all deployments and logs
- **Analytics**: Visitor insights
- **Speed Insights**: Core Web Vitals
- **Real User Monitoring**: Performance metrics

---

## 🎯 Post-Deployment

### 1. Update Backend CORS

Add your shop URL to backend `main.py`:

```python
origins = [
    "https://tesla-parts-shop.vercel.app",
    # ... other origins
]
```

Then redeploy backend on Render.

### 2. Test Complete User Journey

1. **Browse Products**
   - View categories
   - Search products
   - View product details

2. **Shopping Cart**
   - Add products
   - Update quantities
   - Remove items

3. **Checkout**
   - Fill delivery info
   - Select payment method
   - Submit order

4. **Static Pages**
   - About
   - Delivery
   - Returns
   - FAQ
   - Contacts

### 3. Mobile Testing

- Test on different devices
- Check responsive design
- Verify touch interactions
- Test form inputs

---

## 🎨 Custom Domain (Optional)

1. Go to Vercel project settings
2. Navigate to **Domains**
3. Add your custom domain (e.g., `shop.teslaparts.com`)
4. Follow Vercel's DNS instructions
5. SSL certificate auto-provisioned

---

## 🔗 Links After Deployment

- **Production URL**: `https://tesla-parts-shop.vercel.app`
- **Admin Panel**: Your admin Vercel URL
- **Backend API**: Your Render URL
- **Vercel Dashboard**: Manage deployments

---

## 💡 Best Practices

- ✅ Enable automatic deployments from Git
- ✅ Use preview URLs to test changes
- ✅ Monitor Web Vitals in Vercel dashboard
- ✅ Keep dependencies updated
- ✅ Test on multiple browsers
- ✅ Optimize images before uploading

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check package.json, install dependencies locally |
| Blank page | Verify API_URL env variable is set |
| CORS errors | Add Vercel URL to backend CORS origins |
| Slow loading | Check backend response times, optimize images |
| Cart not working | Check localStorage support, verify API calls |
| Static pages empty | Ensure pages seeded in backend database |

**Debug Steps**:
1. Check browser console for errors
2. Verify network requests in DevTools
3. Test backend API directly
4. Check Vercel function logs

---

## 📈 Performance Tips

- Lazy load images
- Use Vercel Image Optimization
- Minimize bundle size
- Enable caching headers
- Monitor Core Web Vitals

---

## 🔐 Security

- ✅ HTTPS enforced
- ✅ Secure headers
- ✅ XSS protection
- ✅ CORS properly configured
- ⚠️ Implement rate limiting on backend

---

**Deployment Complete!** 🎉

Your shop is now live and ready to accept orders!
