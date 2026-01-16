# Backend API

Express.js + TypeScript backend with MongoDB, Auth0 authentication, and OnDemand AI APIs.

## Quick Start

```bash
# Clone and navigate
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

Server runs at `http://localhost:3001`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `AUTH0_DOMAIN` | ✅ | Auth0 tenant domain |
| `AUTH0_AUDIENCE` | ✅ | Auth0 API identifier |
| `AUTH0_CLIENT_ID` | ✅ | Auth0 client ID |
| `CLOUDINARY_URL` | ⚠️ | Cloudinary URL for audio storage |
| `OND_CHAT_KEY` | ⚠️ | OnDemand Chat API key |
| `OND_MEDIA_KEY` | ⚠️ | OnDemand Media API key |
| `GEMINI_KEY` | ❌ | Google Gemini API key |
| `ELEVEN_KEY` | ❌ | Eleven Labs TTS key |
| `PORT` | ❌ | Server port (default: 3001) |

---

## Commands

```bash
npm run dev      # Development with hot reload
npm run build    # Compile TypeScript
npm start        # Production server
npm run lint     # Run ESLint
npm run typecheck # Type check without emit
```

---

## API Documentation

### Health Check

```
GET /health
```

Returns `{ status: 'ok', uptime: 123, services: {...} }`

---

### Authentication

All endpoints except `/health` require JWT in Authorization header:
```
Authorization: Bearer <token>
```

#### Get Current User
```
GET /api/auth/me
```
Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Audio Logs

#### Upload Audio
```
POST /api/log
Content-Type: multipart/form-data

Field: audio (MP3 or WAV, max 10MB)
```
Response:
```json
{
  "success": true,
  "message": "Log uploaded",
  "logId": "...",
  "data": {
    "transcript": "...",
    "audioUrl": "...",
    "duration": 30
  }
}
```

#### List Logs
```
GET /api/log?page=1&limit=20
```

#### Get Single Log
```
GET /api/log/:id
```

#### Delete Log
```
DELETE /api/log/:id
```

---

### Chat

#### Send Message
```
POST /api/chat
Content-Type: application/json

{
  "message": "Hello!",
  "sessionId": "optional-session-id"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "message": "AI response here",
    "messageId": "..."
  }
}
```

#### List Sessions
```
GET /api/chat/sessions
```

#### Get Session History
```
GET /api/chat/sessions/:sessionId
```

#### Delete Session
```
DELETE /api/chat/sessions/:sessionId
```

---

### Weekly Summaries

#### Get Summary
```
GET /api/summary/:weekId
```
`weekId` format: `YYYY-WNN` (e.g., `2024-W01`)

#### List All Summaries
```
GET /api/summary
```

#### Generate Summary
```
POST /api/summary/generate
Content-Type: application/json

{
  "weekStart": "2024-01-01"
}
```

---

## Deployment

### Docker

```bash
docker build -t backend .
docker run -p 3001:3001 --env-file .env backend
```

### Railway

Push to GitHub connected to Railway. Uses `railway.json` config.

### Other Platforms

- **Build**: `npm run build`
- **Start**: `node dist/server.js`
- **Health**: `GET /health`

---

## Project Structure

```
src/
├── config/        # Database, Auth0 config
├── middleware/    # Auth, error handling
├── models/        # Mongoose models
├── routes/        # API routes
├── services/      # Business logic
├── utils/         # Logger, response helpers
├── app.ts         # Express setup
└── server.ts      # Entry point
```

---

## Error Responses

All errors return:
```json
{
  "success": false,
  "error": {
    "message": "Description",
    "statusCode": 400,
    "code": "ERROR_CODE"
  }
}
```

| Code | Description |
|------|-------------|
| 400 | Bad request / validation error |
| 401 | Unauthorized / invalid token |
| 403 | Forbidden / insufficient permissions |
| 404 | Resource not found |
| 500 | Server error |

---

