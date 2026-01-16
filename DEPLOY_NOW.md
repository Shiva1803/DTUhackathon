# 🚀 Deploy Parallax NOW - Quick Guide

## Option 1: Deploy via Vercel Dashboard (Easiest - 5 minutes)

### Frontend Deployment

1. **Go to Vercel**: https://vercel.com/login
   - Sign in with GitHub

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `Shiva1803/DTUhackathon`
   - Click "Import"

3. **Configure Project**:
   - Framework Preset: **Vite**
   - Root Directory: **frontend**
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add Environment Variables**:
   ```
   VITE_API_URL=http://localhost:3001
   VITE_AUTH0_DOMAIN=dev-yx6bvvjlq1p3lwvi.us.auth0.com
   VITE_AUTH0_CLIENT_ID=bBPurXakQQEKIRCL7WUnar0PfUrWqqnt
   VITE_AUTH0_AUDIENCE=https://myapp/api
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get a URL like: `https://parallax-xyz.vercel.app`

6. **Update Auth0**:
   - Go to: https://manage.auth0.com
   - Select your application
   - Add to **Allowed Callback URLs**: `https://your-vercel-url.vercel.app`
   - Add to **Allowed Logout URLs**: `https://your-vercel-url.vercel.app`
   - Add to **Allowed Web Origins**: `https://your-vercel-url.vercel.app`
   - Save Changes

---

## Option 2: Deploy via Vercel CLI (Terminal)

### Prerequisites
```bash
npm install -g vercel
```

### Deploy Frontend
```bash
cd frontend
vercel login
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **parallax**
- Directory? **./frontend**
- Override settings? **N**

After deployment, add environment variables in Vercel dashboard.

---

## Option 3: Deploy Backend to Railway (Alternative to Vultr - Easier)

### Why Railway?
- No server management needed
- Automatic SSL
- Free tier available
- Deploy in 2 minutes

### Steps:

1. **Go to Railway**: https://railway.app/
   - Sign in with GitHub

2. **New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `Shiva1803/DTUhackathon`

3. **Configure**:
   - Root Directory: **backend**
   - Build Command: `npm run build`
   - Start Command: `npm start`

4. **Add Environment Variables**:
   Copy all from `backend/.env`:
   ```
   NODE_ENV=production
   PORT=3001
   MONGO_URI=mongodb+srv://amarnaniharsh_db_user:rKeJ7ZIGVXEbK64D@parallax.5h6prhb.mongodb.net/
   AUTH0_DOMAIN=dev-yx6bvvjlq1p3lwvi.us.auth0.com
   AUTH0_AUDIENCE=https://myapp/api
   AUTH0_CLIENT_ID=bBPurXakQQEKIRCL7WUnar0PfUrWqqnt
   CLOUDINARY_URL=cloudinary://531563958923791:EGTDyV7nK0EZiOn2Ul-q9z-tHk0@dfq0r11qu
   OND_CHAT_KEY=sKPWLTjkgh1Qrz5emU8AMkhNLLp8qFNk
   OND_CHAT_URL=https://api.on-demand.io/chat/v1
   OND_MEDIA_KEY=sKPWLTjkgh1Qrz5emU8AMkhNLLp8qFNk
   OND_MEDIA_URL=https://api.on-demand.io/media/v1
   GEMINI_KEY=AIzaSyCP2L6QdU56kkIk0V7A_0oNt_fh61_jRtc
   ELEVEN_KEY=sk_99d30595337515c64e4fb6922ce37197b4f6f679912778ff
   CORS_ORIGIN=https://your-vercel-url.vercel.app
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait 3-5 minutes
   - You'll get a URL like: `https://parallax-production.up.railway.app`

6. **Update Frontend**:
   - Go back to Vercel dashboard
   - Update `VITE_API_URL` to your Railway URL
   - Redeploy frontend

---

## Option 4: Deploy Backend to Render (Another Easy Alternative)

1. **Go to Render**: https://render.com/
   - Sign in with GitHub

2. **New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repo: `Shiva1803/DTUhackathon`

3. **Configure**:
   - Name: `parallax-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Free

4. **Add Environment Variables**: (Same as Railway above)

5. **Deploy**: Click "Create Web Service"

---

## 🎯 Recommended: Railway or Render (Easiest)

Both Railway and Render are easier than Vultr because:
- ✅ No server management
- ✅ Automatic SSL/HTTPS
- ✅ Free tier available
- ✅ GitHub integration
- ✅ Automatic deployments on push
- ✅ Built-in monitoring

### Deployment Order:
1. Deploy Backend to Railway/Render (5 min)
2. Get backend URL
3. Deploy Frontend to Vercel (3 min)
4. Update CORS_ORIGIN in backend with frontend URL
5. Update Auth0 callback URLs
6. Test!

---

## ⚡ Quick Test After Deployment

### Test Backend:
```bash
curl https://your-backend-url.railway.app/health
```

Should return:
```json
{"status":"ok","uptime":123,...}
```

### Test Frontend:
1. Visit your Vercel URL
2. Click "Login"
3. Try recording an audio log
4. Check if it appears in History

---

## 🔧 Update Gemini API Key (Important!)

Your current Gemini key is leaked. Get a new one:

1. Go to: https://aistudio.google.com/apikey
2. Create new API key
3. Update in Railway/Render environment variables:
   - `GEMINI_KEY=your-new-key`
4. Restart backend service

---

## 📞 Need Help?

If you encounter issues:
1. Check Railway/Render logs
2. Check Vercel deployment logs
3. Verify all environment variables are set
4. Check Auth0 callback URLs match your deployed URLs

---

## 🎉 Success Checklist

- [ ] Backend deployed (Railway/Render)
- [ ] Backend health check passing
- [ ] Frontend deployed (Vercel)
- [ ] Auth0 callback URLs updated
- [ ] CORS_ORIGIN updated in backend
- [ ] Can login successfully
- [ ] Can record audio log
- [ ] Activity tracking works
- [ ] All pages load correctly

---

**Estimated Total Time**: 10-15 minutes

**Cost**: $0 (using free tiers)

Good luck! 🚀
