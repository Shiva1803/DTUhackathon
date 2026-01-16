# Parallax Frontend

React + TypeScript frontend for the Parallax personal growth journal application.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Auth0 React SDK** - Authentication
- **Axios** - HTTP client
- **React Router v7** - Routing
- **Lucide React** - Icons

## Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Auth0 credentials

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain | Yes |
| `VITE_AUTH0_CLIENT_ID` | Auth0 application client ID | Yes |
| `VITE_AUTH0_AUDIENCE` | Auth0 API identifier | Yes |
| `VITE_API_URL` | Backend API URL (optional, uses proxy in dev) | No |

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginButton.tsx      # Auth0 login trigger
│   │   ├── LogoutButton.tsx     # Auth0 logout
│   │   ├── ProtectedRoute.tsx   # Route guard
│   │   ├── UserProfile.tsx      # User info display
│   │   └── index.ts
│   ├── Navbar.tsx               # Navigation bar
│   └── PhaseBadge.tsx           # Phase indicator
├── lib/
│   └── api.ts                   # Axios client with auth
├── pages/
│   ├── Landing.tsx              # Public landing page
│   ├── DailyLog.tsx             # Audio recording
│   ├── Success.tsx              # Upload confirmation
│   ├── SummaryPage.tsx          # Weekly summary
│   └── index.ts
├── App.tsx                      # Main app with routing
├── main.tsx                     # Entry point
└── index.css                    # Tailwind imports
```

## Available Scripts

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Pages

### Landing (`/`)
- Public page with hero section
- "How It Works" explanation
- Login button

### Daily Log (`/log`) - Protected
- 60-second audio recording
- Real-time waveform visualization
- Upload to backend API

### Success (`/success`) - Protected
- Upload confirmation
- Link to summary page

### Summary (`/summary`) - Protected
- Weekly metrics display
- Category breakdown
- AI-generated narrative
- Audio player for TTS summary

## API Integration

The `lib/api.ts` module provides:

```typescript
// Upload audio log
uploadAudioLog(formData: FormData, token: string)

// Get weekly summary
getSummary(token: string, weekId: string)

// Get audio logs
getAudioLogs(token: string, params?: { page, limit })
```

## Development

The Vite dev server proxies `/api` requests to `http://localhost:3001` (backend).

For production, set `VITE_API_URL` to your backend URL.
