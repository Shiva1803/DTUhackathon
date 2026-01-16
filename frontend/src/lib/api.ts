import axios, { AxiosError } from 'axios';

// Create axios instance
// In development, Vite proxy handles /api -> localhost:3001
// In production, set VITE_API_URL to your backend URL (e.g., https://api.yourapp.com)
const baseURL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

/**
 * Upload audio log
 */
export const uploadAudioLog = async (
  formData: FormData,
  token: string,
  onUploadProgress?: (progressEvent: { loaded: number; total?: number; progress?: number }) => void
) => {
  const response = await api.post('/api/log', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`,
    },
    timeout: 180000, // 3 minutes for upload + transcription
    onUploadProgress,
  });
  return response;
};

/**
 * Get audio logs with pagination
 */
export const getAudioLogs = async (
  token: string,
  params?: { page?: number; limit?: number; startDate?: string; endDate?: string; category?: string }
) => {
  return api.get('/api/log', {
    params,
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

/**
 * Get single audio log
 */
export const getAudioLog = async (token: string, logId: string) => {
  return api.get(`/api/log/${logId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

/**
 * Delete audio log
 */
export const deleteAudioLog = async (token: string, logId: string) => {
  return api.delete(`/api/log/${logId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

/**
 * Get weekly summary
 */
export const getSummary = async (token: string, weekId: string) => {
  return api.get(`/api/summary/${weekId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

/**
 * Get all summaries with pagination
 */
export const getAllSummaries = async (token: string, params?: { page?: number; limit?: number }) => {
  return api.get('/api/summary', {
    params,
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

/**
 * Generate weekly summary
 */
export const generateSummary = async (token: string, weekStart: string) => {
  return api.post('/api/summary/generate',
    { weekStart },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
};

/**
 * Get current user profile
 */
export const getUserProfile = async (token: string) => {
  return api.get('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

/**
 * Send chat message
 */
export const sendChatMessage = async (token: string, message: string, sessionId?: string) => {
  return api.post('/api/chat',
    { message, sessionId },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
};

/**
 * Get chat sessions
 */
export const getChatSessions = async (token: string) => {
  return api.get('/api/chat/sessions', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

/**
 * Get chat history for a session
 */
export const getChatHistory = async (token: string, sessionId: string) => {
  return api.get(`/api/chat/sessions/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
};

export default api;
