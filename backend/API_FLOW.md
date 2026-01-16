# Backend API & Testing Flow Guide

This document provides a comprehensive verification flow for the backend application, detailing every API endpoint, payload, and expected response. Use this guide to manually test or understand the system architecture.

## 🔄 End-to-End Testing Flow

To test the full feature set and architecture, follow this sequence:

1.  **System Health**: Verify the server and database are running.
2.  **Authentication**: Obtain a valid JWT from Auth0 to access protected routes.
3.  **User Profile**: Confirm the backend can fetch/create your user profile from the token.
4.  **Audio Logging (Core Service)**: Upload an audio file to test Cloudinary upload, OnDemand transcription, and MongoDB storage.
5.  **Chat (AI Service)**: Start a chat session and send a message to test OnDemand Chat integration.
6.  **Summaries**: Generate and retrieve a weekly summary to test data aggregation and AI processing.

---

## 🛠 Prerequisites

- **Base URL**: `http://localhost:3001` (or your deployment URL)
- **Headers**:
    - `Content-Type: application/json` (except for file uploads)
    - `Authorization: Bearer <YOUR_ACCESS_TOKEN>`

---

## 1. System Health

**Goal**: Verify infrastructure connectivity (Express, MongoDB, Env Vars).

### `GET /health`
- **Auth**: Public
- **Description**: Checks database connection and configuration presence.
- **Expected Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "uptime": 1245,
    "timestamp": "2024-01-16T10:00:00.000Z",
    "services": {
      "database": "connected",
      "auth": "configured",
      "storage": "configured",
      "chat": "configured",
      "media": "configured"
    }
  }
  ```

---

## 2. Authentication & User Profile

**Goal**: Verify Auth0 integration and User model creation/retrieval.

### `GET /api/auth/me`
- **Auth**: Required
- **Description**: Returns the current user's profile. If this is the first request, the backend automatically creates the User document in MongoDB.
- **Expected Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "65a1b2c3d4e5f6...",
      "auth0Id": "auth0|123456",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-15T...",
      "lastLogin": "2024-01-16T..."
    }
  }
  ```

---

## 3. Audio Logging (Media Service)

**Goal**: Test `Multer` -> `Cloudinary` -> `OnDemand Media API` -> `MongoDB`.

### `POST /api/log`
- **Auth**: Required
- **Content-Type**: `multipart/form-data`
- **Body**:
    - `audio`: File (MP3 or WAV, < 10MB)
- **Description**: Uploads audio, transcribes it, and saves the log.
- **Expected Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Log uploaded",
    "logId": "65a123...",
    "data": {
      "transcript": "Hello this is a test recording.",
      "duration": 5.4,
      "audioUrl": "https://res.cloudinary.com/...",
      "timestamp": "2024-01-16T..."
    }
  }
  ```

### `GET /api/log`
- **Auth**: Required
- **Query Params**:
    - `page`: Page number (default 1)
    - `limit`: Items per page (default 10)
- **Description**: List your audio logs.
- **Expected Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65a123...",
        "transcript": "...",
        "audioUrl": "..."
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 10 }
  }
  ```

### `DELETE /api/log/:id`
- **Auth**: Required
- **Description**: Deletes an audio log and its Cloudinary asset.

---

## 4. Chat System (AI Service)

**Goal**: Test `OnDemand Chat API` integration and `ChatMessage` persistence.

### `POST /api/chat`
- **Auth**: Required
- **Body**:
  ```json
  {
    "message": "How can I improve my productivity?",
    "sessionId": "optional-existing-session-id"
  }
  ```
- **Description**: Sends a message to the AI. If `sessionId` is missing, a new session is created.
- **Expected Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "sessionId": "session_1705...",
      "message": "To improve productivity, try the Pomodoro technique...",
      "messageId": "65b...",
      "tokens": 150
    }
  }
  ```

### `GET /api/chat/sessions/:sessionId`
- **Auth**: Required
- **Description**: Retrieve chat history for a specific session.

---

## 5. Weekly Summaries

**Goal**: Test data aggregation and logic.

### `GET /api/summary/:weekId`
- **Auth**: Required
- **Param**: `weekId` (Format: `YYYY-WNN`, e.g., `2024-W03`)
- **Description**: Retrieves the summary for a specific week. If it doesn't exist, it attempts to generate one based on logs from that week.
- **Expected Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "65c...",
      "weekId": "2024-W03",
      "metrics": { "totalLogs": 5, ... },
      "story": "This week you focused heavily on coding...",
      "isComplete": true
    }
  }
  ```

---

## 🧪 Testing Checklist

Use this checklist to ensure all architectural components are functioning:

- [ ] **Infrastructure**: `/health` returns `ok`.
- [ ] **Database**: User document created on first `/api/auth/me` call.
- [ ] **Storage**: Audio file appears in your Cloudinary dashboard.
- [ ] **AI (Media)**: Audio transcript is accurate and not "Mock transcription".
- [ ] **AI (Chat)**: Chat responds intelligently (not mock response).
- [ ] **Security**: Requests without `Authorization` header return 401.
- [ ] **Validation**: Uploading a non-audio file returns 400.
