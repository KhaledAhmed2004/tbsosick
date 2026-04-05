"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const doctor_controller_1 = require("./doctor.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const doctor_validation_1 = require("./doctor.validation");
const router = express_1.default.Router();
// POST /doctors — Create doctor (SUPER_ADMIN, validated)
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(doctor_validation_1.DoctorValidation.createDoctorSchema), doctor_controller_1.DoctorController.createDoctor);
// GET /doctors — List/search doctors (SUPER_ADMIN)
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), doctor_controller_1.DoctorController.getDoctors);
// PATCH /doctors/:id/block — Block doctor (SUPER_ADMIN)
router.patch('/:id/block', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), doctor_controller_1.DoctorController.blockDoctor);
// PATCH /doctors/:id/unblock — Unblock doctor (SUPER_ADMIN)
router.patch('/:id/unblock', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), doctor_controller_1.DoctorController.unblockDoctor);
// DELETE /doctors/:id — Delete doctor (SUPER_ADMIN)
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), doctor_controller_1.DoctorController.deleteDoctor);
// PATCH /doctors/:id — Update doctor (SUPER_ADMIN, validated)
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(doctor_validation_1.DoctorValidation.updateDoctorSchema), doctor_controller_1.DoctorController.updateDoctor);
exports.DoctorRoutes = router;
