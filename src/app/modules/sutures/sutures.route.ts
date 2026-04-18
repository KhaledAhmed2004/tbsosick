import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { SuturesController } from './sutures.controller';
import { SuturesValidation } from './sutures.validation';

const router = express.Router();

// Create Suture
router.post(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SuturesValidation.createSutureSchema),
  SuturesController.createSuture,
);

// List all Sutures
router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  SuturesController.listSutures,
);

// Update Suture — by ID
router.patch(
  '/:sutureId',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SuturesValidation.updateSutureSchema),
  SuturesController.updateSuture,
);

// Delete Suture — by ID
router.delete(
  '/:sutureId',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SuturesValidation.paramIdSchema),
  SuturesController.deleteSuture,
);

// Bulk Create — create multiple sutures
router.post(
  '/bulk',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SuturesValidation.bulkCreateSchema),
  SuturesController.bulkCreate,
);

export const SuturesRoutes = router;