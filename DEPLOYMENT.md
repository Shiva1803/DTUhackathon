# Deployment Guide

This guide covers deploying the GrowthAmp application to production.

## Quick Links

| Service | Platform | URL |
|---------|----------|-----|
| Backend | Vultr/Railway | `https://api.yourdomain.com` |
| Frontend | Vercel | `https://yourdomain.com` |
| Database | MongoDB Atlas | `mongodb+srv://...` |

---

## Backend Deployment (Vultr)

### Option 1: Docker Deployment

```bash
# Build the image
docker build -t growthamp-backend .

# Push to registry
docker tag growthamp-backend your-registry/growthamp-backend
docker push your-registry/growthamp-backend

# On Vultr instance
docker pull your-registry/growthamp-backend
docker run -d \
  --name backend \
  -p 3001:3001 \
  --env-file .env \
  your-registry/growthamp-backend
```

### Option 2: Direct Node.js

```bash
# On Vultr instance
git clone https://github.com/yourrepo/DTUhackathon.git
cd DTUhackathon/backend

# Install and build
npm ci --production=false
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/server.js --name growthamp-api

# Save PM2 process list
pm2 save
pm2 startup
```

### Environment Variables

Create `.env` on the server with:

```bash
NODE_ENV=production
PORT=3001

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/growthamp

# Auth0
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://myapp/api
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# Storage & AI
CLOUDINARY_URL=cloudinary://key:secret@cloud
OND_CHAT_KEY=your_ondemand_chat_key
OND_MEDIA_KEY=your_ondemand_media_key
GEMINI_KEY=your_gemini_key
ELEVEN_KEY=your_elevenlabs_key

# CORS - Set to your frontend domain
CORS_ORIGIN=https://yourdomain.com
```

### Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Frontend Deployment (Vercel)

### Step 1: Configure Environment

Create `.env.production` in frontend directory:

```bash
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://myapp/api
VITE_API_URL=https://api.yourdomain.com
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# For production
vercel --prod
```

### Step 3: Configure Vercel

In Vercel dashboard, add environment variables:
- `VITE_AUTH0_DOMAIN`
- `VITE_AUTH0_CLIENT_ID`
- `VITE_AUTH0_AUDIENCE`
- `VITE_API_URL`

---

## Auth0 Configuration

Update Auth0 Application Settings with production URLs:

| Field | Values |
|-------|--------|
| Allowed Callback URLs | `https://yourdomain.com, https://yourdomain.com/callback` |
| Allowed Logout URLs | `https://yourdomain.com` |
| Allowed Web Origins | `https://yourdomain.com` |

---

## Database Setup (MongoDB Atlas)

1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Add database user with readWrite permissions
3. Whitelist Vultr server IP (or use 0.0.0.0/0 for testing)
4. Copy connection string to `MONGO_URI`

### Indexes (Auto-created)

- `AudioLog`: `{ userId: 1, timestamp: -1 }`
- `Summary`: `{ userId: 1, weekStart: 1 }` (unique)
- `User`: `{ auth0Id: 1 }`, `{ email: 1 }`

---

## SSL/HTTPS

### Vultr (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Vercel

SSL is automatic for Vercel deployments.

---

## Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Expected response
{
  "status": "ok",
  "uptime": 12345,
  "services": {
    "database": "connected",
    "auth": "configured",
    "storage": "configured",
    "chat": "configured",
    "media": "configured"
  }
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Check `CORS_ORIGIN` in backend `.env` |
| Auth0 callback error | Verify callback URLs in Auth0 dashboard |
| Database connection | Check MongoDB Atlas IP whitelist |
| API 500 errors | Check backend logs: `pm2 logs growthamp-api` |
