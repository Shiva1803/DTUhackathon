/**
 * Audio Processing Module
 * 
 * This module provides audio processing services including:
 * - Audio file upload to Cloudinary
 * - Audio transcription via OnDemand Media API
 * - Audio log persistence to MongoDB
 * - Error tracking and logging
 */

// Service
export { AudioProcessingService, audioProcessingService } from './audio.service';
export { CategorizerService, categorizerService } from './categorizer.service';
export { SummaryService, summaryService } from './summary.service';

// Models
export { AudioProcessingLog } from './AudioProcessingLog.model';
export { TranscriptionError } from './TranscriptionError.model';

// Routes
export { audioProcessingRoutes } from './routes';

// Types
export * from './types';
