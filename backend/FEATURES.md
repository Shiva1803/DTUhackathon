# Platform Feature Overview

This document provides a deep dive into the features, capabilities, and data flow of the backend platform.

## 🎯 Core Concept
The platform serves as an **Intelligent Audio Journaling & Life Logging System**. It allows users to record their thoughts via audio, automatically transcribed and organized by AI, enabling them to "chat" with their past logs and receive insightful weekly summaries.

---

## 🚀 Key Features

### 1. Secure Identity Management
- **Auth0 Integration**: Bank-grade authentication using JWT (JSON Web Tokens).
- **Auto-Provisioning**: User profiles are automatically created in the database upon first login.
- **Data Privacy**: All data is siloed by `userId`, ensuring users can only access their own logs and chats.
- **Session Tracking**: Tracks last login timestamps for activity monitoring.

### 2. Audio Intelligence Pipeline
This is the heart of the ingestion system.
1.  **Ingestion**: Accepts audio uploads (MP3/WAV, up to 10MB) via `multipart/form-data`.
2.  **Storage**: Securely uploads files to **Cloudinary**, generating a permanent, secure URL.
3.  **Transcription**: Uses **OnDemand Media API** to convert speech to text with high accuracy.
4.  **Categorization**: Background AI processes analyze the transcript to tag it (e.g., "Work", "Personal", "Ideas") for easier filtering (Powered by Gemini).
5.  **Persistence**: Stores metadata (duration, file size, mime type) and the full transcript in MongoDB.

### 3. Interactive AI Assistant
Users can converse with an AI that has "context" of the application.
- **OnDemand Chat API**: Powers the conversational interface.
- **Session Management**: chats are organized into sessions, allowing for distinct conversations topics.
- **History Tracking**: Full chat history is stored, allowing users to review past conversations.
- **Context Awareness**: The system is designed to eventually feed user logs as context to this chat, enabling questions like *"What did I do last Tuesday?"* (Architecture ready).

### 4. Weekly Insights (the "Sunday Review")
The platform aggregates data to provide value over time.
- **Aggregation**: Collects everyday logs from a specific week (ISO Week format).
- **AI Synthesis**: Generates a narrative summary of the week's events.
- **Metrics**: Calculates activity metrics (e.g., "Total Logs", "Sentiment Breakdown").
- **TTS Readiness**: Architecture includes fields for Text-to-Speech URLs, allowing users to *listen* to their weekly summary (ElevenLabs integration point).

---

## 🏗 System Architecture

### Technology Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript (Strict Mode for reliability)
- **Framework**: Express.js with robust middleware patterns
- **Database**: MongoDB (Mongoose ODM)
- **Deployment**: Dockerized (Multi-stage Alpine builds)

### Data Flow Diagram

```mermaid
graph TD
    User[User / Client] -->|1. Auth (JWT)| API[Express Backend]
    
    subgraph Ingestion
    API -->|2. Upload Audio| Cloudinary[Cloudinary Storage]
    Cloudinary -->|3. URL| API
    API -->|4. Transcribe| OND_Media[OnDemand Media API]
    OND_Media -->|5. Text| API
    end
    
    subgraph Intelligence
    API -->|6. Categorize| Gemini[Google Gemini]
    API -->|7. Chat / Query| OND_Chat[OnDemand Chat API]
    end
    
    subgraph Persistence
    API -->|Store/Retrieve| Mongo[(MongoDB)]
    Mongo --> Users
    Mongo --> AudioLogs
    Mongo --> Summaries
    Mongo --> ChatMessages
    end
```

---

## 🛡 Security & Reliability
- **Helmet.js**: Sets secure HTTP headers (XSS protection, etc.).
- **CORS**: Configurable Cross-Origin policies for frontend security.
- **Rate Limiting readiness**: Architecture supports middleware insertion for rate limiting.
- **Health Checks**: Dedicated `/health` endpoint monitors DB connectivity and external API configuration status.
- **Error Handling**: Centralized error middleware ensures no internal stack traces leak to the client in production.

---

## 🔮 Future Capabilities (Ready-to-Implement)
The current architecture supports easy extension for:
- **Vector Search**: Using the `transcript` field for semantic search.
- **Voice Response**: Implementing the configured ElevenLabs keys for spoken AI responses.
- **Sentiment Analysis**: Visualization of mood trends over time based on log data.
