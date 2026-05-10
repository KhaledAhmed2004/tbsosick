"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_1 = require("../../../enums/user");
const event_controller_1 = require("./event.controller");
const event_validation_1 = require("./event.validation");
const router = express_1.default.Router();
// 1. Authenticate first (attaches req.user)
router.use((0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN));
// 2. Then check subscription (depends on req.user)
// router.use(subscriptionGate(SUBSCRIPTION_PLAN.PREMIUM));
// Create event
router.post('/', (0, validateRequest_1.default)(event_validation_1.EventValidation.createEventZodSchema), event_controller_1.EventController.createEvent);
// List own events
router.get('/', event_controller_1.EventController.getMyEvents);
// Calendar highlights (unique dates with events)
router.get('/calendar-highlights', (0, validateRequest_1.default)(event_validation_1.EventValidation.getHighlightsZodSchema), event_controller_1.EventController.getCalendarHighlights);
// Event details
router.get('/:eventId', event_controller_1.EventController.getEventById);
// Update event
router.patch('/:eventId', (0, validateRequest_1.default)(event_validation_1.EventValidation.updateEventZodSchema), event_controller_1.EventController.updateEvent);
// Delete event
router.delete('/:eventId', event_controller_1.EventController.deleteEvent);
exports.EventRoutes = router;
