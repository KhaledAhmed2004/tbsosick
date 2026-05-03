import express, { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { PreferenceCardController } from './preference-card.controller';
import { PreferenceCardValidation } from './preference-card.validation';
import { fileHandler } from '../../middlewares/fileHandler';
import { rateLimitMiddleware } from '../../middlewares/rateLimit';

const router = express.Router();

const parseBody = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.data) {
    if (req.body.surgeon && typeof req.body.surgeon === 'string') {
      try {
        req.body.surgeon = JSON.parse(req.body.surgeon);
      } catch (e) {
        // ignore
      }
    }

    // Handle array fields
    ['supplies', 'sutures', 'photoLibrary'].forEach(field => {
      if (req.body[field]) {
        if (typeof req.body[field] === 'string') {
          try {
            const parsed = JSON.parse(req.body[field]);
            req.body[field] = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            req.body[field] = [req.body[field]];
          }
        } else if (!Array.isArray(req.body[field])) {
          req.body[field] = [req.body[field]];
        }
      }
    });

    if (req.body.published && typeof req.body.published === 'string') {
      req.body.published = req.body.published === 'true';
    }
  }
  next();
};

// Create card
router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  fileHandler([{ name: 'photoLibrary', maxCount: 5 }]),
  parseBody,
  validateRequest(PreferenceCardValidation.createPreferenceCardSchema),
  PreferenceCardController.createCard,
);

// Search/List cards (Public by default)
router.get(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  rateLimitMiddleware({
    windowMs: 60_000,
    max: 60,
    routeName: 'search-preference-cards',
  }),
  validateRequest(PreferenceCardValidation.searchCardsSchema),
  PreferenceCardController.getCards,
);

// Cards count (Stats): public cards and user's own cards
router.get(
  '/stats',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PreferenceCardController.getStats,
);

// Fetch distinct specialties
router.get(
  '/specialties',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PreferenceCardController.getSpecialties,
);

// Card details view by ID
router.get(
  '/:cardId',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(z.object({ params: z.object({ cardId: z.string() }) })),
  PreferenceCardController.getById,
);

// Update card by ID
router.patch(
  '/:cardId',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  fileHandler([{ name: 'photoLibrary', maxCount: 5 }]),
  parseBody,
  validateRequest(PreferenceCardValidation.updatePreferenceCardSchema),
  PreferenceCardController.updateCard,
);

// Delete card by ID
router.delete(
  '/:cardId',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.deleteCard,
);

// Download preference card
router.post(
  '/:cardId/download',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  rateLimitMiddleware({
    windowMs: 60_000,
    max: 20,
    routeName: 'download-preference-card',
  }),
  validateRequest(PreferenceCardValidation.downloadPreferenceCardSchema),
  PreferenceCardController.downloadCard,
);

// Favorite preference card (item-centric path)
router.put(
  '/:cardId/favorite',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.favoriteCard,
);

// Unfavorite preference card (item-centric path)
router.delete(
  '/:cardId/favorite',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.unfavoriteCard,
);

// DEPRECATED: legacy favorite path. Use `PUT /:cardId/favorite` (above).
// Kept as an alias for backward compatibility — remove once mobile clients migrate.
router.put(
  '/favorites/cards/:cardId',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.favoriteCard,
);

// DEPRECATED: legacy unfavorite path. Use `DELETE /:cardId/favorite` (above).
router.delete(
  '/favorites/cards/:cardId',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.unfavoriteCard,
);

// Update verification status (APPROVE/REJECT)
router.patch(
  '/:cardId/status',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.updateVerificationStatusSchema),
  PreferenceCardController.updateVerificationStatus,
);

export const PreferenceCardRoutes = router;
