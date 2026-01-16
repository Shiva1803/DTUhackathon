import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { audioProcessingService } from './audio.service';
import { summaryService } from './summary.service';
import { logger } from '../utils/logger';
import { successResponse, errorResponse, parsePagination, paginatedResponse } from '../utils/response';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `audio-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            'audio/webm',
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
            'audio/mp3',
            'audio/mpeg',
            'audio/ogg',
            'audio/flac',
            'audio/m4a',
            'audio/x-m4a',
            'audio/mp4',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimes.join(', ')}`));
        }
    },
});

/**
 * @route   POST /api/audio-processing/upload
 * @desc    Upload and process an audio file (transcribe and save)
 * @access  Protected (requires authentication)
 */
router.post('/upload', upload.single('audio'), async (req: Request, res: Response) => {
    try {
        // Get user ID from auth middleware (req.user is set by authenticate middleware)
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json(errorResponse('Unauthorized - User ID not found', 401, 'UNAUTHORIZED'));
            return;
        }

        if (!req.file) {
            res.status(400).json(errorResponse('No audio file provided', 400, 'NO_FILE'));
            return;
        }

        const filePath = req.file.path;
        logger.info(`[AudioProcessing] Processing upload for user ${userId}: ${filePath}`);

        // Process the audio file
        const result = await audioProcessingService.processAndSaveAudio(userId, filePath);

        // Clean up the uploaded file after processing
        try {
            fs.unlinkSync(filePath);
        } catch (cleanupError) {
            logger.warn(`[AudioProcessing] Failed to cleanup file: ${filePath}`, cleanupError);
        }

        if (result.success) {
            res.status(201).json(successResponse({
                audioLogId: result.audioLogId,
                transcript: result.transcript,
                audioUrl: result.audioUrl,
                duration: result.duration,
            }, 'Audio processed successfully'));
        } else {
            // Log was skipped due to error, return error response
            res.status(422).json(errorResponse(
                result.error?.message || 'Audio processing failed',
                422,
                result.error?.code || 'PROCESSING_FAILED',
                result.error?.details
            ));
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[AudioProcessing] Upload endpoint error:', error);

        // Clean up file on error
        if (req.file?.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                logger.warn('[AudioProcessing] Failed to cleanup file on error');
            }
        }

        res.status(500).json(errorResponse(errorMessage, 500, 'INTERNAL_ERROR'));
    }
});

/**
 * @route   GET /api/audio-processing/logs
 * @desc    Get audio logs for the authenticated user
 * @access  Protected (requires authentication)
 */
router.get('/logs', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json(errorResponse('Unauthorized', 401, 'UNAUTHORIZED'));
            return;
        }

        const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
        const skip = (page - 1) * limit;

        // Parse optional filters
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        const status = req.query.status as 'success' | 'failed' | undefined;

        const { logs, total } = await audioProcessingService.getAudioLogs(userId, {
            limit,
            skip,
            startDate,
            endDate,
            status,
        });

        res.json(paginatedResponse(logs, total, page, limit, 'Audio logs retrieved successfully'));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[AudioProcessing] Get logs error:', error);
        res.status(500).json(errorResponse(errorMessage, 500, 'INTERNAL_ERROR'));
    }
});

/**
 * @route   GET /api/audio-processing/logs/:id
 * @desc    Get a specific audio log by ID
 * @access  Protected (requires authentication)
 */
router.get('/logs/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json(errorResponse('Unauthorized', 401, 'UNAUTHORIZED'));
            return;
        }

        const id = req.params.id;
        if (!id) {
            res.status(400).json(errorResponse('Log ID is required', 400, 'MISSING_ID'));
            return;
        }
        const log = await audioProcessingService.getAudioLog(id, userId);

        if (!log) {
            res.status(404).json(errorResponse('Audio log not found', 404, 'NOT_FOUND'));
            return;
        }

        res.json(successResponse(log, 'Audio log retrieved successfully'));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[AudioProcessing] Get log by ID error:', error);
        res.status(500).json(errorResponse(errorMessage, 500, 'INTERNAL_ERROR'));
    }
});

/**
 * @route   DELETE /api/audio-processing/logs/:id
 * @desc    Delete an audio log
 * @access  Protected (requires authentication)
 */
router.delete('/logs/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json(errorResponse('Unauthorized', 401, 'UNAUTHORIZED'));
            return;
        }

        const id = req.params.id;
        if (!id) {
            res.status(400).json(errorResponse('Log ID is required', 400, 'MISSING_ID'));
            return;
        }
        const deleted = await audioProcessingService.deleteAudioLog(id, userId);

        if (!deleted) {
            res.status(404).json(errorResponse('Audio log not found', 404, 'NOT_FOUND'));
            return;
        }

        res.json(successResponse({ deleted: true }, 'Audio log deleted successfully'));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[AudioProcessing] Delete log error:', error);
        res.status(500).json(errorResponse(errorMessage, 500, 'INTERNAL_ERROR'));
    }
});

/**
 * @route   POST /api/audio-processing/summary/generate
 * @desc    Generate a weekly summary (trigger manually)
 * @access  Protected (requires authentication)
 */
router.post('/summary/generate', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json(errorResponse('Unauthorized', 401, 'UNAUTHORIZED'));
            return;
        }

        const dateStr = req.body.date;
        const targetDate = dateStr ? new Date(dateStr) : new Date();

        // Calculate week start (Monday)
        const day = targetDate.getDay();
        const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(targetDate);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Fetch logs for the week
        const { logs } = await audioProcessingService.getAudioLogs(userId, {
            startDate: weekStart,
            endDate: weekEnd,
            limit: 1000 // Get all logs for the week
        });

        if (logs.length === 0) {
            res.status(400).json(errorResponse('No logs found for this week to summarize', 400, 'NO_LOGS'));
            return;
        }

        // Generate summary
        const result = await summaryService.generateWeeklySummary(userId, logs, weekStart);

        res.json(successResponse(result, 'Weekly summary generated successfully'));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[AudioProcessing] Generate summary error:', error);
        res.status(500).json(errorResponse(errorMessage, 500, 'INTERNAL_ERROR'));
    }
});

/**
 * @route   GET /api/audio-processing/summary
 * @desc    Get weekly summary for specific date
 * @access  Protected (requires authentication)
 */
router.get('/summary', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json(errorResponse('Unauthorized', 401, 'UNAUTHORIZED'));
            return;
        }

        const dateStr = req.query.date as string;
        const targetDate = dateStr ? new Date(dateStr) : new Date();

        // Calculate week start (Monday)
        const day = targetDate.getDay();
        const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(targetDate);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(diff);

        const summary = await summaryService.getSummary(userId, weekStart);

        if (!summary) {
            res.status(404).json(errorResponse('Summary not found for this week', 404, 'NOT_FOUND'));
            return;
        }

        res.json(successResponse(summary, 'Weekly summary retrieved successfully'));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('[AudioProcessing] Get summary error:', error);
        res.status(500).json(errorResponse(errorMessage, 500, 'INTERNAL_ERROR'));
    }
});

export const audioProcessingRoutes = router;
export default audioProcessingRoutes;
