# Render Deployment Guide for Tesla Parts Backend

## Prerequisites
1. Render account (free tier available)
2. Git repository pushed to GitHub/GitLab

## Environment Variables to Set in Render

Add these in Render Dashboard → Environment:

```
ADMIN_SECRET=your-secure-admin-secret-here
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=sqlite:///./tesla_parts.db
```

## Render Configuration

**Service Type**: Web Service

**Build Command**:
```bash
pip install -r requirements.txt && python seed_categories.py && python seed_pages.py
```

**Start Command**:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Instance Type**: Free (or paid for production)

## Deployment Steps

### 1. Push Code to Git
```bash
cd tesla-parts-backend
git add .
git commit -m "Prepare for Render deployment"
git push
```

### 2. Create New Web Service on Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your repository
4. Select your repository and branch

### 3. Configure Service
- **Name**: tesla-parts-api (or your choice)
- **Environment**: Python 3
- **Region**: Choose closest to your users
- **Branch**: main (or your branch)
- **Root Directory**: tesla-parts-backend (if not in root)
- **Build Command**: See above
- **Start Command**: See above

### 4. Add Environment Variables
In the "Environment" section, add:
- `ADMIN_SECRET`: Your secure admin password
- `FRONTEND_URL`: Your frontend URL (for CORS)

### 5. Deploy
Click "Create Web Service"

Render will:
1. Install dependencies from requirements.txt
2. Run seed scripts to populate database
3. Start the FastAPI server
4. Provide you with a public URL (e.g., https://tesla-parts-api.onrender.com)

## After Deployment

### Update Frontend URLs
Update these files to point to your Render backend URL:

1. **Admin Panel**: `tesla-parts-admin/services/api.ts`
   ```typescript
   const API_URL = 'https://your-app.onrender.com';
   ```

2. **Shop Frontend**: `tesla-parts-shop/services/api.ts`
   ```typescript
   const API_URL = 'https://your-app.onrender.com';
   ```

### Test Deployment
Visit: `https://your-app.onrender.com/` 
You should see: `{"message": "Tesla Parts API is running"}`

## Important Notes

### Database Persistence
- ⚠️ **Free Tier**: Render's free tier may reset the filesystem, losing SQLite data
- 💡 **Recommendation**: For production, use PostgreSQL (Render provides free PostgreSQL)
- 📁 Uploaded images in `/static` may also be lost on free tier

### CORS Configuration
- The current CORS allows localhost origins
- Add your frontend domains to `main.py` CORS origins before deploying

### Cold Starts
- Free tier services spin down after inactivity
- First request after inactivity may take 30-60 seconds

## Upgrading to PostgreSQL (Recommended for Production)

If you want persistent data:

1. Add PostgreSQL database on Render
2. Update requirements.txt to include `psycopg2-binary`
3. Update database.py to use PostgreSQL connection
4. Set DATABASE_URL environment variable to PostgreSQL connection string

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in requirements.txt

### App Crashes
- Check application logs in Render dashboard
- Verify environment variables are set correctly

### CORS Errors
- Add your frontend URL to CORS origins in main.py
- Redeploy after changes

## Monitoring

Render provides:
- Build logs
- Application logs
- Metrics (CPU, memory)
- Health checks

Access these in the Render dashboard for your service.
