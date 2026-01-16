"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const response_1 = require("../utils/response");
const audio_service_1 = require("../services/audio.service");
const ai_service_1 = require("../services/ai.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
/**
 * Allowed audio MIME types (MP3, WAV, and WebM for browser compatibility)
 */
const ALLOWED_AUDIO_TYPES = [
    'audio/mp3',
    'audio/mpeg', // MP3
    'audio/wav',
    'audio/x-wav', // WAV
    'audio/wave',
    'audio/webm', // WebM (browser default)
    'audio/ogg', // Ogg Vorbis
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
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new error_middleware_1.ValidationError(`Invalid file type: ${file.mimetype}. Only MP3 and WAV files are allowed.`));
        }
    },
});
/**
 * Handle multer errors (file size, etc.)
 */
const handleMulterError = (err, res) => {
    if (err instanceof multer_1.default.MulterError) {
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
router.post('/', auth_middleware_1.authenticate, (req, res, next) => {
    // Custom wrapper to handle multer errors properly
    upload.single('audio')(req, res, (err) => {
        if (err) {
            if (handleMulterError(err, res))
                return;
            if (err instanceof error_middleware_1.ValidationError) {
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
}, (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
    logger_1.logger.info(`Audio upload received from user ${req.user.id}`, {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
    });
    try {
        // Process the audio upload:
        // 1. Upload to Cloudinary (if configured, else skip)
        // 2. Transcribe via OnDemand Media API
        // 3. Save to AudioLog
        const result = await audio_service_1.audioService.processAudioUpload(req.user.id, req.file.buffer, req.file.mimetype, req.file.originalname);
        // Update user streak
        const { User } = await Promise.resolve().then(() => __importStar(require('../models/User')));
        const user = await User.findById(req.user.id);
        if (user) {
            await user.updateStreak();
            logger_1.logger.info(`Streak updated for user ${req.user.id}: ${user.streakCount} days`);
        }
        // Optionally categorize the transcript asynchronously
        ai_service_1.aiService.categorizeAudioLog(result.audioLog._id.toString(), req.user.id)
            .catch((error) => logger_1.logger.error('Background categorization failed:', error));
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
    }
    catch (error) {
        // Error: Cloudinary/upload failure or transcription failure
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('Cloudinary')) {
            logger_1.logger.error('Cloudinary upload failure:', error);
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
            logger_1.logger.error('Transcription failure:', error);
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
}));
/**
 * @route   GET /api/log
 * @desc    Get audio logs for the current user
 * @access  Private
 * @query   page, limit, startDate, endDate, category
 */
router.get('/', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: { message: 'User not authenticated', statusCode: 401 },
        });
        return;
    }
    const { page, limit } = (0, response_1.parsePagination)(req.query);
    const skip = (page - 1) * limit;
    // Parse optional filters
    const startDate = req.query['startDate'] ? new Date(req.query['startDate']) : undefined;
    const endDate = req.query['endDate'] ? new Date(req.query['endDate']) : undefined;
    const category = req.query['category'];
    const { logs, total } = await audio_service_1.audioService.getAudioLogs(req.user.id, {
        limit,
        skip,
        startDate,
        endDate,
        category,
    });
    res.json((0, response_1.paginatedResponse)(logs, total, page, limit));
}));
/**
 * @route   GET /api/log/:id
 * @desc    Get a specific audio log
 * @access  Private
 */
router.get('/:id', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
    const log = await audio_service_1.audioService.getAudioLog(logId, req.user.id);
    if (!log) {
        res.status(404).json({
            success: false,
            error: { message: 'Audio log not found', statusCode: 404 },
        });
        return;
    }
    res.json((0, response_1.successResponse)(log));
}));
/**
 * @route   DELETE /api/log/:id
 * @desc    Delete an audio log (also removes from Cloudinary if stored there)
 * @access  Private
 */
router.delete('/:id', auth_middleware_1.authenticate, (0, error_middleware_1.asyncHandler)(async (req, res) => {
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
    const deleted = await audio_service_1.audioService.deleteAudioLog(logId, req.user.id);
    if (!deleted) {
        res.status(404).json({
            success: false,
            error: { message: 'Audio log not found', statusCode: 404 },
        });
        return;
    }
    res.json((0, response_1.successResponse)(null, 'Audio log deleted successfully'));
}));
exports.default = router;
//# sourceMappingURL=log.routes.js.map