"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuturesRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_1 = require("../../../enums/user");
const sutures_controller_1 = require("./sutures.controller");
const sutures_validation_1 = require("./sutures.validation");
const router = express_1.default.Router();
// Create Suture
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(sutures_validation_1.createSutureSchema), sutures_controller_1.SuturesController.createSuture);
// List all Sutures
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), sutures_controller_1.SuturesController.listSutures);
// Update Suture — by ID
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(sutures_validation_1.updateSutureSchema), sutures_controller_1.SuturesController.updateSuture);
// Delete Suture — by ID
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(sutures_validation_1.paramIdSchema), sutures_controller_1.SuturesController.deleteSuture);
// Bulk Create — create multiple sutures
router.post('/bulk', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(sutures_validation_1.bulkCreateSchema), sutures_controller_1.SuturesController.bulkCreate);
exports.SuturesRoutes = router;
