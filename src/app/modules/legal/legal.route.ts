// Routes for managing legal pages (Terms, Privacy Policy, etc.)
import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { LegalController } from './legal.controller';
import {
  createLegalPageSchema,
  updateLegalPageSchema,
  paramIdSchema,
} from './legal.validation';

const router = express.Router();

// Create a new legal page (SUPER_ADMIN only)

router.post(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(createLegalPageSchema),
  LegalController.createLegalPage,
);

// Public: list all legal pages
router.get(
  '/',
  LegalController.listLegalPages,
);

// Public: get single legal page by id
router.get(
  '/:id',
  validateRequest(paramIdSchema),
  LegalController.getLegalPageById,
);

// Update legal page (SUPER_ADMIN only)
router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(updateLegalPageSchema),
  LegalController.updateLegalPage,
);

// Delete legal page (SUPER_ADMIN only)
router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(paramIdSchema),
  LegalController.deleteLegalPage,
);

export const LegalRoutes = router;
