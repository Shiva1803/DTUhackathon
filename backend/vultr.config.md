# Vultr/Render Deployment Configuration
# Use these settings when deploying to Vultr, Render, or similar platforms

## Build Settings
build_command: npm run build
start_command: node dist/server.js
node_version: 18

## Health Check
health_check_path: /health

## Docker Build (if using Docker)
dockerfile_path: ./Dockerfile
docker_context: .

## Environment Variables (set these in your platform's dashboard)
# See .env.example for the full list of required variables:
# - MONGO_URI
# - AUTH0_DOMAIN
# - AUTH0_AUDIENCE
# - AUTH0_CLIENT_ID
# - CLOUDINARY_URL
# - OND_CHAT_KEY
# - OND_CHAT_URL
# - OND_MEDIA_KEY
# - OND_MEDIA_URL
# - GEMINI_KEY
# - ELEVEN_KEY
# - PORT (usually auto-set by platform)
# - NODE_ENV=production
