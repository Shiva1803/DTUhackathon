# 🎨 Vercel Frontend Deployment Guide

Quick guide to deploy Parallax frontend on Vercel via their website.

---

## Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/login
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub

---

## Step 2: Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Find your repository: **`Shiva1803/DTUhackathon`**
3. Click **"Import"**

---

## Step 3: Configure Project Settings

### Framework Preset
- Select: **Vite**

### Root Directory
- Click **"Edit"**
- Enter: **`frontend`**
- Click **"Continue"**

### Build and Output Settings
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Install Command: `npm install` (auto-detected)

**Leave these as default** ✅

---

## Step 4: Add Environment Variables

Click **"Environment Variables"** section and add these **4 variables**:

### Variable 1: VITE_API_URL
- **Name**: `VITE_API_URL`
- **Value**: `https://your-backend-url`
  - Replace with your actual backend URL (Railway/Render/Vultr domain)
  - Example: `https://api.yourdomain.com`

### Variable 2: VITE_AUTH0_DOMAIN
- **Name**: `VITE_AUTH0_DOMAIN`
- **Value**: `dev-yx6bvvjlq1p3lwvi.us.auth0.com`

### Variable 3: VITE_AUTH0_CLIENT_ID
- **Name**: `VITE_AUTH0_CLIENT_ID`
- **Value**: `bBPurXakQQEKIRCL7WUnar0PfUrWqqnt`

### Variable 4: VITE_AUTH0_AUDIENCE
- **Name**: `VITE_AUTH0_AUDIENCE`
- **Value**: `https://myapp/api`

---

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll see: **"Congratulations! Your project has been deployed."**
4. Note your deployment URL: `https://parallax-xyz.vercel.app`
   - (Your actual URL will be different)

---

## Step 6: Update Auth0 Settings

1. Go to: https://manage.auth0.com/
2. Navigate to: **Applications** → **Applications**
3. Click on your application
4. Scroll to **Application URIs** section

### Add your Vercel URL to these fields:

**Allowed Callback URLs** (add to existing):
```
https://your-vercel-url.vercel.app
```

**Allowed Logout URLs** (add to existing):
```
https://your-vercel-url.vercel.app
```

**Allowed Web Origins** (add to existing):
```
https://your-vercel-url.vercel.app
```

**Allowed Origins (CORS)** (add to existing):
```
https://your-vercel-url.vercel.app
```

5. Click **"Save Changes"** at the bottom

---

## Step 7: Update Backend CORS

SSH into your Vultr server and update CORS:

```bash
ssh root@YOUR_VULTR_IP
cd /var/www/parallax-backend/backend
nano .env
```

Update the `CORS_ORIGIN` line:
```env
CORS_ORIGIN=https://your-vercel-url.vercel.app,http://localhost:5173
```

Save (Ctrl+X, Y, Enter) and restart:
```bash
pm2 restart parallax-api
```

---

## Step 8: Test Your Deployment

1. Visit your Vercel URL: `https://your-vercel-url.vercel.app`
2. Click **"Login"**
3. Authenticate with Auth0
4. Try recording an audio log
5. Check if it appears in History
6. View Summary page

---

## 🎯 Quick Reference

### Your URLs:
- **Frontend**: `https://your-vercel-url.vercel.app`
- **Backend**: `https://your-backend-url`
- **Health Check**: `https://your-backend-url/health`

### Environment Variables (Vercel):
```
VITE_API_URL=https://your-backend-url
VITE_AUTH0_DOMAIN=dev-yx6bvvjlq1p3lwvi.us.auth0.com
VITE_AUTH0_CLIENT_ID=bBPurXakQQEKIRCL7WUnar0PfUrWqqnt
VITE_AUTH0_AUDIENCE=https://myapp/api
```

---

## 🔄 Redeploy After Changes

### Automatic Redeployment:
Vercel automatically redeploys when you push to GitHub master branch.

### Manual Redeployment:
1. Go to Vercel dashboard
2. Select your project
3. Click **"Deployments"** tab
4. Click **"..."** on latest deployment
5. Click **"Redeploy"**

---

## 🔧 Update Environment Variables

If you need to change environment variables:

1. Go to Vercel dashboard
2. Select your project
3. Click **"Settings"** tab
4. Click **"Environment Variables"**
5. Edit the variable
6. Click **"Save"**
7. Go to **"Deployments"** and redeploy

---

## 🐛 Troubleshooting

### Build Failed:
- Check build logs in Vercel dashboard
- Verify `frontend` directory is set as root
- Check if all dependencies are in `package.json`

### Can't Login:
- Verify Auth0 callback URLs include your Vercel URL
- Check browser console for errors
- Verify environment variables are set correctly

### API Calls Failing:
- Check `VITE_API_URL` is correct
- Verify backend is running: `curl http://YOUR_VULTR_IP:3001/health`
- Check CORS is configured in backend

### 404 on Page Refresh:
- This should be handled by `vercel.json`
- Check if `vercel.json` exists in frontend directory

---

## 📊 Vercel Dashboard Features

### Deployments Tab:
- View all deployments
- See build logs
- Rollback to previous versions

### Analytics Tab:
- View page views
- See performance metrics
- Monitor errors

### Settings Tab:
- Environment variables
- Domain settings
- Build settings

---

## 🎉 Success Checklist

- [ ] Frontend deployed to Vercel
- [ ] Got Vercel URL
- [ ] Environment variables added
- [ ] Auth0 callback URLs updated
- [ ] Backend CORS updated
- [ ] Can access frontend
- [ ] Can login successfully
- [ ] Can record audio
- [ ] Can view history
- [ ] Activity tracking works

---

**Estimated Time**: 5-10 minutes
**Cost**: $0 (Vercel free tier)

Enjoy your deployed app! 🚀
