# 🚀 Render Deployment - Quick Reference

## ⚡ Quick Deploy Commands

### Build Command (Render Dashboard):
```bash
./build.sh
```

### Start Command (Render Dashboard):
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 📋 Step-by-Step Deployment

### 1. Create Web Service on Render
- Go to [Render Dashboard](https://dashboard.render.com)
- Click **New +** → **Web Service**
- Connect your Git repository

### 2. Configure Service Settings

| Setting | Value |
|---------|-------|
| **Name** | `tesla-parts-api` |
| **Environment** | `Python 3` |
| **Build Command** | `./build.sh` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free (or paid) |

### 3. Add Environment Variables

Click **Environment** → **Add Environment Variable**:

| Key | Value | Notes |
|-----|-------|-------|
| `ADMIN_SECRET` | `your-secure-password` | Used for admin panel authentication |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Your frontend domain for CORS |
| `PYTHON_VERSION` | `3.11.0` | Optional: specify Python version |

### 4. Deploy

Click **Create Web Service** → Render will automatically:
- ✅ Install dependencies
- ✅ Create static directory
- ✅ Seed categories
- ✅ Seed pages
- ✅ Start FastAPI server

### 5. Get Your Backend URL

After deployment, Render provides a URL like:
```
https://tesla-parts-api.onrender.com
```

---

## 🔄 Update Frontend to Use Render Backend

### Admin Panel
File: `tesla-parts-admin/services/api.ts`

```typescript
const API_URL = 'https://tesla-parts-api.onrender.com';
```

### Shop Frontend  
File: `tesla-parts-shop/services/api.ts`

```typescript
const API_URL = 'https://tesla-parts-api.onrender.com';
```

---

## ✅ Verify Deployment

1. **Health Check**:
   ```
   https://your-app.onrender.com/
   ```
   Should return: `{"message": "Tesla Parts API is running"}`

2. **Test API**:
   ```
   https://your-app.onrender.com/products/
   https://your-app.onrender.com/categories/
   https://your-app.onrender.com/pages/
   ```

3. **Test Admin**:
   - Open admin panel
   - Login with your ADMIN_SECRET
   - Try creating/editing products

---

## ⚠️ Important Notes

### Free Tier Limitations
- ❌ **SQLite database resets** on service restarts
- ❌ **Uploaded images lost** when service spins down
- ⏱️ **Cold starts**: 30-60 second delay after inactivity

### Recommended Upgrades
- 💾 Use **PostgreSQL** for persistent database
- 📁 Use **Cloudinary/AWS S3** for image storage
- 🚀 Upgrade to **paid tier** to avoid spin-downs

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Check Render build logs
# Common issues:
- Missing dependencies in requirements.txt
- Syntax errors in Python files
- Permission issues with build.sh (chmod +x)
```

### CORS Errors
```python
# Add frontend domain to main.py manually:
origins = [
    "https://your-frontend.vercel.app",
    # ... other origins
]
```

### Database Empty After Restart
```bash
# Free tier resets filesystem
# Solution: Upgrade to PostgreSQL or paid tier
```

---

## 📦 What Was Deployed

✅ FastAPI backend with all routers  
✅ SQLite database (temporary on free tier)  
✅ Static file serving for images  
✅ Seeded categories (Екстер'єр, Інтер'єр, etc.)  
✅ Seeded pages (About, Delivery, FAQ, etc.)  
✅ CORS configured for frontend access  

---

## 🎯 Next Steps

1. **Deploy Admin Panel** to Vercel/Netlify
2. **Deploy Shop Frontend** to Vercel/Netlify  
3. **Upgrade to PostgreSQL** for persistence
4. **Add image hosting** (Cloudinary/S3)
5. **Configure custom domain** (optional)

---

## 📞 Support

If you encounter issues:
- Check Render logs in dashboard
- Review CORS settings in main.py
- Verify environment variables are set
- Ensure frontend URLs match CORS origins

**Deployment is complete when you see**:
```
==> Build successful 🎉
==> Deploying...
==> Your service is live at https://your-app.onrender.com
```
