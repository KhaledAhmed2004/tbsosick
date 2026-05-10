"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecialtyRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_1 = require("../../../enums/user");
const specialty_controller_1 = require("./specialty.controller");
const specialty_validation_1 = require("./specialty.validation");
const router = express_1.default.Router();
// Create Specialty (Admin only)
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(specialty_validation_1.SpecialtyValidation.createSpecialtySchema), specialty_controller_1.SpecialtyController.createSpecialty);
// List all Specialties (Admin and User)
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), specialty_controller_1.SpecialtyController.listSpecialties);
// Update Specialty (Admin only)
router.patch('/:specialtyId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(specialty_validation_1.SpecialtyValidation.updateSpecialtySchema), specialty_controller_1.SpecialtyController.updateSpecialty);
// Delete Specialty (Admin only)
router.delete('/:specialtyId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(specialty_validation_1.SpecialtyValidation.paramIdSchema), specialty_controller_1.SpecialtyController.deleteSpecialty);
exports.SpecialtyRoutes = router;
