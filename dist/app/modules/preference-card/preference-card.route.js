"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceCardRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_1 = require("../../../enums/user");
const preference_card_controller_1 = require("./preference-card.controller");
const preference_card_validation_1 = require("./preference-card.validation");
const fileHandler_1 = require("../../middlewares/fileHandler");
const router = express_1.default.Router();
const parseBody = (req, res, next) => {
    if (!req.body.data) {
        if (req.body.surgeon && typeof req.body.surgeon === 'string') {
            try {
                req.body.surgeon = JSON.parse(req.body.surgeon);
            }
            catch (e) {
                // ignore
            }
        }
        // Handle array fields
        ['supplies', 'sutures', 'photoLibrary'].forEach((field) => {
            if (req.body[field]) {
                if (typeof req.body[field] === 'string') {
                    try {
                        const parsed = JSON.parse(req.body[field]);
                        req.body[field] = Array.isArray(parsed) ? parsed : [parsed];
                    }
                    catch (_a) {
                        req.body[field] = [req.body[field]];
                    }
                }
                else if (!Array.isArray(req.body[field])) {
                    req.body[field] = [req.body[field]];
                }
            }
        });
        if (req.body.published && typeof req.body.published === 'string') {
            req.body.published = req.body.published === 'true';
        }
    }
    next();
};
// Create card
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, fileHandler_1.fileHandler)([{ name: 'photoLibrary', maxCount: 5 }]), parseBody, (0, validateRequest_1.default)(preference_card_validation_1.createPreferenceCardSchema), preference_card_controller_1.PreferenceCardController.createCard);
// List all own cards
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), preference_card_controller_1.PreferenceCardController.listMyCards);
// List all public cards
router.get('/public', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), preference_card_controller_1.PreferenceCardController.listPublicCards);
// List all private cards for the authenticated user
router.get('/private', (0, auth_1.default)(user_1.USER_ROLES.USER), preference_card_controller_1.PreferenceCardController.listPrivateCards);
// List all favorite cards for the authenticated user
router.get('/favorites', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), preference_card_controller_1.PreferenceCardController.listFavoriteCards);
// Cards count: public cards and user's own cards
router.get('/count', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), preference_card_controller_1.PreferenceCardController.countCards);
// Card details view by ID
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.paramIdSchema), preference_card_controller_1.PreferenceCardController.getById);
// Update card by ID
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, fileHandler_1.fileHandler)([{ name: 'photoLibrary', maxCount: 5 }]), parseBody, (0, validateRequest_1.default)(preference_card_validation_1.updatePreferenceCardSchema), preference_card_controller_1.PreferenceCardController.updateCard);
// Delete card by ID
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.paramIdSchema), preference_card_controller_1.PreferenceCardController.deleteCard);
// Increment download count
router.post('/:id/download', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.paramIdSchema), preference_card_controller_1.PreferenceCardController.incrementDownloadCount);
// Favorite preference card
router.post('/:id/favorite', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.paramIdSchema), preference_card_controller_1.PreferenceCardController.favoriteCard);
// Unfavorite preference card
router.delete('/:id/favorite', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.paramIdSchema), preference_card_controller_1.PreferenceCardController.unfavoriteCard);
// Approve preference card (set verificationStatus = VERIFIED) — super admin only
router.patch('/:id/approve', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.paramIdSchema), preference_card_controller_1.PreferenceCardController.approveCard);
// Reject preference card (set verificationStatus = UNVERIFIED) — super admin only
router.patch('/:id/reject', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.paramIdSchema), preference_card_controller_1.PreferenceCardController.rejectCard);
exports.PreferenceCardRoutes = router;
