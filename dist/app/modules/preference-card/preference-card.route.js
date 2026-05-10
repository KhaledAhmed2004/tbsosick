"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const subscriptionGate_1 = __importDefault(require("../../middlewares/subscriptionGate"));
const subscription_interface_1 = require("../subscription/subscription.interface");
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
                // Deep parse objects within arrays if they are still strings
                if (Array.isArray(req.body[field])) {
                    req.body[field] = req.body[field].map((item) => {
                        if (typeof item === 'string') {
                            try {
                                return JSON.parse(item);
                            }
                            catch (_a) {
                                return item;
                            }
                        }
                        return item;
                    });
                }
            }
        });
        if (req.body.visibility && typeof req.body.visibility === 'string') {
            req.body.visibility = req.body.visibility.toUpperCase();
        }
    }
    next();
};
/**
 * Roadmap §8: Library access (visibility=PUBLIC) is a paid feature.
 * We gate this specifically when the user requests the public list.
 */
const libraryGate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.query.visibility === 'PUBLIC') {
        return (0, subscriptionGate_1.default)(subscription_interface_1.SUBSCRIPTION_PLAN.PREMIUM)(req, res, next);
    }
    next();
});
// Create card
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, subscriptionGate_1.default)(subscription_interface_1.SUBSCRIPTION_PLAN.FREE), (0, fileHandler_1.fileHandler)([{ name: 'photoLibrary', maxCount: 5 }]), parseBody, (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.createPreferenceCardSchema), preference_card_controller_1.PreferenceCardController.createCard);
// Search/List cards (Public by default)
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), libraryGate, (0, rateLimit_1.rateLimitMiddleware)({
    windowMs: 60000,
    max: 60,
    routeName: 'search-preference-cards',
}), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.searchCardsSchema), preference_card_controller_1.PreferenceCardController.getCards);
// List my own cards (Public + Private created by me)
router.get('/my-cards', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.searchCardsSchema), preference_card_controller_1.PreferenceCardController.listPrivateCards);
// Cards count (Stats): public cards and user's own cards
router.get('/stats', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), preference_card_controller_1.PreferenceCardController.getStats);
// Card details view by ID
router.get('/:cardId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(zod_1.z.object({ params: zod_1.z.object({ cardId: zod_1.z.string() }) })), preference_card_controller_1.PreferenceCardController.getById);
// Update card by ID
router.patch('/:cardId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, fileHandler_1.fileHandler)([{ name: 'photoLibrary', maxCount: 5 }]), parseBody, (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.updatePreferenceCardSchema), preference_card_controller_1.PreferenceCardController.updateCard);
// Delete card by ID
router.delete('/:cardId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(preference_card_validation_1.PreferenceCardValidation.paramIdSchema), preference_card_controller_1.PreferenceCardController.deleteCard);
// Download preference card
router.post('/:cardId/download', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.SUPER_ADMIN), (0, subscriptionGate_1.default)(subscription_interface_1.SUBSCRIPTION_PLAN.PREMIUM), (0, rateLimit_1.rateLimitMiddleware)({
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
exports.PreferenceCardRoutes = router;
