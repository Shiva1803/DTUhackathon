# Complete API Reference & Testing Guide

This comprehensive guide documents **every API endpoint** in the platform with request/response examples, error codes, and a complete testing flow.

---

## 🔐 Authentication

All endpoints (except `/health`) require JWT authentication.

### Header Format
```
Authorization: Bearer <your_jwt_token>
```

### Mock Authentication (Development)
Set `MOCK_AUTH=true` in `.env` to bypass JWT validation. A mock user will be created automatically.

---

## 📊 API Endpoints Overview

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Health** | `/health` | GET | Server health check |
| **Auth** | `/api/auth/me` | GET | Get current user |
| **Auth** | `/api/auth/profile` | GET | Alias for /me |
| **Logs** | `/api/log` | POST | Upload audio log |
| **Logs** | `/api/log` | GET | List audio logs |
| **Logs** | `/api/log/:id` | GET | Get specific log |
| **Logs** | `/api/log/:id` | DELETE | Delete log |
| **Chat** | `/api/chat` | POST | Send chat message |
| **Chat** | `/api/chat/sessions` | POST | Create session |
| **Chat** | `/api/chat/sessions` | GET | List sessions |
| **Chat** | `/api/chat/sessions/:id` | GET | Get session history |
| **Chat** | `/api/chat/sessions/:id` | DELETE | Delete session |
| **Summary** | `/api/summary` | GET | List all summaries |
| **Summary** | `/api/summary/:weekId` | GET | Get week summary |
| **Summary** | `/api/summary/generate` | POST | Generate summary |
| **Audio** | `/api/audio-processing/upload` | POST | Upload & transcribe |
| **Audio** | `/api/audio-processing/logs` | GET | List audio logs |
| **Audio** | `/api/audio-processing/logs/:id` | GET | Get specific log |
| **Audio** | `/api/audio-processing/logs/:id` | DELETE | Delete log |
| **Audio** | `/api/audio-processing/summary/generate` | POST | Generate weekly summary |
| **Audio** | `/api/audio-processing/summary` | GET | Get weekly summary |

---

## 🏥 Health Check

### `GET /health`

**Access:** Public

**Response:**
```json
{
  "status": "ok",
  "uptime": 123,
  "timestamp": "2026-01-16T15:53:21.339Z",
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "auth": "configured",
    "storage": "configured",
    "chat": "configured",
    "media": "configured"
  }
}
```

**Test:**
```bash
curl http://localhost:3001/health
```

---

## 👤 Authentication Routes

### `GET /api/auth/me`

Get authenticated user's profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "auth0Id": "auth0|123456",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "lastLogin": "2026-01-16T10:00:00.000Z"
  },
  "message": "User profile retrieved successfully"
}
```

**Test:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎙️ Audio Log Routes (`/api/log`)

### `POST /api/log`

Upload audio file for transcription.

**Request:**
```
Content-Type: multipart/form-data
Field: audio (MP3, WAV - max 10MB)
```

**Response (200):**
```json
{
  "success": true,
  "message": "Log uploaded",
  "logId": "507f1f77bcf86cd799439011",
  "data": {
    "transcript": "Today I worked on the frontend code...",
    "duration": 30,
    "audioUrl": "https://res.cloudinary.com/...",
    "timestamp": "2026-01-16T10:00:00.000Z"
  }
}
```

**Error Codes:**
| Code | Description |
|------|-------------|
| `MISSING_FILE` | No audio file provided |
| `INVALID_FILE_TYPE` | File not MP3/WAV |
| `FILE_TOO_LARGE` | File exceeds 10MB |
| `TRANSCRIPTION_FAILURE` | Transcription API failed |

**Test:**
```bash
curl -X POST http://localhost:3001/api/log \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@/path/to/audio.mp3"
```

---

### `GET /api/log`

List audio logs with pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `startDate` | ISO date | - | Filter from date |
| `endDate` | ISO date | - | Filter to date |
| `category` | string | - | Filter by category |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "transcript": "Today I worked on...",
      "audioUrl": "https://...",
      "timestamp": "2026-01-16T10:00:00.000Z",
      "duration": 30
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Test:**
```bash
curl -X GET "http://localhost:3001/api/log?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### `GET /api/log/:id`

Get a specific audio log.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "transcript": "Today I worked on...",
    "audioUrl": "https://...",
    "timestamp": "2026-01-16T10:00:00.000Z",
    "duration": 30,
    "status": "success"
  }
}
```

**Test:**
```bash
curl -X GET http://localhost:3001/api/log/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### `DELETE /api/log/:id`

Delete an audio log.

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Audio log deleted successfully"
}
```

**Test:**
```bash
curl -X DELETE http://localhost:3001/api/log/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 💬 Chat Routes (`/api/chat`)

### `POST /api/chat`

Send a chat message and get AI response.

