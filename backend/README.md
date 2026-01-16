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

## 🤖 OnDemand Agents Architecture

This platform is powered by intelligent AI agents built on **OnDemand.io APIs**.

### Active Agents

| Agent | ID | Purpose |
|-------|-----|---------|
| **TranscriptionAgent** | `transcription-whisper-v1` | Converts audio to text via OnDemand Media API |
| **CategorizationAgent** | `categorization-gemini-v2` | Classifies activities using Gemini AI |
| **SummarizationAgent** | `summary-narrative-v1` | Generates weekly insights + TTS audio |
| **ChatAgent** | `chat-gpt4o-v1` | Conversational AI via OnDemand Chat API |

### Stretch Goal Agents

| Agent | ID | Status |
|-------|-----|--------|
| **SchedulerAgent** | `scheduler-weekly-v1` | 🔮 Automated email summaries |
| **InsightsAgent** | `insights-trends-v1` | 🔮 Trend mining across users |

### Agent Flow
```
Audio Upload → TranscriptionAgent → CategorizationAgent → Database
                                                            ↓
User Query → ChatAgent ←─────────────────────────────────────┘
                                                            ↓
Weekly Trigger → SummarizationAgent → Narrative + TTS Audio
```

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
