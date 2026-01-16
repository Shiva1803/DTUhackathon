#!/bin/bash

# =========================================
# GrowthAmp Backend Deployment Script
# Run this on your Vultr instance
# =========================================

set -e

echo "🚀 Starting GrowthAmp Backend Deployment..."

# Configuration
APP_DIR="/home/deploy/DTUhackathon/backend"
REPO_URL="https://github.com/YOUR_USERNAME/DTUhackathon.git"
BRANCH="main"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =========================================
# Step 1: System Dependencies
# =========================================
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install build essentials (for native modules like canvas)
sudo apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo -e "${GREEN}✓ npm $(npm -v)${NC}"
echo -e "${GREEN}✓ PM2 $(pm2 -v)${NC}"

# =========================================
# Step 2: Clone/Update Repository
# =========================================
echo -e "${YELLOW}📁 Setting up application...${NC}"

# Create deploy user directory if not exists
sudo mkdir -p /home/deploy
sudo chown $USER:$USER /home/deploy

# Clone or pull repository
if [ -d "$APP_DIR" ]; then
    echo "Repository exists, pulling latest..."
    cd "$APP_DIR"
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    cd /home/deploy
    git clone $REPO_URL
    cd "$APP_DIR"
fi

# =========================================
# Step 3: Install Dependencies & Build
# =========================================
echo -e "${YELLOW}🔧 Installing dependencies...${NC}"

npm ci --production=false
npm run build

# =========================================
# Step 4: Environment Configuration
# =========================================
echo -e "${YELLOW}⚙️ Checking environment...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env with your production values:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

echo -e "${GREEN}✓ .env file exists${NC}"

# =========================================
# Step 5: Create Logs Directory
# =========================================
mkdir -p /home/deploy/logs

# =========================================
# Step 6: Start with PM2
# =========================================
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"

# Stop existing instance if running
pm2 stop growthamp-api 2>/dev/null || true
pm2 delete growthamp-api 2>/dev/null || true

# Start new instance
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u $USER --hp /home/$USER

# =========================================
# Step 7: Verify Deployment
# =========================================
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"

sleep 5

HEALTH_CHECK=$(curl -s http://localhost:3001/health)
if echo "$HEALTH_CHECK" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}Health check: $HEALTH_CHECK${NC}"
else
    echo -e "${RED}❌ Health check failed!${NC}"
    echo "$HEALTH_CHECK"
    pm2 logs growthamp-api --lines 20
    exit 1
fi

# =========================================
# Step 8: Display Status
# =========================================
echo ""
echo "==========================================="
echo -e "${GREEN}🎉 GrowthAmp API is running!${NC}"
echo "==========================================="
pm2 status
echo ""
echo "Useful commands:"
echo "  pm2 logs growthamp-api    - View logs"
echo "  pm2 restart growthamp-api - Restart app"
echo "  pm2 monit                 - Monitor resources"
