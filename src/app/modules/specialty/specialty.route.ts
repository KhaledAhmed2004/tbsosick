import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { SpecialtyController } from './specialty.controller';
import { SpecialtyValidation } from './specialty.validation';

const router = express.Router();

// Create Specialty (Admin only)
router.post(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SpecialtyValidation.createSpecialtySchema),
  SpecialtyController.createSpecialty,
);

// List all Specialties (Admin and User)
router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.USER),
  SpecialtyController.listSpecialties,
);

// Update Specialty (Admin only)
router.patch(
  '/:specialtyId',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SpecialtyValidation.updateSpecialtySchema),
  SpecialtyController.updateSpecialty,
);

// Delete Specialty (Admin only)
router.delete(
  '/:specialtyId',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(SpecialtyValidation.paramIdSchema),
  SpecialtyController.deleteSpecialty,
);

export const SpecialtyRoutes = router;