## OnDemand AI Agents

This application integrates **6 OnDemand AI agents** to meet hackathon criteria:

### Core Agents (6 Total)

| # | Agent | Function | API Used | Trigger |
|---|-------|----------|----------|---------|
| 1 | **TranscriptionAgent** | Converts audio to text | OnDemand Media API | Audio upload |
| 2 | **CategorizationAgent** | Categorizes transcripts | Gemini 2.5 Flash | After transcription |
| 3 | **SummarizationAgent** | Generates weekly narrative | Gemini + ElevenLabs | Summary request |
| 4 | **ChatAgent** | Conversational AI queries | OnDemand Chat API | Chat message |
| 5 | **StreakAgent** | Tracks user engagement | MongoDB + Logic | Log upload |
| 6 | **ShareCardAgent** | Generates shareable images | Canvas + Cloudinary | Share request |

### Tool Integrations (4 Types)

| # | Tool | Purpose | API/SDK |
|---|------|---------|---------|
| 1 | **Speech-to-Text** | Audio transcription | OnDemand Media API |
| 2 | **Chat AI** | Conversational responses | OnDemand Chat API |
| 3 | **Text Generation** | Categorization & summarization | Google Gemini API |
| 4 | **Text-to-Speech** | Audio summaries | ElevenLabs API |

### Agent Details

#### 1. TranscriptionAgent
- **API**: OnDemand Media API (`speech_to_text`)
- **Endpoint**: `POST https://api.on-demand.io/services/v1/public/service/execute/speech_to_text`
- **Input**: Audio URL (from Cloudinary)
- **Output**: Transcript text
- **File**: `audio.service.ts` → `transcribeAudioFromUrl()`

#### 2. CategorizationAgent
- **API**: Gemini 2.5 Flash
- **Function**: Analyzes transcripts for category, sentiment, and keywords
- **Categories**: health, work, personal, family, social, finance, learning, other
- **File**: `ai.service.ts` → `categorizeTranscript()`

#### 3. SummarizationAgent
- **API**: Gemini 2.5 Flash + ElevenLabs TTS
- **Function**: Generates personalized weekly story narrative
- **Output**: Story text + optional TTS audio URL
- **File**: `ai.service.ts` → `generateWeeklySummary()`

#### 4. ChatAgent
- **API**: OnDemand Chat API (GPT-4o)
- **Endpoint**: `POST https://api.on-demand.io/chat/v1/sessions/{sessionId}/query`
- **Features**: Context-aware responses, follow-up suggestions
- **File**: `chat.service.ts` → `sendMessage()`

#### 5. StreakAgent
- **Logic**: Tracks consecutive days of logging
- **Function**: Updates user streak count on each log
- **Rules**: Increments if logged yesterday, resets if >24h gap
- **File**: `User.ts` → `updateStreak()` method

#### 6. ShareCardAgent
- **API**: Node Canvas + Cloudinary
- **Function**: Generates beautiful shareable image cards
- **Output**: PNG image URL with stats overlay
- **File**: `share.service.ts` → `generateShareCard()`

### API Endpoints

| Endpoint | Agent(s) Used |
|----------|---------------|
| `POST /api/log` | TranscriptionAgent, CategorizationAgent, StreakAgent |
| `GET /api/summary/:weekId` | SummarizationAgent |
| `POST /api/chat` | ChatAgent |
| `POST /api/share/card` | ShareCardAgent |

### Agent Configuration

```bash
# Required API Keys
OND_CHAT_KEY=your_chat_api_key      # ChatAgent
OND_MEDIA_KEY=your_media_api_key    # TranscriptionAgent
GEMINI_KEY=your_gemini_key          # CategorizationAgent, SummarizationAgent
ELEVEN_KEY=your_elevenlabs_key      # SummarizationAgent TTS
CLOUDINARY_URL=cloudinary://...     # TranscriptionAgent, ShareCardAgent
```
