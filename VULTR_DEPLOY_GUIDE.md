# 🚀 Vultr Backend Deployment Guide

Complete step-by-step guide to deploy Parallax backend on Vultr VPS.

---

## Part 1: Provision Vultr Server (5 minutes)

### Step 1: Create Vultr Account
1. Go to https://www.vultr.com/
2. Sign up or log in
3. Add payment method (credit card)

### Step 2: Deploy New Server
1. Click **"Deploy +"** → **"Deploy New Server"**
2. **Choose Server**:
   - Server Type: **Cloud Compute - Shared CPU**
   - Location: Choose closest to you (e.g., **New York** or **Singapore**)
   
3. **Server Image**:
   - Operating System: **Ubuntu 22.04 LTS x64**
   
4. **Server Size**:
   - Plan: **$6/month** (2GB RAM, 1 CPU, 55GB SSD)
   - This is sufficient for your app
   
5. **Additional Features** (Optional):
   - ✅ Enable IPv6
   - ✅ Enable Auto Backups ($1.20/month - recommended)
   
6. **Server Hostname & Label**:
   - Hostname: `parallax-backend`
   - Label: `Parallax API Server`
   
7. Click **"Deploy Now"**

### Step 3: Wait for Server to Start
- Status will change from "Installing" to "Running" (1-2 minutes)
- Note down:
  - **IP Address**: e.g., `45.76.123.456`
  - **Username**: `root`
  - **Password**: (shown once, copy it!)

---

## Part 2: Connect to Your Server (2 minutes)

### Option A: Using Terminal (Mac/Linux)
```bash
ssh root@YOUR_SERVER_IP
# Enter password when prompted
```

### Option B: Using Vultr Console
1. In Vultr dashboard, click on your server
2. Click **"View Console"** button (top right)
3. Login with username `root` and the password

---

## Part 3: Automated Deployment (5 minutes)

Once connected to your server, run this ONE command:

```bash
curl -fsSL https://raw.githubusercontent.com/Shiva1803/DTUhackathon/master/backend/scripts/deploy.sh | bash
```

This script will:
- ✅ Install Node.js 18
- ✅ Install PM2
- ✅ Clone your repository
- ✅ Install dependencies
- ✅ Build TypeScript
- ✅ Start the application

### If the script asks for .env file:

The script will stop and ask you to create `.env` file. Do this:

```bash
cd /var/www/parallax-backend/backend
nano .env
```

Copy and paste this (Ctrl+Shift+V in terminal):

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

Save and exit:
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

Then run the deployment script again:
```bash
cd /var/www/parallax-backend/backend
bash ../scripts/deploy.sh
```

---

## Part 4: Verify Backend is Running (1 minute)

### Test from your server:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","uptime":123,...}
```

### Test from your computer:
```bash
curl http://YOUR_SERVER_IP:3001/health
```

If this doesn't work, you need to open the firewall (see Part 5).

---

## Part 5: Configure Firewall (2 minutes)

### Open required ports:
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3001/tcp  # Your API (temporary, will use Nginx later)
ufw enable
```

When asked "Command may disrupt existing ssh connections. Proceed with operation (y|n)?", type `y`

### Test again:
```bash
curl http://YOUR_SERVER_IP:3001/health
```

Should work now! ✅

---

## Part 6: Setup Domain (Optional but Recommended)

### If you have a domain:

1. **Add DNS A Record**:
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add A record:
     - Name: `api` (or `@` for root domain)
     - Value: `YOUR_SERVER_IP`
     - TTL: 300 (5 minutes)

2. **Wait for DNS propagation** (5-30 minutes)
   - Test: `ping api.yourdomain.com`

3. **Setup Nginx with SSL**:
   ```bash
   cd /var/www/parallax-backend/backend
   
   # Install Nginx
   apt install -y nginx
   
   # Copy nginx config
   cp nginx.conf /etc/nginx/sites-available/parallax-api
   
   # Edit the config to use your domain
   nano /etc/nginx/sites-available/parallax-api
   # Change "api.parallax.app" to "api.yourdomain.com"
   # Save and exit (Ctrl+X, Y, Enter)
   
   # Enable the site
   ln -s /etc/nginx/sites-available/parallax-api /etc/nginx/sites-enabled/
   
   # Test nginx config
   nginx -t
   
   # Restart nginx
   systemctl restart nginx
   
   # Get SSL certificate
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d api.yourdomain.com
   ```

4. **Your API is now available at**: `https://api.yourdomain.com`

### If you DON'T have a domain:

Your API will be available at: `http://YOUR_SERVER_IP:3001`

You can use this for now and add a domain later.

---

## Part 7: Update CORS for Frontend (After Vercel Deployment)

After you deploy frontend to Vercel and get your URL (e.g., `https://parallax-xyz.vercel.app`):

1. **SSH into your server**:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. **Update .env file**:
   ```bash
   cd /var/www/parallax-backend/backend
   nano .env
   ```

3. **Update CORS_ORIGIN line**:
   ```env
   CORS_ORIGIN=https://your-vercel-url.vercel.app,http://localhost:5173
   ```
   
   Replace `your-vercel-url` with your actual Vercel URL.

4. **Save and restart**:
   ```bash
   pm2 restart parallax-api
   ```

---

## Part 8: Useful Commands

### Check if backend is running:
```bash
pm2 status
```

### View logs:
```bash
pm2 logs parallax-api
```

### Restart backend:
```bash
pm2 restart parallax-api
```

### Stop backend:
```bash
pm2 stop parallax-api
```

### Update backend (after pushing new code to GitHub):
```bash
cd /var/www/parallax-backend
git pull origin master
cd backend
npm ci
npm run build
pm2 restart parallax-api
```

---

## 🎯 Summary

After completing these steps, you'll have:

✅ Backend running on Vultr at: `http://YOUR_SERVER_IP:3001`
✅ Health check: `http://YOUR_SERVER_IP:3001/health`
✅ PM2 managing the process
✅ Firewall configured
✅ (Optional) Domain with SSL: `https://api.yourdomain.com`

---

## 📝 Information for Frontend Deployment

When deploying frontend on Vercel, use these environment variables:

```
VITE_API_URL=http://YOUR_SERVER_IP:3001
VITE_AUTH0_DOMAIN=dev-yx6bvvjlq1p3lwvi.us.auth0.com
VITE_AUTH0_CLIENT_ID=bBPurXakQQEKIRCL7WUnar0PfUrWqqnt
VITE_AUTH0_AUDIENCE=https://myapp/api
```

Replace `YOUR_SERVER_IP` with your actual Vultr server IP.

If you setup a domain, use:
```
VITE_API_URL=https://api.yourdomain.com
```

---

## 🐛 Troubleshooting

### Backend not starting:
```bash
pm2 logs parallax-api --lines 100
```

### Port 3001 not accessible:
```bash
# Check if firewall is blocking
ufw status

# Check if app is listening
netstat -tulpn | grep 3001
```

### MongoDB connection issues:
```bash
# Test MongoDB connection
mongosh "mongodb+srv://amarnaniharsh_db_user:rKeJ7ZIGVXEbK64D@parallax.5h6prhb.mongodb.net/"
```

### Out of memory:
```bash
# Check memory usage
free -h

# Restart PM2
pm2 restart parallax-api
```

---

## 📞 Need Help?

- Check logs: `pm2 logs parallax-api`
- Check status: `pm2 status`
- Check health: `curl http://localhost:3001/health`

---

**Estimated Time**: 15-20 minutes
**Cost**: $6/month (Vultr) + $0 (Vercel free tier)

Good luck! 🚀
