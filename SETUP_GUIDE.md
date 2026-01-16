# GrowthAmp Setup Guide

## Current Status

✅ **Frontend** - Running at http://localhost:5173/
⚠️ **Backend** - Needs MongoDB connection

## What You Need to Configure

### 1. MongoDB Database

You need a MongoDB database. Options:

**Option A: MongoDB Atlas (Recommended - Free Tier)**
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `backend/.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/growthamp
   ```

**Option B: Local MongoDB**
1. Install MongoDB: `brew install mongodb-community` (macOS)
2. Start MongoDB: `brew services start mongodb-community`
3. Keep default: `MONGO_URI=mongodb://localhost:27017/growthamp`

### 2. Auth0 Configuration

1. Go to https://auth0.com and create an account
2. Create a new Application:
   - Type: Single Page Application
   - Name: GrowthAmp
3. Configure Application Settings:
   - Allowed Callback URLs: `http://localhost:5173`
   - Allowed Logout URLs: `http://localhost:5173`
   - Allowed Web Origins: `http://localhost:5173`
4. Create an API:
   - Name: GrowthAmp API
   - Identifier: `https://api.growthamp.com`
5. Update environment files:

**backend/.env:**
```
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.growthamp.com
AUTH0_CLIENT_ID=your-client-id
```

**frontend/.env:**
```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.growthamp.com
```

### 3. Optional Services

These enhance functionality but aren't required:

| Service | Purpose | Get Key |
|---------|---------|---------|
| Cloudinary | Audio file storage | https://cloudinary.com |
| Google Gemini | AI categorization | https://ai.google.dev |
| OnDemand Media | Audio transcription | https://on-demand.io |
| ElevenLabs | Text-to-speech | https://elevenlabs.io |

## Running the Application

### Start Backend
```bash
cd backend
npm run dev
```
Should show: `🚀 Server running on port 3001`

### Start Frontend
```bash
cd frontend
npm run dev
```
Should show: `Local: http://localhost:5173/`

## Testing the Application

1. Open http://localhost:5173/
2. You should see the landing page
3. Click "Log In" to authenticate via Auth0
4. After login, you'll be redirected back
5. Navigate to `/log` to record audio
6. Navigate to `/summary` to view insights

## Troubleshooting

### "MongoDB connection failed"
- Check your MONGO_URI is correct
- Ensure MongoDB is running (if local)
- Check network access in MongoDB Atlas

### "Auth0 error"
- Verify domain and client ID match
- Check callback URLs are configured
- Ensure API audience matches

### "CORS error"
- Backend CORS_ORIGIN should match frontend URL
- Default: `CORS_ORIGIN=http://localhost:5173`

### "Audio upload failed"
- Without Cloudinary/OnDemand, uploads use mock responses
- Check browser console for specific errors

## File Locations

| File | Purpose |
|------|---------|
| `backend/.env` | Backend configuration |
| `frontend/.env` | Frontend configuration |
| `backend/.env.example` | Backend template |
| `frontend/.env.example` | Frontend template |
