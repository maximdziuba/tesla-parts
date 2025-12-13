# 🖼️ Image Upload Fix for Render Deployment

## The Problem
Images aren't showing because URLs are hardcoded as `http://127.0.0.1:8000/static/images/...` which only works locally.

## Solutions

### Option 1: Cloudinary (Recommended - Persistent Storage)

#### 1. Sign up for Cloudinary
- Go to https://cloudinary.com/users/register/free
- Free tier: 25GB storage, 25GB bandwidth/month

#### 2. Get Credentials
After signup, go to Dashboard and copy:
- Cloud Name
- API Key  
- API Secret

#### 3. Add to Render Environment Variables

In Render Dashboard → Your Service → Environment:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 4. Redeploy
Click "Manual Deploy" → "Deploy latest commit"

**That's it!** Images will now upload to Cloudinary and persist forever.

---

### Option 2: Quick Fix (Local Storage with Correct URL)

If you don't want to use Cloudinary right now, just add environment variable:

```
BACKEND_URL=https://your-app-name.onrender.com
```

Replace `your-app-name` with your actual Render service name.

Then redeploy. Images will save locally but **will be lost on restart** (Render free tier limitation).

---

## Testing

After deploying with either option:

1. Go to your admin panel
2. Create/edit a product
3. Upload an image
4. Check the image URL in the response - it should be:
   - **Cloudinary**: `https://res.cloudinary.com/...`
   - **Local**: `https://your-app.onrender.com/static/images/...`

---

## Current Status

✅ Image uploader service created  
✅ Cloudinary package added to requirements.txt  
⏳ Waiting for environment variables  
⏳ Needs redeploy after adding variables
