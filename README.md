# Parallax - AI-Powered Personal Growth Journal

An AI-powered personal growth application that transforms daily voice reflections into actionable insights. Record audio logs, get AI-powered transcription and activity tracking, and receive personalized reviews based on your growth patterns.

## 🌐 Live Demo

- **Frontend**: [https://parallax.vercel.app](https://parallax.vercel.app) _(Deploy to get your URL)_
- **API**: [https://api.parallax.app](https://api.parallax.app) _(Configure your domain)_
- **Health Check**: [https://api.parallax.app/health](https://api.parallax.app/health)

> **Note**: Replace with your actual deployment URLs after following the [Deployment Guide](./DEPLOYMENT.md)

## 🚀 Features

- **Voice Journaling**: Record daily audio reflections
- **AI Transcription**: Automatic speech-to-text via OnDemand Media API
- **3-Step Activity Tracking**: 
  - Extract activities from your transcript
  - Classify into 5 categories (Growth, Health, Work, Consumption, Other)
  - Get personalized reviews based on patterns
- **Smart Categorization**: AI categorizes entries with sentiment analysis
- **Weekly Summaries**: AI-generated narrative summaries with insights
- **Text-to-Speech**: Listen to your weekly summary (ElevenLabs)
- **Secure Auth**: Auth0 authentication with JWT tokens
- **Beautiful UI**: Dark/Light themes with desert dust particles
- **Streak Tracking**: Monitor your consistency with daily streaks

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

### Activity Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/summary/activities` | Get activity summary (5 categories, last 20 logs) |
| POST | `/api/summary/activities/review` | Generate fresh personal review |

### Summaries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/summary/:weekId` | Get weekly summary (YYYY-WNN format) |
| GET | `/api/summary` | Get current week summary |
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
2. **Dashboard** (`/dashboard`) - Overview with streak tracking
3. **Daily Log** (`/log`) - Record audio reflections with title input
4. **Success** (`/success`) - Upload confirmation with celebration
5. **History** (`/logs`) - View all past recordings with delete functionality
6. **Summary** (`/summary`) - Activity tracking with 5 categories and personal review
7. **Chat** (`/chat`) - AI chat assistant for reflections

## 🎨 Design System

- **Dark Mode**: Pure black (#000000) with cyan accent (#00d4ff)
- **Light Mode**: Desert sand (#F5E6D3) with golden brown accent (#8B6914)
- **Typography**: Space Grotesk for headings, Inter for body
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React icon library
- **Particles**: Parallax stars (dark) / Desert dust (light)

## 📄 License

MIT License

---

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick Deploy:**
- Backend: Vultr VPS with PM2
- Frontend: Vercel (one-click deploy)
- Database: MongoDB Atlas
- SSL: Let's Encrypt (free)

---

## 📊 Project Status

- ✅ Core features implemented
- ✅ 3-step activity tracking system
- ✅ Dark/Light theme with animations
- ✅ Production-ready deployment configs
- ✅ Comprehensive documentation
- 🚧 Demo deployment in progress

---

## 👥 Team

Built for DTU Hackathon 2026

---

## 🙏 Acknowledgments

- Auth0 for authentication
- MongoDB Atlas for database
- Cloudinary for media storage
- Google Gemini for AI capabilities
- OnDemand for transcription services
- ElevenLabs for text-to-speech
