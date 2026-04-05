import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { EventController } from './event.controller';
import { createEventZodSchema, updateEventZodSchema } from './event.validation';

const router = express.Router();

// Create event
router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(createEventZodSchema),
  EventController.createEvent,
);

// List own events
router.get(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  EventController.getMyEvents,
);

// Event details
router.get(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  EventController.getEventById,
);

// Update event
router.patch(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  validateRequest(updateEventZodSchema),
  EventController.updateEvent,
);

// Delete event
router.delete(
  '/:id',
  auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN),
  EventController.deleteEvent,
);

export const EventRoutes = router;
