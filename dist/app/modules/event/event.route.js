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
// Create event
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(event_validation_1.EventValidation.createEventZodSchema), event_controller_1.EventController.createEvent);
// List own events
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), event_controller_1.EventController.getMyEvents);
// Event details
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), event_controller_1.EventController.getEventById);
// Update event
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(event_validation_1.EventValidation.updateEventZodSchema), event_controller_1.EventController.updateEvent);
// Delete event
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), event_controller_1.EventController.deleteEvent);
exports.EventRoutes = router;
