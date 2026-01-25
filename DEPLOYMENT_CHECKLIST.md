# ✅ Parallax Deployment Checklist

Use this checklist to deploy Parallax step by step.

---

## 🎯 Deployment Order

1. ✅ Deploy Backend to Vultr (15-20 min)
2. ✅ Deploy Frontend to Vercel (5-10 min)
3. ✅ Update Auth0 Settings (2 min)
4. ✅ Update Backend CORS (1 min)
5. ✅ Test Everything (5 min)

**Total Time**: ~30-40 minutes

---

## Part 1: Backend Deployment (Vultr)

### Step 1: Create Vultr Server
- [ ] Go to https://www.vultr.com/
- [ ] Sign up/Login
- [ ] Deploy New Server
  - [ ] Ubuntu 22.04 LTS
  - [ ] $6/month plan (2GB RAM)
  - [ ] Note IP address: `_________________`
  - [ ] Note password: `_________________`

### Step 2: Connect to Server
```bash
ssh root@YOUR_SERVER_IP
```

### Step 3: Run Automated Deployment
```bash
curl -fsSL https://raw.githubusercontent.com/Shiva1803/DTUhackathon/master/backend/scripts/deploy.sh | bash
```

### Step 4: Create .env File (if asked)
```bash
cd /var/www/parallax-backend/backend
nano .env
```

Paste this:
```env
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
CORS_ORIGIN=*
```

Save: Ctrl+X, Y, Enter

### Step 5: Configure Firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp
ufw enable
```

### Step 6: Test Backend
```bash
curl http://localhost:3001/health
```

- [ ] Backend health check passes
- [ ] Backend URL: `http://YOUR_SERVER_IP:3001`

**📖 Detailed Guide**: See `VULTR_DEPLOY_GUIDE.md`

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Go to Vercel
- [ ] Visit https://vercel.com/login
- [ ] Login with GitHub

### Step 2: Import Project
- [ ] Click "Add New..." → "Project"
- [ ] Select `Shiva1803/DTUhackathon`
- [ ] Click "Import"

### Step 3: Configure
- [ ] Framework: **Vite**
- [ ] Root Directory: **`frontend`**
- [ ] Build Command: `npm run build` (auto)
- [ ] Output Directory: `dist` (auto)

### Step 4: Add Environment Variables

Add these 4 variables:

1. **VITE_API_URL**
   - Value: `https://your-backend-url`
   - [ ] Added

2. **VITE_AUTH0_DOMAIN**
   - Value: `dev-yx6bvvjlq1p3lwvi.us.auth0.com`
   - [ ] Added

3. **VITE_AUTH0_CLIENT_ID**
   - Value: `bBPurXakQQEKIRCL7WUnar0PfUrWqqnt`
   - [ ] Added

4. **VITE_AUTH0_AUDIENCE**
   - Value: `https://myapp/api`
   - [ ] Added

### Step 5: Deploy
- [ ] Click "Deploy"
- [ ] Wait for build (2-3 min)
- [ ] Note Vercel URL: `_________________`

**📖 Detailed Guide**: See `VERCEL_DEPLOY_GUIDE.md`

---

## Part 3: Update Auth0 Settings

### Go to Auth0 Dashboard
- [ ] Visit https://manage.auth0.com/
- [ ] Go to Applications → Applications
- [ ] Click your application

### Update Application URIs

Add your Vercel URL to:

- [ ] **Allowed Callback URLs**
  - Add: `https://your-vercel-url.vercel.app`

- [ ] **Allowed Logout URLs**
  - Add: `https://your-vercel-url.vercel.app`

- [ ] **Allowed Web Origins**
  - Add: `https://your-vercel-url.vercel.app`

- [ ] **Allowed Origins (CORS)**
  - Add: `https://your-vercel-url.vercel.app`

- [ ] Click "Save Changes"

---

## Part 4: Update Backend CORS

