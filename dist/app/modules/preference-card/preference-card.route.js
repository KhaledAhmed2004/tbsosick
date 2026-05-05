"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceCardRoutes = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_1 = require("../../../enums/user");
const preference_card_controller_1 = require("./preference-card.controller");
const preference_card_validation_1 = require("./preference-card.validation");
const fileHandler_1 = require("../../middlewares/fileHandler");
const rateLimit_1 = require("../../middlewares/rateLimit");
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
        ['supplies', 'sutures', 'photoLibrary'].forEach(field => {
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
        if (req.body.visibility && typeof req.body.visibility === 'string') {
            req.body.visibility = req.body.visibility.toUpperCase();
        }
    }
    next();
};
// Create card
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, fileHandler_1.fileHandler)([{ name: 'photoLibrary', maxCount: 5 }]), parseBody, (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.createPreferenceCardSchema), preference_card_controller_1.PreferenceCardController.createCard);
// Search/List cards (Public by default)
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, rateLimit_1.rateLimitMiddleware)({
    windowMs: 60000,
    max: 60,
    routeName: 'search-preference-cards',
}), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.searchCardsSchema), preference_card_controller_1.PreferenceCardController.getCards);
// Cards count (Stats): public cards and user's own cards
router.get('/stats', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), preference_card_controller_1.PreferenceCardController.getStats);
// Fetch distinct specialties
router.get('/specialties', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), preference_card_controller_1.PreferenceCardController.getSpecialties);
// Card details view by ID
router.get('/:cardId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(zod_1.z.object({ params: zod_1.z.object({ cardId: zod_1.z.string() }) })), preference_card_controller_1.PreferenceCardController.getById);
// Update card by ID
router.patch('/:cardId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, fileHandler_1.fileHandler)([{ name: 'photoLibrary', maxCount: 5 }]), parseBody, (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.updatePreferenceCardSchema), preference_card_controller_1.PreferenceCardController.updateCard);
// Delete card by ID
router.delete('/:cardId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.paramIdSchema), preference_card_controller_1.PreferenceCardController.deleteCard);
// Download preference card
router.post('/:cardId/download', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, rateLimit_1.rateLimitMiddleware)({
    windowMs: 60000,
    max: 20,
    routeName: 'download-preference-card',
}), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.downloadPreferenceCardSchema), preference_card_controller_1.PreferenceCardController.downloadCard);
// Favorite preference card (item-centric path)
router.put('/:cardId/favorite', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.paramIdSchema), preference_card_controller_1.PreferenceCardController.favoriteCard);
// Unfavorite preference card (item-centric path)
router.delete('/:cardId/favorite', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.paramIdSchema), preference_card_controller_1.PreferenceCardController.unfavoriteCard);
// DEPRECATED: legacy favorite path. Use `PUT /:cardId/favorite` (above).
// Kept as an alias for backward compatibility — remove once mobile clients migrate.
router.put('/favorites/cards/:cardId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.paramIdSchema), preference_card_controller_1.PreferenceCardController.favoriteCard);
// DEPRECATED: legacy unfavorite path. Use `DELETE /:cardId/favorite` (above).
router.delete('/favorites/cards/:cardId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.paramIdSchema), preference_card_controller_1.PreferenceCardController.unfavoriteCard);
// Update verification status (APPROVE/REJECT)
router.patch('/:cardId/status', (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.updateVerificationStatusSchema), preference_card_controller_1.PreferenceCardController.updateVerificationStatus);
exports.PreferenceCardRoutes = router;
