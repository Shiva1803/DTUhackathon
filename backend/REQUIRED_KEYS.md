# Required API Keys & Services

To test **all** features of the platform, you will need valid credentials for the following services. Add these to your `.env` file.

## 1. Core Infrastructure

### MongoDB
- **Variable**: `MONGO_URI`
- **Purpose**: Primary database for storing users, logs, and chats.
- **Where to get**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)
- **Example**: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

### Auth0 (Authentication)
- **Variables**: 
  - `AUTH0_DOMAIN`
  - `AUTH0_AUDIENCE`
  - `AUTH0_CLIENT_ID`
- **Purpose**: Secure user login and JWT generation.
- **Where to get**: [Auth0 Dashboard](https://auth0.com/)
- **Setup**: Create a "Single Page App" application and an "API" in Auth0.

---

## 2. Media & Storage

### Cloudinary
- **Variable**: `CLOUDINARY_URL`
- **Purpose**: Storing uploaded audio files securely.
- **Where to get**: [Cloudinary Console](https://cloudinary.com/)
- **Format**: `cloudinary://api_key:api_secret@cloud_name`
- **Impact**: Without this, audio uploads will fail (unless you implement local storage fallback).

---

## 3. OnDemand AI Layers (Critical)

### OnDemand Chat
- **Variable**: `OND_CHAT_KEY`
- **Purpose**: Powers the conversational AI assistant (`/api/chat`).
- **Where to get**: [OnDemand Platform](https://on-demand.io/)
- **Setup**: Create a Chat Plugin/Agent in OnDemand and get the API key.

### OnDemand Media
- **Variable**: `OND_MEDIA_KEY`
- **Purpose**: Transcribing user audio logs into text (`/api/log`).
- **Where to get**: [OnDemand Platform](https://on-demand.io/)

---

## 4. Advanced AI Features

### Google Gemini
- **Variable**: `GEMINI_KEY`
- **Purpose**: used in `ai.service.ts` for:
  - Categorizing audio logs (e.g., "Work", "Personal").
  - Generating weekly narrative summaries.
- **Where to get**: [Google AI Studio](https://aistudio.google.com/)

### ElevenLabs (Optional)
- **Variable**: `ELEVEN_KEY`
- **Purpose**: Generating Text-to-Speech (TTS) audio for weekly summaries (so users can *listen* to their summary).
- **Where to get**: [ElevenLabs](https://elevenlabs.io/)
- **Impact**: If missing, the `ttsUrl` field in summaries will be null, but text summaries will still work.

---

## Summary Checklist

| Service | Keys Needed | Crucial For |
|---------|-------------|-------------|
| **MongoDB** | `MONGO_URI` | **Everything** |
| **Auth0** | `AUTH0_DOM/AUD/ID` | **Login / Security** |
| **Cloudinary** | `CLOUDINARY_URL` | **Audio Uploads** |
| **OnDemand Chat** | `OND_CHAT_KEY` | **Chat Assistant** |
| **OnDemand Media** | `OND_MEDIA_KEY` | **Transcription** |
| **Google Gemini** | `GEMINI_KEY` | **Categorization & Summaries** |
| **ElevenLabs** | `ELEVEN_KEY` | **TTS Audio Summaries** |