### SSH into Vultr Server
```bash
ssh root@YOUR_VULTR_IP
cd /var/www/parallax-backend/backend
nano .env
```

### Update CORS_ORIGIN
Change:
```env
CORS_ORIGIN=*
```

To:
```env
CORS_ORIGIN=https://your-vercel-url.vercel.app,http://localhost:5173
```

### Restart Backend
```bash
pm2 restart parallax-api
```

- [ ] CORS updated
- [ ] Backend restarted

---

## Part 5: Test Everything

### Test Backend
```bash
curl http://YOUR_VULTR_IP:3001/health
```
- [ ] Returns `{"status":"ok",...}`

### Test Frontend
Visit: `https://your-vercel-url.vercel.app`

- [ ] Landing page loads
- [ ] Splash screen works
- [ ] Can click "Get Started"

### Test Authentication
- [ ] Click "Login"
- [ ] Auth0 login page appears
- [ ] Can login successfully
- [ ] Redirects back to dashboard

### Test Core Features
- [ ] Dashboard shows streak
- [ ] Can navigate to Daily Log
- [ ] Can record audio (or see recording interface)
- [ ] Can view History page
- [ ] Can view Summary page
- [ ] Theme toggle works (dark/light)

### Test API Integration
- [ ] Try recording a log (if you have microphone)
- [ ] Check if it appears in History
- [ ] Check if activity tracking works in Summary

---

## 🎉 Deployment Complete!

### Your URLs:
- **Frontend**: `https://your-vercel-url.vercel.app`
- **Backend**: `https://your-backend-url`
- **Health Check**: `https://your-backend-url/health`

### Share These URLs:
- Demo URL: `https://your-vercel-url.vercel.app`
- API Docs: `https://your-backend-url`
- GitHub: `https://github.com/Shiva1803/DTUhackathon`

---

## 🔧 Post-Deployment Tasks

### Optional: Setup Custom Domain
- [ ] Buy domain (GoDaddy, Namecheap, etc.)
- [ ] Point domain to Vultr IP
- [ ] Setup SSL with Let's Encrypt
- [ ] Update Vercel to use custom domain

### Optional: Generate New Gemini Key
- [ ] Go to https://aistudio.google.com/apikey
- [ ] Generate new API key
- [ ] Update in Vultr `.env`
- [ ] Restart backend: `pm2 restart parallax-api`

### Recommended: Setup Monitoring
- [ ] Enable Vultr monitoring
- [ ] Setup PM2 monitoring: `pm2 monitor`
- [ ] Enable Vercel analytics

---

## 📊 Useful Commands

### Backend (Vultr)
```bash
# Check status
pm2 status

# View logs
pm2 logs parallax-api

# Restart
pm2 restart parallax-api

# Update code
cd /var/www/parallax-backend
git pull origin master
cd backend
npm ci
npm run build
pm2 restart parallax-api
```

### Frontend (Vercel)
- Automatic deployment on git push
- Manual redeploy in Vercel dashboard

---

## 🐛 Troubleshooting

### Backend Issues
```bash
# Check logs
pm2 logs parallax-api --lines 100

# Check if running
pm2 status

# Check health
curl http://localhost:3001/health
```

### Frontend Issues
- Check Vercel deployment logs
- Check browser console for errors
- Verify environment variables in Vercel

### CORS Issues
- Verify CORS_ORIGIN in backend .env
- Verify Auth0 callback URLs
- Check browser network tab

---

## 📞 Support

- **Vultr Guide**: `VULTR_DEPLOY_GUIDE.md`
- **Vercel Guide**: `VERCEL_DEPLOY_GUIDE.md`
- **Full Deployment**: `DEPLOYMENT.md`
- **Demo Script**: `DEMO_SCRIPT.md`

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Status**: ⬜ In Progress | ⬜ Complete | ⬜ Issues

---

Good luck! 🚀
