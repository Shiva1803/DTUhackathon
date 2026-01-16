# GrowthAmp Demo Script

## Elevator Pitch (30 seconds)

> "GrowthAmp is an AI-powered daily journaling app that transforms 60-second voice notes into personalized weekly insights. Just talk about your day - our AI transcribes, categorizes, and generates a narrative summary of your week, complete with sentiment analysis and text-to-speech playback. It's like having a personal coach that listens to you every day and reflects back your patterns."

---

## Demo Flow (5 minutes)

### 1. Landing Page (30s)
- Show the hero section: "Amplify Your Growth in 60 Seconds"
- Highlight key features: AI Analysis, Weekly Insights, Streak Tracking
- Click **"Get Started"**

### 2. Auth0 Login (30s)
- Demonstrate secure login via Auth0
- Mention: "Enterprise-grade authentication with Auth0"

### 3. Record Daily Log (60s)
- Navigate to `/log`
- Click the microphone button
- Record a sample log: *"Today I worked on our hackathon project. Made great progress on the AI integration. Feeling really excited about the demo tomorrow!"*
- Show the upload process and success

### 4. Weekly Summary (60s)
- Navigate to `/summary`
- Show the generated summary with:
  - **Phase badge** (Builder/Explorer/etc.)
  - **Metrics** (logs count, categories breakdown)
  - **Sentiment chart**
  - **Streak counter**
  - **AI-generated story narrative**
- Optionally play TTS audio if available

### 5. Chat with AI (60s)
- Navigate to `/chat`
- Ask: *"How was my week?"* or *"What patterns do you see?"*
- Show the contextual AI response with suggestions
- Demonstrate follow-up question capability

### 6. Share Card (30s)
- Show the share functionality
- Generate a shareable image card with week stats
- Mention: "Easy to share on social media"

---

## Key Talking Points

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + MongoDB
- **AI**: Google Gemini 2.5 Flash for NLP
- **Audio**: OnDemand Media API for transcription
- **TTS**: ElevenLabs for voice synthesis
- **Auth**: Auth0 for secure authentication
- **Storage**: Cloudinary for audio files

### Sponsor Integrations
- ✅ **Auth0** - Authentication
- ✅ **MongoDB Atlas** - Database
- ✅ **OnDemand** - Chat & Media APIs
- ✅ **Cloudinary** - Media storage
- ✅ **Google Gemini** - AI/LLM
- ✅ **ElevenLabs** - Text-to-Speech

### Unique Selling Points
1. **60-Second Daily Habit** - Low barrier to entry
2. **Voice-First** - Natural and accessible
3. **AI-Powered Insights** - Not just storage, actual analysis
4. **Gamification** - Streaks encourage consistency
5. **Shareable** - Social accountability

---

## Backup Plan

If APIs are down, use these fallback responses:

### Mock Summary
```json
{
  "phase": "Builder",
  "metrics": {
    "totalLogs": 7,
    "categoryCounts": { "work": 4, "personal": 2, "learning": 1 },
    "sentimentBreakdown": { "positive": 5, "neutral": 2, "negative": 0 }
  },
  "story": "This week you showed remarkable focus on your work projects, with a positive outlook throughout. You balanced productivity with personal time and continued learning new skills.",
  "streak": 5
}
```

### Mock Chat Response
```json
{
  "message": "Based on your logs this week, you've been highly focused on work with a positive sentiment. You seem energized by your current projects!",
  "suggestions": ["Tell me more about your projects", "How can I improve?", "What patterns do you see?"]
}
```

---

## Q&A Prep

**Q: How does the AI categorization work?**
A: We use Google Gemini to analyze transcripts and classify them into categories like work, health, personal, learning, etc., with confidence scores.

**Q: What happens if the transcription is wrong?**
A: Users can manually edit transcripts. The AI is also trained to handle imperfect input gracefully.

**Q: Is the voice data stored securely?**
A: Yes, audio is stored in Cloudinary with secure URLs, and all data is tied to authenticated users via Auth0.

**Q: What's next for GrowthAmp?**
A: Push notifications for daily reminders, goal tracking, monthly/yearly trends, and community features for shared accountability.
