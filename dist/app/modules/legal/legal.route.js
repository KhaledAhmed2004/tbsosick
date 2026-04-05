"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalRoutes = void 0;
// Routes for managing legal pages (Terms, Privacy Policy, etc.)
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_1 = require("../../../enums/user");
const legal_controller_1 = require("./legal.controller");
const legal_validation_1 = require("./legal.validation");
const router = express_1.default.Router();
// Create a new legal page (SUPER_ADMIN only)
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(legal_validation_1.createLegalPageSchema), legal_controller_1.LegalController.createLegalPage);
// Public: list all legal pages
router.get('/', legal_controller_1.LegalController.listLegalPages);
// Public: get single legal page by id
router.get('/:id', (0, validateRequest_1.default)(legal_validation_1.paramIdSchema), legal_controller_1.LegalController.getLegalPageById);
// Update legal page (SUPER_ADMIN only)
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(legal_validation_1.updateLegalPageSchema), legal_controller_1.LegalController.updateLegalPage);
// Delete legal page (SUPER_ADMIN only)
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(legal_validation_1.paramIdSchema), legal_controller_1.LegalController.deleteLegalPage);
exports.LegalRoutes = router;
