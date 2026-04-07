import express, { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { PreferenceCardController } from './preference-card.controller';
import {
  PreferenceCardValidation,
  createPreferenceCardSchema,
  updatePreferenceCardSchema,
} from './preference-card.validation';
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
    ['supplies', 'sutures', 'photoLibrary'].forEach((field) => {
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
  validateRequest(createPreferenceCardSchema),
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

// List all private cards for the authenticated user
router.get(
  '/private',
  auth(USER_ROLES.USER),
  PreferenceCardController.listPrivateCards,
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
  validateRequest(updatePreferenceCardSchema),
  PreferenceCardController.updateCard,
);

// Delete card by ID
router.delete(
  '/:cardId',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.deleteCard,
);

// Increment download count
router.post(
  '/:cardId/download',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.incrementDownloadCount,
);

// Favorite preference card
router.post(
  '/:cardId/favorite',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.favoriteCard,
);

// Unfavorite preference card
router.delete(
  '/:cardId/favorite',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.unfavoriteCard,
);

// Approve preference card (set verificationStatus = VERIFIED) — super admin only
router.patch(
  '/:cardId/approve',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.approveCard,
);

// Reject preference card (set verificationStatus = UNVERIFIED) — super admin only
router.patch(
  '/:cardId/reject',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(PreferenceCardValidation.paramIdSchema),
  PreferenceCardController.rejectCard,
);

export const PreferenceCardRoutes = router;
