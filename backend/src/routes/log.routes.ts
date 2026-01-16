import { Router, Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../types/express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler, ValidationError } from '../middleware/error.middleware';
import { successResponse, paginatedResponse, parsePagination } from '../utils/response';
import { audioService } from '../services/audio.service';
import { aiService } from '../services/ai.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Allowed audio MIME types (MP3, WAV, and WebM for browser compatibility)
 */
const ALLOWED_AUDIO_TYPES = [
  'audio/mp3',
  'audio/mpeg',      // MP3
  'audio/wav',
  'audio/x-wav',     // WAV
  'audio/wave',
  'audio/webm',      // WebM (browser default)
  'audio/ogg',       // Ogg Vorbis
];

/**
 * Max file size: 10MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Multer configuration for audio file uploads
 * - Accepts single file in 'audio' field
 * - Stores files in memory for processing
 * - Limits to MP3/WAV, max 10MB
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError(
        `Invalid file type: ${file.mimetype}. Only MP3 and WAV files are allowed.`
      ));
    }
  },
});

/**
 * Handle multer errors (file size, etc.)
 */
const handleMulterError = (err: Error, res: Response): boolean => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: {
          message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          statusCode: 400,
          code: 'FILE_TOO_LARGE',
        },
      });
      return true;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Unexpected field. Use "audio" as the field name for file upload.',
          statusCode: 400,
          code: 'UNEXPECTED_FIELD',
        },
      });
      return true;
    }
  }
  return false;
};

/**
 * @route   POST /api/log
 * @desc    Upload audio file for transcription and logging
 *          1. Accept single audio file (field: "audio")
 *          2. Validate file type (MP3, WAV) and size (< 10MB)
 *          3. Upload to Cloudinary (or local storage for dev)
 *          4. Call transcribeAudio(audioUrl) service
 *          5. Save AudioLog { userId, transcript, timestamp }
 *          6. Respond { success: true, message: "Log uploaded", logId }
 * @access  Private
 * @body    multipart/form-data with 'audio' field
 */
router.post(
  '/',
  authenticate,
  (req: AuthenticatedRequest, res: Response, next: (err?: Error) => void) => {
    // Custom wrapper to handle multer errors properly
    upload.single('audio')(req, res, (err) => {
      if (err) {
        if (handleMulterError(err, res)) return;
        if (err instanceof ValidationError) {
          res.status(400).json({
            success: false,
            error: { message: err.message, statusCode: 400 },
          });
          return;
        }
        next(err);
        return;
      }
      next();
    });
  },
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Error: Missing authentication
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    // Error: Missing file
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          message: 'No audio file provided. Use multipart/form-data with "audio" field.',
          statusCode: 400,
          code: 'MISSING_FILE',
        },
      });
      return;
    }

    logger.info(`Audio upload received from user ${req.user.id}`, {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    try {
      // Process the audio upload:
      // 1. Upload to Cloudinary (if configured, else skip)
      // 2. Transcribe via OnDemand Media API
      // 3. Save to AudioLog
      const result = await audioService.processAudioUpload(
        req.user.id,
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname
      );

      // Update user streak
      const { User } = await import('../models/User');
      const user = await User.findById(req.user.id);
      if (user) {
        await user.updateStreak();
        logger.info(`Streak updated for user ${req.user.id}: ${user.streakCount} days`);
      }

      // Optionally categorize the transcript asynchronously
      aiService.categorizeAudioLog(result.audioLog._id.toString(), req.user.id)
        .catch((error) => logger.error('Background categorization failed:', error));

      // Success response: { success: true, message: "Log uploaded", logId }
      res.status(201).json({
        success: true,
        message: 'Log uploaded',
        logId: result.audioLog._id.toString(),
        data: {
          transcript: result.transcript,
          duration: result.duration,
          audioUrl: result.audioUrl,
          timestamp: result.audioLog.timestamp,
          streak: user ? {
            current: user.streakCount,
            longest: user.longestStreak,
          } : null,
        },
      });
    } catch (error) {
      // Error: Cloudinary/upload failure or transcription failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Cloudinary')) {
        logger.error('Cloudinary upload failure:', error);
        res.status(500).json({
          success: false,
          error: {
            message: 'Failed to upload audio file to storage.',
            statusCode: 500,
            code: 'UPLOAD_FAILURE',
          },
        });
        return;
      }

      if (errorMessage.includes('Transcription') || errorMessage.includes('transcription')) {
        logger.error('Transcription failure:', error);
        res.status(500).json({
          success: false,
          error: {
            message: 'Failed to transcribe audio file.',
            statusCode: 500,
            code: 'TRANSCRIPTION_FAILURE',
          },
        });
        return;
      }

      // Re-throw for global error handler
      throw error;
    }
  })
);

/**
 * @route   GET /api/log
 * @desc    Get audio logs for the current user
 * @access  Private
 * @query   page, limit, startDate, endDate, category
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
    const skip = (page - 1) * limit;

    // Parse optional filters
    const startDate = req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined;
    const endDate = req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined;
    const category = req.query['category'] as string | undefined;

    const { logs, total } = await audioService.getAudioLogs(req.user.id, {
      limit,
      skip,
      startDate,
      endDate,
      category,
    });

    res.json(paginatedResponse(logs, total, page, limit));
  })
);

/**
 * @route   GET /api/log/:id
 * @desc    Get a specific audio log
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    const logId = req.params['id'];
    if (!logId) {
      res.status(400).json({
        success: false,
        error: { message: 'Log ID is required', statusCode: 400 },
      });
      return;
    }

    const log = await audioService.getAudioLog(logId, req.user.id);

    if (!log) {
      res.status(404).json({
        success: false,
        error: { message: 'Audio log not found', statusCode: 404 },
      });
      return;
    }

    res.json(successResponse(log));
  })
);

/**
 * @route   DELETE /api/log/:id
 * @desc    Delete an audio log (also removes from Cloudinary if stored there)
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    const logId = req.params['id'];
    if (!logId) {
      res.status(400).json({
        success: false,
        error: { message: 'Log ID is required', statusCode: 400 },
      });
      return;
    }

    const deleted = await audioService.deleteAudioLog(logId, req.user.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { message: 'Audio log not found', statusCode: 404 },
      });
      return;
    }

    res.json(successResponse(null, 'Audio log deleted successfully'));
  })
);

export default router;
