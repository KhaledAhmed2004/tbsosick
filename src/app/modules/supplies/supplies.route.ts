import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { SuppliesController } from './supplies.controller';
import { SuppliesValidation } from './supplies.validation';

const router = express.Router();

// Create Supply
router.post(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SuppliesValidation.createSupplySchema),
  SuppliesController.createSupply,
);

// List all Supplies
router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN,USER_ROLES.USER),
  SuppliesController.listSupplies,
);

// Update Supply — by ID
router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SuppliesValidation.updateSupplySchema),
  SuppliesController.updateSupply,
);

// Delete Supply — by ID
router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SuppliesValidation.paramIdSchema),
  SuppliesController.deleteSupply,
);

// Bulk Create — create multiple supplies
router.post(
  '/bulk',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SuppliesValidation.bulkCreateSchema),
  SuppliesController.bulkCreate,
);

export const SuppliesRoutes = router;