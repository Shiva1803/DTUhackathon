import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { successResponse } from '../utils/response';
import { shareCardService } from '../services/share.service';
import { getWeekId } from '../utils/week.utils';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/share/card
 * @desc    Generate a share card image for the current week summary
 * @access  Private
 * @body    { weekId?: string } (optional, defaults to current week)
 */
router.post(
    '/card',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 },
            });
            return;
        }

        const { weekId } = req.body as { weekId?: string };
        const targetWeekId = weekId || getWeekId();

        logger.info(`Generating share card for user ${req.user.id}, week ${targetWeekId}`);

        const result = await shareCardService.generateShareCard(req.user.id, targetWeekId);

        res.json(
            successResponse(
                {
                    imageUrl: result.imageUrl,
                    weekId: targetWeekId,
                    publicId: result.publicId,
                },
                'Share card generated successfully'
            )
        );
    })
);

/**
 * @route   GET /api/share/card
 * @desc    Get or generate share card for current week
 * @access  Private
 */
router.get(
    '/card',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 },
            });
            return;
        }

        const weekId = (req.query['weekId'] as string) || getWeekId();

        logger.info(`Getting share card for user ${req.user.id}, week ${weekId}`);

        const result = await shareCardService.generateShareCard(req.user.id, weekId);

        res.json(
            successResponse(
                {
                    imageUrl: result.imageUrl,
                    weekId,
                },
                'Share card retrieved'
            )
        );
    })
);

/**
 * @route   GET /api/share/card/image
 * @desc    Get share card image directly (for embedding)
 * @access  Private
 */
router.get(
    '/card/image',
    authenticate,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'User not authenticated', statusCode: 401 },
            });
            return;
        }

        const weekId = (req.query['weekId'] as string) || getWeekId();

        const result = await shareCardService.generateShareCard(req.user.id, weekId);

        res.set('Content-Type', 'image/png');
        res.set('Content-Disposition', `inline; filename="share-card-${weekId}.png"`);
        res.send(result.imageBuffer);
    })
);

export default router;
