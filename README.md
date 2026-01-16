# GrowthAmp - AI-Powered Personal Growth Journal

An AI-powered personal growth application that transforms daily voice reflections into actionable insights. Record 60-second audio logs, get AI-powered transcription and categorization, and receive weekly summaries with trends and recommendations.

## 🚀 Features

- **Voice Journaling**: Record 60-second daily audio reflections
- **AI Transcription**: Automatic speech-to-text via OnDemand Media API
- **Smart Categorization**: AI categorizes entries (work, health, learning, etc.)
- **Sentiment Analysis**: Track emotional patterns over time
- **Weekly Summaries**: AI-generated narrative summaries with insights
- **Text-to-Speech**: Listen to your weekly summary (ElevenLabs)
- **Secure Auth**: Auth0 authentication with JWT tokens

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  • React 19 + TypeScript                                    │
│  • Tailwind CSS + Framer Motion                             │
│  • Auth0 React SDK                                          │
│  • Axios for API calls                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                      │
│  • Node.js + TypeScript                                     │
│  • MongoDB + Mongoose                                       │
│  • Auth0 JWT validation                                     │
│  • Multer for file uploads                                  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ MongoDB  │   │Cloudinary│   │ AI APIs  │
        │ Atlas    │   │ Storage  │   │ Gemini   │
        └──────────┘   └──────────┘   │ OnDemand │
                                      │ ElevenLabs│
                                      └──────────┘
```

## 📁 Project Structure

```
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database & Auth0 config
│   │   ├── middleware/     # Auth & error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers & logger
│   │   ├── app.ts          # Express app setup
│   │   └── server.ts       # Entry point
│   └── package.json
│
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── auth/       # Auth components
│   │   │   ├── Navbar.tsx
│   │   │   └── PhaseBadge.tsx
│   │   ├── lib/            # API client
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main app with routing
│   │   └── main.tsx        # Entry point
│   └── package.json
│
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Auth0 account
- (Optional) Cloudinary account
- (Optional) Google AI (Gemini) API key
- (Optional) OnDemand API keys
- (Optional) ElevenLabs API key

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Backend Environment

Create `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/growthamp

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.growthamp.com

# Cloudinary (optional - for audio storage)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# AI Services (optional)
GEMINI_KEY=your-gemini-api-key
OND_MEDIA_KEY=your-ondemand-media-key
OND_CHAT_KEY=your-ondemand-chat-key
ELEVEN_KEY=your-elevenlabs-key

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Configure Frontend Environment

Create `frontend/.env`:

```env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.growthamp.com
```

### 4. Auth0 Setup

1. Create an Auth0 Application (Single Page Application)
2. Set Allowed Callback URLs: `http://localhost:5173`
3. Set Allowed Logout URLs: `http://localhost:5173`
4. Set Allowed Web Origins: `http://localhost:5173`
5. Create an Auth0 API with identifier matching `AUTH0_AUDIENCE`

### 5. Run the Application

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user profile |

### Audio Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/log` | Upload audio file (multipart/form-data) |
| GET | `/api/log` | List user's audio logs (paginated) |
| GET | `/api/log/:id` | Get specific audio log |
| DELETE | `/api/log/:id` | Delete audio log |

### Summaries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/summary/:weekId` | Get weekly summary (YYYY-WNN format) |
| GET | `/api/summary` | List all summaries |
| POST | `/api/summary/generate` | Trigger summary generation |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send chat message |
| GET | `/api/chat/sessions` | List chat sessions |
| GET | `/api/chat/sessions/:id` | Get session history |

## 🔐 Security

- JWT-based authentication via Auth0
- CORS configured for frontend origin
- Helmet.js for security headers
- File upload validation (type, size)
- User data isolation (users can only access their own data)

## 🧪 Testing

```bash
# Backend health check
curl http://localhost:3001/health

# Test with authentication (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/auth/me
```

## 📱 Pages

1. **Landing** (`/`) - Public landing page with login
2. **Daily Log** (`/log`) - Record audio reflections
3. **Success** (`/success`) - Upload confirmation
4. **Summary** (`/summary`) - Weekly insights & metrics

## 🎨 Design System

- **Colors**: Dark theme with purple→cyan gradients
- **Typography**: System fonts with Tailwind defaults
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React icon library

## 📄 License

MIT License
