import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';
import { EventController } from './event.controller';
import { EventValidation } from './event.validation';
import subscriptionGate from '../../middlewares/subscriptionGate';
import { SUBSCRIPTION_PLAN } from '../subscription/subscription.interface';

const router = express.Router();

// 1. Authenticate first (attaches req.user)
router.use(auth(USER_ROLES.USER, USER_ROLES.SUPER_ADMIN));

// 2. Then check subscription (depends on req.user)
// router.use(subscriptionGate(SUBSCRIPTION_PLAN.PREMIUM));

// Create event
router.post(
  '/',
  validateRequest(EventValidation.createEventZodSchema),
  EventController.createEvent,
);

// List own events
router.get('/', EventController.getMyEvents);

// Calendar highlights (unique dates with events)
router.get(
  '/calendar-highlights',
  validateRequest(EventValidation.getHighlightsZodSchema),
  EventController.getCalendarHighlights,
);

// Event details
router.get('/:eventId', EventController.getEventById);

// Update event
router.patch(
  '/:eventId',
  validateRequest(EventValidation.updateEventZodSchema),
  EventController.updateEvent,
);

// Delete event
router.delete('/:eventId', EventController.deleteEvent);

export const EventRoutes = router;
