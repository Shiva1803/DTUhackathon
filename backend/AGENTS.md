# OnDemand Agents Configuration

This document describes the OnDemand AI agents used in the GrowthAmp application for the DTU Hackathon submission.

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GrowthAmp App                            │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)                                               │
│  ├── DailyLog → Audio Recording                                 │
│  ├── Summary → Weekly Insights                                  │
│  └── Chat → AI Coach Conversations                              │
├─────────────────────────────────────────────────────────────────┤
│  Backend (Express API)                                          │
│  ├── /api/log   → TranscriptionAgent + CategorizationAgent     │
│  ├── /api/summary → SummarizationAgent                         │
│  └── /api/chat  → ChatAgent                                     │
├─────────────────────────────────────────────────────────────────┤
│  OnDemand Services                                              │
│  ├── Media API (Transcription)                                  │
│  ├── Chat API (Conversations)                                   │
│  ├── Gemini API (Categorization & Summarization)               │
│  └── ElevenLabs API (Text-to-Speech)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Agents

### 1. TranscriptionAgent

**Purpose:** Converts audio recordings to text transcripts.

**Trigger:** New audio upload to `/api/log`

**API Used:** OnDemand Media API

**Implementation:** `backend/src/services/audio.service.ts`

**Agent Flow:**
1. Receives audio file (WebM format)
2. Uploads to Cloudinary for storage
3. Calls OnDemand Media API with audio URL
4. Returns transcript text
5. Saves to AudioLog collection

**Configuration:**
```env
OND_MEDIA_KEY=your_ondemand_media_api_key
```

---

### 2. CategorizationAgent

**Purpose:** Categorizes transcript content into life areas and determines sentiment.

**Trigger:** After transcription completes

**API Used:** Google Gemini API

**Implementation:** `backend/src/services/ai.service.ts` → `categorizeTranscript()`

**Categories:**
- `health` - Physical wellness, exercise, diet
- `work` - Professional tasks, meetings
- `personal` - Hobbies, self-care
- `family` - Family interactions
- `social` - Social activities
- `finance` - Money matters
- `learning` - Education, skills
- `other` - Miscellaneous

**Sentiments:**
- `positive` - Upbeat, accomplished, happy
- `negative` - Stressed, frustrated
- `neutral` - Factual, routine
- `mixed` - Complex emotions

---

### 3. SummarizationAgent

**Purpose:** Generates weekly narrative summaries from audio logs.

**Trigger:** GET `/api/summary` or POST `/api/summary/generate`

**APIs Used:** 
- Google Gemini API (narrative generation)
- ElevenLabs API (text-to-speech)

**Implementation:** `backend/src/services/ai.service.ts` → `generateWeeklySummary()`

**Output:**
```json
{
  "phase": "Builder",
  "phaseConfidence": 85,
  "metrics": {
    "totalLogs": 5,
    "categoryCounts": { "work": 3, "health": 2 },
    "sentimentBreakdown": { "positive": 4, "neutral": 1 }
  },
  "story": "This week you focused heavily on...",
  "ttsUrl": "https://cloudinary.com/audio/summary.mp3"
}
```

**Configuration:**
```env
GEMINI_KEY=your_gemini_api_key
ELEVEN_KEY=your_elevenlabs_api_key
```

---

### 4. ChatAgent

**Purpose:** Interactive AI coach for personalized guidance.

**Trigger:** POST `/api/chat`

**API Used:** OnDemand Chat API

**Implementation:** `backend/src/services/chat.service.ts`

**Features:**
- Conversation context (last 20 messages)
- Session management
- Follow-up suggestions
- Personal growth focused responses

**Configuration:**
```env
OND_CHAT_KEY=your_ondemand_chat_api_key
```

---

## Stretch Agents (Future)

### 5. SchedulerAgent
**Purpose:** Schedule reminder notifications
**Status:** Not implemented
**Planned:** Email/push notifications for daily logging

### 6. ShareCardAgent
**Purpose:** Generate shareable summary images
**Status:** Not implemented
**Planned:** Canvas-based image generation for social sharing

### 7. InsightsAgent
**Purpose:** Cross-user trend analysis
**Status:** Not implemented
**Planned:** Aggregate insights across user base

---

## Environment Variables

```env
# OnDemand APIs
OND_MEDIA_KEY=       # Media/Transcription API
OND_CHAT_KEY=        # Chat API

# AI Services
GEMINI_KEY=          # Google Gemini for categorization/summarization

# Text-to-Speech
ELEVEN_KEY=          # ElevenLabs API

# Storage
CLOUDINARY_URL=      # Audio file storage
MONGO_URI=           # Database

# Authentication
AUTH0_DOMAIN=        # Auth0 tenant
AUTH0_AUDIENCE=      # API identifier
AUTH0_CLIENT_ID=     # Application client ID
```

---

## API Endpoints Summary

| Endpoint | Method | Agent(s) | Description |
|----------|--------|----------|-------------|
| `/api/log` | POST | Transcription, Categorization | Upload audio, get transcript |
| `/api/log` | GET | - | List user's audio logs |
| `/api/summary` | GET | Summarization | Get/generate current week summary |
| `/api/summary/:weekId` | GET | Summarization | Get specific week summary |
| `/api/summary/generate` | POST | Summarization | Force regenerate summary |
| `/api/chat` | POST | Chat | Send message, get AI response |
| `/api/chat/sessions` | GET | - | List chat sessions |

---

## Hackathon Submission Notes

This project demonstrates:
1. **Multi-agent architecture** - Specialized agents for different tasks
2. **OnDemand integration** - Media API + Chat API
3. **AI-powered insights** - Gemini for categorization and summarization
4. **Voice synthesis** - ElevenLabs TTS for audio summaries
5. **Real-time chat** - Interactive AI coach with suggestions
6. **Full-stack implementation** - React + Express + MongoDB

**Team:** GrowthAmp
**Event:** DTU Hackathon 2026
