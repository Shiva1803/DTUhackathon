/**
 * Types for Audio Processing Module
 */

import mongoose from 'mongoose';

/**
 * Result from Cloudinary upload
 */
export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  duration?: number;
  format: string;
  bytes: number;
}

/**
 * Result from transcription service
 */
export interface TranscriptionResult {
  transcript: string;
  duration?: number;
  language?: string;
  confidence?: number;
}

/**
 * Audio processing error details
 */
export interface AudioProcessingError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Result from full audio processing pipeline
 */
export interface AudioProcessingResult {
  success: boolean;
  audioLogId?: string;
  transcript?: string;
  audioUrl?: string;
  duration?: number;
  error?: AudioProcessingError;
}

/**
 * Audio processing log document interface
 */
export interface IAudioProcessingLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  transcript: string;
  timestamp: Date;
  audioUrl?: string;
  duration?: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Transcription error document interface
 */
export interface ITranscriptionError extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  audioUrl?: string;
  filePath?: string;
  errorCode: string;
  errorMessage: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Error codes for audio processing
 */
export const AudioErrorCodes = {
  CLOUDINARY_UPLOAD_FAILED: 'CLOUDINARY_UPLOAD_FAILED',
  CLOUDINARY_NOT_CONFIGURED: 'CLOUDINARY_NOT_CONFIGURED',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  TRANSCRIPTION_NOT_CONFIGURED: 'TRANSCRIPTION_NOT_CONFIGURED',
  TRANSCRIPTION_TIMEOUT: 'TRANSCRIPTION_TIMEOUT',
  INVALID_AUDIO_FILE: 'INVALID_AUDIO_FILE',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type AudioErrorCode = typeof AudioErrorCodes[keyof typeof AudioErrorCodes];
