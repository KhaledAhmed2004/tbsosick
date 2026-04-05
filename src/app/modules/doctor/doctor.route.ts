import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { DoctorController } from './doctor.controller';
import validateRequest from '../../middlewares/validateRequest';
import { DoctorValidation } from './doctor.validation';

const router = express.Router();

// POST /doctors — Create doctor (SUPER_ADMIN, validated)
router.post(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(DoctorValidation.createDoctorSchema),
  DoctorController.createDoctor
);

// GET /doctors — List/search doctors (SUPER_ADMIN)
router.get('/', auth(USER_ROLES.SUPER_ADMIN), DoctorController.getDoctors);

// PATCH /doctors/:id/block — Block doctor (SUPER_ADMIN)
router.patch('/:id/block', auth(USER_ROLES.SUPER_ADMIN), DoctorController.blockDoctor);

// PATCH /doctors/:id/unblock — Unblock doctor (SUPER_ADMIN)
router.patch('/:id/unblock', auth(USER_ROLES.SUPER_ADMIN), DoctorController.unblockDoctor);

// DELETE /doctors/:id — Delete doctor (SUPER_ADMIN)
router.delete('/:id', auth(USER_ROLES.SUPER_ADMIN), DoctorController.deleteDoctor);

// PATCH /doctors/:id — Update doctor (SUPER_ADMIN, validated)
router.patch(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  validateRequest(DoctorValidation.updateDoctorSchema),
  DoctorController.updateDoctor
);

export const DoctorRoutes = router;