**Request Body:**
```json
{
  "message": "How productive was I this week?",
  "sessionId": "session_123456_abc" // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_123456_abc",
    "message": "Based on your logs, you were very productive...",
    "messageId": "507f1f77bcf86cd799439011",
    "tokens": 150,
    "model": "gpt-4o"
  },
  "message": "Chat response generated"
}
```

**Test:**
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

---

### `POST /api/chat/sessions`

Create a new chat session.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_1705414800000_a1b2c3d4e5f6g7h8"
  },
  "message": "Chat session created"
}
```

**Test:**
```bash
curl -X POST http://localhost:3001/api/chat/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### `GET /api/chat/sessions`

List recent chat sessions.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 10 | Max sessions to return |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "session_123456_abc",
      "lastMessage": "2026-01-16T10:00:00.000Z",
      "messageCount": 5,
      "preview": "Hello, how are you?"
    }
  ]
}
```

**Test:**
```bash
curl -X GET "http://localhost:3001/api/chat/sessions?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### `GET /api/chat/sessions/:sessionId`

Get chat history for a session.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Messages per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "sessionId": "session_123456_abc",
      "role": "user",
      "content": "Hello!",
      "timestamp": "2026-01-16T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "sessionId": "session_123456_abc",
      "role": "assistant",
      "content": "Hi there! How can I help you?",
      "timestamp": "2026-01-16T10:00:01.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "totalPages": 1
  }
}
```

**Test:**
```bash
curl -X GET http://localhost:3001/api/chat/sessions/session_123456_abc \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### `DELETE /api/chat/sessions/:sessionId`

Delete a chat session.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deletedCount": 5
  },
  "message": "Chat session deleted successfully"
}
```

**Test:**
```bash
curl -X DELETE http://localhost:3001/api/chat/sessions/session_123456_abc \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Summary Routes (`/api/summary`)

### `GET /api/summary`

List all weekly summaries.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Summaries per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "weekStart": "2026-01-13T00:00:00.000Z",
      "weekEnd": "2026-01-20T00:00:00.000Z",
      "metrics": {
        "totalLogs": 12,
        "categoryCounts": {
          "creation": 180,
          "consumption": 60,
          "learning": 90,
          "productivity": 120
        },
        "phase": "Growth"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Test:**
```bash
curl -X GET http://localhost:3001/api/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### `GET /api/summary/:weekId`

Get summary for a specific week.

**URL Params:**
- `weekId`: Format `YYYY-WNN` (e.g., `2026-W03`)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "weekId": "2026-W03",
    "weekStart": "2026-01-13T00:00:00.000Z",
    "weekEnd": "2026-01-20T00:00:00.000Z",
    "metrics": {
      "totalLogs": 12,
      "categoryCounts": {
        "creation": 180,
        "consumption": 60,
        "learning": 90,
        "productivity": 120
      },
      "phase": "Growth",
      "totalHours": 7.5
    },
    "story": "{\"headline\":\"Builder Mode Activated!\",\"text\":\"Amazing week...\"}",
    "ttsUrl": "https://res.cloudinary.com/.../summary.mp3",
    "generatedAt": "2026-01-16T10:00:00.000Z",
    "isComplete": true
  },
  "message": "Weekly summary retrieved successfully"
}
```

**Test:**
```bash
curl -X GET http://localhost:3001/api/summary/2026-W03 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### `POST /api/summary/generate`

Manually trigger summary generation.

**Request Body:**
```json
{
  "weekStart": "2026-01-13"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "story": {
      "headline": "🚀 Builder Mode Activated!",
      "text": "Amazing week! You spent 3 hours creating..."
    },
    "ttsUrl": "https://res.cloudinary.com/.../summary.mp3",
    "generatedAt": "2026-01-16T10:00:00.000Z"
  },
  "message": "Summary generated successfully"
}
```

**Test:**
```bash
curl -X POST http://localhost:3001/api/summary/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weekStart": "2026-01-13"}'
```

---

## 🎵 Audio Processing Routes (`/api/audio-processing`)

### `POST /api/audio-processing/upload`

Upload and process audio file (Cloudinary + Transcription).

**Request:**
```
Content-Type: multipart/form-data
Field: audio (webm, wav, mp3, ogg, flac, m4a - max 50MB)
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "audioLogId": "507f1f77bcf86cd799439011",
    "transcript": "Today I worked on the login feature...",
    "audioUrl": "https://res.cloudinary.com/...",
    "duration": 45
  },
  "message": "Audio processed successfully"
}
```

**Test:**
```bash
curl -X POST http://localhost:3001/api/audio-processing/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@/path/to/audio.mp3"
```

---

### `GET /api/audio-processing/logs`

List audio processing logs with filters.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Logs per page |
| `startDate` | ISO date | - | Filter from date |
| `endDate` | ISO date | - | Filter to date |
| `status` | string | - | `success` or `failed` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "transcript": "Today I worked on...",
      "audioUrl": "https://...",
      "timestamp": "2026-01-16T10:00:00.000Z",
      "duration": 45,
      "status": "success"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "totalPages": 1
  },
  "message": "Audio logs retrieved successfully"
}
```

