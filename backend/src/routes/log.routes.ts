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
 * Multer configuration for audio file uploads
 * Stores files in memory for processing
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept audio files
    const allowedMimeTypes = [
      'audio/webm',
      'audio/wav',
      'audio/x-wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/ogg',
      'audio/flac',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  },
});

/**
 * @route   POST /api/log
 * @desc    Upload audio file for transcription and logging
 *          1. Uploads audio to Cloudinary (if configured)
 *          2. Calls OnDemand Media API for transcription
 *          3. Saves transcript to AudioLog model
 * @access  Private
 * @body    multipart/form-data with 'audio' field
 */
router.post(
  '/',
  authenticate,
  upload.single('audio'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated', statusCode: 401 },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No audio file provided. Use multipart/form-data with "audio" field.', statusCode: 400 },
      });
      return;
    }

    logger.info(`Audio upload received from user ${req.user.id}`, {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // Process the audio upload:
    // 1. Upload to Cloudinary
    // 2. Transcribe via OnDemand Media API
    // 3. Save to AudioLog
    const result = await audioService.processAudioUpload(
      req.user.id,
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    // Optionally categorize the transcript asynchronously
    // This could also be done via a job queue in production
    aiService.categorizeAudioLog(result.audioLog._id.toString(), req.user.id)
      .catch((error) => logger.error('Background categorization failed:', error));

    res.status(201).json(
      successResponse(
        {
          id: result.audioLog._id.toString(),
          transcript: result.transcript,
          duration: result.duration,
          audioUrl: result.audioUrl,
          timestamp: result.audioLog.timestamp,
        },
        'Audio log created successfully'
      )
    );
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
