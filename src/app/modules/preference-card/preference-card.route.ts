import express, { NextFunction, Request, Response } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { PreferenceCardController } from './preference-card.controller';
import {
  createPreferenceCardSchema,
  updatePreferenceCardSchema,
  paramIdSchema,
} from './preference-card.validation';
import { fileHandler } from '../../middlewares/fileHandler';

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

// List all own cards
router.get(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PreferenceCardController.listMyCards,
);

// List all public cards
router.get(
  '/public',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PreferenceCardController.listPublicCards,
);
// List all private cards for the authenticated user
router.get(
  '/private',
  auth(USER_ROLES.USER),
  PreferenceCardController.listPrivateCards,
);

// List all favorite cards for the authenticated user
router.get(
  '/favorites',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PreferenceCardController.listFavoriteCards,
);

// Cards count: public cards and user's own cards
router.get(
  '/count',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  PreferenceCardController.countCards,
);

// Card details view by ID
router.get(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(paramIdSchema),
  PreferenceCardController.getById,
);

// Update card by ID
router.patch(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  fileHandler([{ name: 'photoLibrary', maxCount: 5 }]),
  parseBody,
  validateRequest(updatePreferenceCardSchema),
  PreferenceCardController.updateCard,
);

// Delete card by ID
router.delete(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(paramIdSchema),
  PreferenceCardController.deleteCard,
);

// Increment download count
router.post(
  '/:id/download',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(paramIdSchema),
  PreferenceCardController.incrementDownloadCount,
);

// Favorite preference card
router.post(
  '/:id/favorite',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(paramIdSchema),
  PreferenceCardController.favoriteCard,
);

// Unfavorite preference card
router.delete(
  '/:id/favorite',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(paramIdSchema),
  PreferenceCardController.unfavoriteCard,
);

// Approve preference card (set verificationStatus = VERIFIED) — super admin only
router.patch(
  '/:id/approve',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(paramIdSchema),
  PreferenceCardController.approveCard,
);

// Reject preference card (set verificationStatus = UNVERIFIED) — super admin only
router.patch(
  '/:id/reject',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(paramIdSchema),
  PreferenceCardController.rejectCard,
);

export const PreferenceCardRoutes = router;
