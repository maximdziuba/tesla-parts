# ⚡ Quick Deploy Reference Card

## Backend (Render)

### Commands
```bash
Build: ./build.sh
Start: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Environment Variables
```
ADMIN_SECRET=your-password
FRONTEND_URL=https://your-shop.vercel.app
```

---

## Admin Panel (Vercel)

### Deploy
```bash
cd tesla-parts-admin
vercel
```

### Environment Variable
```
VITE_API_URL=https://your-backend.onrender.com
```

### Settings
- Framework: Vite
- Build: `npm run build`  
- Output: `dist`
- Root: `tesla-parts-admin`

---

## Shop Frontend (Vercel)

### Deploy
```bash
cd tesla-parts-shop
vercel
```

### Environment Variable
```
VITE_API_URL=https://your-backend.onrender.com
```

### Settings
- Framework: Vite
- Build: `npm run build`
- Output: `dist`  
- Root: `tesla-parts-shop`

---

## Deployment Order

1. 🔧 Backend → Render
2. ⚙️ Admin → Vercel
3. 🛍️ Shop → Vercel
4. 🔄 Update CORS in backend
5. ✅ Test everything

---

## URLs After Deployment

```
Backend:  https://tesla-parts-api.onrender.com
Admin:    https://tesla-parts-admin.vercel.app
Shop:     https://tesla-parts-shop.vercel.app
```

---

## Test Checklist

✅ Backend health check  
✅ Admin login works  
✅ Shop loads products  
✅ Can create order  
✅ CORS configured  
✅ Images load  

---

## Common Commands

```bash
# Test locally
npm run dev

# Build for production  
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod
```
