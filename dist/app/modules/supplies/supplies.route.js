"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuppliesRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_1 = require("../../../enums/user");
const supplies_controller_1 = require("./supplies.controller");
const supplies_validation_1 = require("./supplies.validation");
const router = express_1.default.Router();
// Create Supply
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(supplies_validation_1.SuppliesValidation.createSupplySchema), supplies_controller_1.SuppliesController.createSupply);
// List all Supplies
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), supplies_controller_1.SuppliesController.listSupplies);
// Update Supply — by ID
router.patch('/:supplyId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(supplies_validation_1.SuppliesValidation.updateSupplySchema), supplies_controller_1.SuppliesController.updateSupply);
// Delete Supply — by ID
router.delete('/:supplyId', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(supplies_validation_1.SuppliesValidation.paramIdSchema), supplies_controller_1.SuppliesController.deleteSupply);
// Bulk Create — create multiple supplies
router.post('/bulk', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(supplies_validation_1.SuppliesValidation.bulkCreateSchema), supplies_controller_1.SuppliesController.bulkCreate);
exports.SuppliesRoutes = router;