**Test:**
```bash
curl -X GET "http://localhost:3001/api/audio-processing/logs?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### `GET /api/audio-processing/logs/:id`

Get specific audio log by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "transcript": "Today I worked on...",
    "audioUrl": "https://...",
    "timestamp": "2026-01-16T10:00:00.000Z",
    "duration": 45,
    "status": "success",
    "metadata": {
      "language": "en",
      "confidence": 0.95
    }
  },
  "message": "Audio log retrieved successfully"
}
```

**Test:**
```bash
curl -X GET http://localhost:3001/api/audio-processing/logs/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### `DELETE /api/audio-processing/logs/:id`

Delete audio log (also removes from Cloudinary).

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Audio log deleted successfully"
}
```

**Test:**
```bash
curl -X DELETE http://localhost:3001/api/audio-processing/logs/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### `POST /api/audio-processing/summary/generate`

Generate weekly summary from audio logs.

**Request Body (optional):**
```json
{
  "date": "2026-01-16"  // Optional, defaults to current week
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "_id": "507f1f77bcf86cd799439011",
      "weekStart": "2026-01-13T00:00:00.000Z",
      "weekEnd": "2026-01-20T00:00:00.000Z",
      "metrics": {...}
    },
    "story": {
      "headline": "🚀 Builder Mode Activated!",
      "text": "Amazing week! You spent 3 hours creating..."
    },
    "ttsUrl": "https://res.cloudinary.com/.../summary.mp3",
    "phase": "Growth",
    "categoryHours": {
      "creation": 3.0,
      "consumption": 0.5,
      "learning": 1.5,
      "productivity": 2.0
    }
  },
  "message": "Weekly summary generated successfully"
}
```

**Error Codes:**
| Code | Description |
|------|-------------|
| `NO_LOGS` | No audio logs found for this week |
| `INTERNAL_ERROR` | Server error |

**Test:**
```bash
curl -X POST http://localhost:3001/api/audio-processing/summary/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### `GET /api/audio-processing/summary`

Get weekly summary for a specific date.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `date` | ISO date | today | Target date (finds week containing this date) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "weekStart": "2026-01-13T00:00:00.000Z",
    "weekEnd": "2026-01-20T00:00:00.000Z",
    "metrics": {...},
    "story": "{\"headline\":\"...\",\"text\":\"...\"}",
    "ttsUrl": "https://...",
    "generatedAt": "2026-01-16T10:00:00.000Z"
  },
  "message": "Weekly summary retrieved successfully"
}
```

**Test:**
```bash
curl -X GET "http://localhost:3001/api/audio-processing/summary?date=2026-01-16" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚨 Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Description of the error",
    "statusCode": 400,
    "code": "ERROR_CODE"
  }
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `BAD_REQUEST` | Invalid request body or params |
| 400 | `VALIDATION_ERROR` | Validation failed |
| 400 | `MISSING_FILE` | No file uploaded |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 422 | `CLOUDINARY_UPLOAD_FAILED` | File upload failed |
| 422 | `PROCESSING_FAILED` | Audio processing failed |
| 500 | `INTERNAL_ERROR` | Server error |

---

## 🔄 Complete Testing Flow

### Step 1: Health Check
```bash
curl http://localhost:3001/health
```

### Step 2: Get Auth Profile (with Mock Auth)
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer mock"
```

### Step 3: Upload Audio
```bash
curl -X POST http://localhost:3001/api/audio-processing/upload \
  -H "Authorization: Bearer mock" \
  -F "audio=@sample.mp3"
```

### Step 4: List Logs
```bash
curl -X GET http://localhost:3001/api/audio-processing/logs \
  -H "Authorization: Bearer mock"
```

### Step 5: Generate Summary
```bash
curl -X POST http://localhost:3001/api/audio-processing/summary/generate \
  -H "Authorization: Bearer mock" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Step 6: Get Summary
```bash
curl -X GET http://localhost:3001/api/audio-processing/summary \
  -H "Authorization: Bearer mock"
```

### Step 7: Chat
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer mock" \
  -H "Content-Type: application/json" \
  -d '{"message": "How productive was I this week?"}'
```

### Step 8: List Chat Sessions
```bash
curl -X GET http://localhost:3001/api/chat/sessions \
  -H "Authorization: Bearer mock"
```

---

## 🏃 Running the Server

```bash
# Development (with mock auth)
MOCK_AUTH=true npm run dev

# Production
npm start
```

**Base URL:** `http://localhost:3001`
