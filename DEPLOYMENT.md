# Parallax - Deployment Guide

Complete deployment guide for production environment.

## 🚀 Quick Deploy

### Backend (Vultr VPS)
```bash
# On your Vultr instance
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/Shiva1803/DTUhackathon/master/backend/scripts/deploy.sh)"
```

### Frontend (Vercel)
```bash
# One-click deploy
vercel --prod
```

---

## 📋 Prerequisites

### Backend Requirements
- Vultr VPS (Ubuntu 20.04+, 2GB RAM minimum)
- Node.js 18+
- MongoDB Atlas account
- Domain name (optional but recommended)

### Frontend Requirements
- Vercel account (free tier works)
- Auth0 application configured

### Required API Keys
- Auth0 (Domain, Client ID, Audience)
- MongoDB Atlas connection string
- Cloudinary (for audio storage)
- Google Gemini API key
- OnDemand API keys (Media & Chat)
- ElevenLabs API key (optional)

---

## 🔧 Backend Deployment (Vultr)

### Step 1: Provision Vultr Instance

1. Go to [Vultr.com](https://vultr.com)
2. Deploy New Instance
3. Choose:
   - **Server Type**: Cloud Compute - Shared CPU
   - **Location**: Closest to your users
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: $6/month (2GB RAM, 1 CPU)
4. Add SSH key or use password
5. Deploy!

### Step 2: Initial Server Setup

SSH into your server:
```bash
ssh root@YOUR_SERVER_IP
```

Update system:
```bash
apt update && apt upgrade -y
```

### Step 3: Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node -v  # Should show v18.x.x
```

### Step 4: Install PM2

```bash
npm install -g pm2
pm2 startup systemd
```

### Step 5: Clone Repository

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/Shiva1803/DTUhackathon.git parallax-backend
cd parallax-backend/backend
```

### Step 6: Configure Environment

Create `.env` file:
```bash
nano .env
```

Add your environment variables:
```env
# Server
NODE_ENV=production
PORT=3001

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/parallax

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.parallax.app

# Cloudinary
CLOUDINARY_URL=cloudinary://key:secret@cloud_name

# AI Services
GEMINI_KEY=your-gemini-key
OND_MEDIA_KEY=your-ondemand-media-key
OND_CHAT_KEY=your-ondemand-chat-key
ELEVEN_KEY=your-elevenlabs-key

# CORS (add your frontend URL)
CORS_ORIGIN=https://parallax.vercel.app,https://www.parallax.app
```

Save and exit (Ctrl+X, Y, Enter)

### Step 7: Install Dependencies & Build

```bash
npm ci
npm run build
```

### Step 8: Start with PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 9: Setup Nginx (Optional but Recommended)

Install Nginx:
```bash
apt install -y nginx
```

Copy nginx config:
```bash
cp nginx.conf /etc/nginx/sites-available/parallax-api
ln -s /etc/nginx/sites-available/parallax-api /etc/nginx/sites-enabled/
```

Edit the config:
```bash
nano /etc/nginx/sites-available/parallax-api
# Replace api.parallax.app with your domain
```

Test and restart:
```bash
nginx -t
systemctl restart nginx
```

### Step 10: Setup SSL with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.parallax.app
```

### Step 11: Configure Firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Step 12: Test Deployment

```bash
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

If using domain:
```bash
curl https://api.parallax.app/health
```

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Configure Environment Variables

Create `frontend/.env.production`:
```env
VITE_API_URL=https://api.parallax.app
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.parallax.app
```

### Step 4: Deploy to Vercel

From the `frontend` directory:
```bash
cd frontend
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **parallax**
- Directory? **./frontend**
- Override settings? **N**

### Step 5: Add Environment Variables in Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `VITE_API_URL` = `https://api.parallax.app`
   - `VITE_AUTH0_DOMAIN` = `your-tenant.auth0.com`
   - `VITE_AUTH0_CLIENT_ID` = `your-client-id`
   - `VITE_AUTH0_AUDIENCE` = `https://api.parallax.app`

### Step 6: Redeploy

```bash
vercel --prod
```

---

## 🔐 Auth0 Configuration

### Update Allowed URLs

In your Auth0 Application settings, add:

**Allowed Callback URLs:**
```
https://parallax.vercel.app,
https://www.parallax.app,
http://localhost:5173
```

**Allowed Logout URLs:**
```
https://parallax.vercel.app,
https://www.parallax.app,
http://localhost:5173
```

**Allowed Web Origins:**
```
https://parallax.vercel.app,
https://www.parallax.app,
http://localhost:5173
```

**Allowed Origins (CORS):**
```
https://parallax.vercel.app,
https://www.parallax.app,
http://localhost:5173
```

---

## 🧪 Testing Deployment

### Backend Health Check
```bash
curl https://api.parallax.app/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 123,
  "timestamp": "2026-01-17T...",
  "environment": "production",
  "services": {
    "database": "connected",
    "auth": "configured",
    "storage": "configured"
  }
}
```

### Frontend Test
1. Visit `https://parallax.vercel.app`
2. Click "Login"
3. Authenticate with Auth0
4. Try recording an audio log
5. Check if it appears in History
6. View Summary page

### API Endpoints Test
```bash
# Get access token from Auth0
TOKEN="your-jwt-token"

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://api.parallax.app/api/auth/me
```

---

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 monit              # Real-time monitoring
pm2 logs parallax-api  # View logs
pm2 status             # Check status
```

### Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Application Logs
```bash
tail -f /var/www/parallax-backend/backend/logs/combined.log
tail -f /var/www/parallax-backend/backend/logs/error.log
```

---

## 🔄 Updates & Maintenance

### Update Backend
```bash
cd /var/www/parallax-backend
git pull origin master
cd backend
npm ci
npm run build
pm2 reload parallax-api
```

### Update Frontend
```bash
cd frontend
git pull origin master
vercel --prod
```

### Backup Database
```bash
# MongoDB Atlas has automatic backups
# Or use mongodump:
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)
```

---

## 🐛 Troubleshooting

### Backend not starting
```bash
pm2 logs parallax-api --lines 100
# Check for missing environment variables or MongoDB connection issues
```

### CORS errors
- Verify `CORS_ORIGIN` in backend `.env` includes your frontend URL
- Check Auth0 allowed origins

### 502 Bad Gateway
```bash
# Check if PM2 is running
pm2 status

# Restart if needed
pm2 restart parallax-api

# Check Nginx config
nginx -t
```

### Database connection issues
- Verify MongoDB Atlas IP whitelist includes your server IP
- Test connection: `mongosh "your-mongodb-uri"`

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Shiva1803/DTUhackathon/issues)
- **Documentation**: [README.md](./README.md)

---

## 🎯 Production Checklist

- [ ] Backend deployed on Vultr
- [ ] Frontend deployed on Vercel
- [ ] SSL certificates configured
- [ ] Environment variables set
- [ ] Auth0 URLs updated
- [ ] Database indices created
- [ ] CORS configured correctly
- [ ] Health checks passing
- [ ] Logs accessible
- [ ] Monitoring setup
- [ ] Backup strategy in place
