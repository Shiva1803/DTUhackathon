#!/bin/bash

# ===========================================
# Parallax Backend Deployment Script
# For Vultr VPS or similar Ubuntu/Debian servers
# ===========================================

set -e  # Exit on error

echo "🚀 Starting Parallax Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/parallax-backend"
REPO_URL="https://github.com/Shiva1803/DTUhackathon.git"
BRANCH="master"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo)${NC}"
  exit 1
fi

# ===========================================
# Step 1: System Updates & Dependencies
# ===========================================
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"

apt-get update
apt-get install -y curl git nginx certbot python3-certbot-nginx

# Install Node.js 18 if not present
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}📦 Installing Node.js 18...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}📦 Installing PM2...${NC}"
  npm install -g pm2
fi

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo -e "${GREEN}✅ NPM version: $(npm -v)${NC}"
echo -e "${GREEN}✅ PM2 version: $(pm2 -v)${NC}"

# ===========================================
# Step 2: Clone/Update Repository
# ===========================================
echo -e "${YELLOW}📥 Setting up application directory...${NC}"

if [ -d "$APP_DIR" ]; then
  echo "Updating existing repository..."
  cd $APP_DIR
  git fetch origin
  git checkout $BRANCH
  git pull origin $BRANCH
else
  echo "Cloning repository..."
  mkdir -p /var/www
  git clone $REPO_URL $APP_DIR
  cd $APP_DIR
  git checkout $BRANCH
fi

cd $APP_DIR/backend

# ===========================================
# Step 3: Install Dependencies & Build
# ===========================================
echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
npm ci --production=false

echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
npm run build

# Prune dev dependencies
npm prune --production

# ===========================================
# Step 4: Environment Variables Check
# ===========================================
echo -e "${YELLOW}🔐 Checking environment variables...${NC}"

if [ ! -f ".env" ]; then
  echo -e "${RED}❌ .env file not found!${NC}"
  echo "Please create .env file with required variables:"
  echo "  - MONGO_URI"
  echo "  - AUTH0_DOMAIN"
  echo "  - AUTH0_AUDIENCE"
  echo "  - CLOUDINARY_URL"
  echo "  - GEMINI_KEY"
  echo "  - OND_MEDIA_KEY"
  echo "  - OND_CHAT_KEY"
  echo "  - CORS_ORIGIN (your frontend URL)"
  exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"

# ===========================================
# Step 5: Create logs directory
# ===========================================
mkdir -p logs
chown -R www-data:www-data logs

# ===========================================
# Step 6: Start/Restart with PM2
# ===========================================
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"

# Stop existing process if running
pm2 stop parallax-api 2>/dev/null || true
pm2 delete parallax-api 2>/dev/null || true

# Start with ecosystem config
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}✅ Application started with PM2${NC}"

# ===========================================
# Step 7: Health Check
# ===========================================
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5

HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✅ Health check passed!${NC}"
else
  echo -e "${RED}❌ Health check failed:${NC}"
  echo "$HEALTH_RESPONSE"
  pm2 logs parallax-api --lines 50
  exit 1
fi

# ===========================================
# Step 8: Display Status
# ===========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "Useful commands:"
echo "  pm2 logs parallax-api     - View logs"
echo "  pm2 restart parallax-api  - Restart app"
echo "  pm2 monit                 - Monitor resources"
echo ""
echo "API is running at: http://localhost:3001"
echo "Health check: http://localhost:3001/health"
