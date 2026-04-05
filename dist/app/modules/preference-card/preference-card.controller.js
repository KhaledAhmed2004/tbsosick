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
exports.PreferenceCardController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const preference_card_service_1 = require("./preference-card.service");
exports.PreferenceCardController = {
    createCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.createPreferenceCardInDB(user.id, req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            message: 'Preference card created',
            data: result,
        });
    })),
    listMyCards: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.listPreferenceCardsForUserFromDB(user.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference cards fetched',
            data: result,
        });
    })),
    getById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.getPreferenceCardByIdFromDB(req.params.id, user.id, user.role);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card details fetched',
            data: result,
        });
    })),
    updateCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.updatePreferenceCardInDB(req.params.id, user.id, user.role, req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card updated',
            data: result,
        });
    })),
    deleteCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.deletePreferenceCardFromDB(req.params.id, user.id, user.role);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card deleted',
            data: result,
        });
    })),
    incrementDownloadCount: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.incrementDownloadCountInDB(req.params.id, user.id, user.role);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Download count incremented',
            data: result,
        });
    })),
    favoriteCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.favoritePreferenceCardInDB(req.params.id, user.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card favorited',
            data: result,
        });
    })),
    unfavoriteCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.unfavoritePreferenceCardInDB(req.params.id, user.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card unfavorited',
            data: result,
        });
    })),
    listPublicCards: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const [cards, favoriteCardIds] = yield Promise.all([
            preference_card_service_1.PreferenceCardService.listPublicPreferenceCardsFromDB(req.query),
            preference_card_service_1.PreferenceCardService.getFavoriteCardIdsForUser(user.id),
        ]);
        const favoriteSet = new Set(favoriteCardIds.map(id => id.toString()));
        const summarized = cards.data.map((doc) => {
            var _a, _b;
            return ({
                _id: doc._id,
                cardTitle: doc.cardTitle,
                surgeonName: (_a = doc.surgeon) === null || _a === void 0 ? void 0 : _a.fullName,
                surgeonSpecialty: (_b = doc.surgeon) === null || _b === void 0 ? void 0 : _b.specialty,
                isVerified: doc.verificationStatus === 'VERIFIED',
                isFavorite: favoriteSet.has(doc._id.toString()),
                totalDownloads: doc.downloadCount || 0,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            });
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Public cards fetched successfully',
            pagination: cards.pagination,
            data: summarized,
        });
    })),
    listPrivateCards: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const [cards, favoriteCardIds] = yield Promise.all([
            preference_card_service_1.PreferenceCardService.listPrivatePreferenceCardsForUserFromDB(user.id, req.query),
            preference_card_service_1.PreferenceCardService.getFavoriteCardIdsForUser(user.id),
        ]);
        const favoriteSet = new Set(favoriteCardIds.map(id => id.toString()));
        const summarized = cards.data.map((doc) => {
            var _a, _b;
            return ({
                _id: doc._id,
                cardTitle: doc.cardTitle,
                surgeonName: (_a = doc.surgeon) === null || _a === void 0 ? void 0 : _a.fullName,
                surgeonSpecialty: (_b = doc.surgeon) === null || _b === void 0 ? void 0 : _b.specialty,
                isVerified: doc.verificationStatus === 'VERIFIED',
                isFavorite: favoriteSet.has(doc._id.toString()),
                totalDownloads: doc.downloadCount || 0,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            });
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Private cards fetched successfully',
            pagination: cards.pagination,
            data: summarized,
        });
    })),
    listFavoriteCards: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const [cards, favoriteCardIds] = yield Promise.all([
            preference_card_service_1.PreferenceCardService.listFavoritePreferenceCardsForUserFromDB(user.id, req.query),
            preference_card_service_1.PreferenceCardService.getFavoriteCardIdsForUser(user.id),
        ]);
        const favoriteSet = new Set(favoriteCardIds.map(id => id.toString()));
        const summarized = cards.data.map((doc) => {
            var _a, _b;
            return ({
                _id: doc._id,
                cardTitle: doc.cardTitle,
                surgeonName: (_a = doc.surgeon) === null || _a === void 0 ? void 0 : _a.fullName,
                surgeonSpecialty: (_b = doc.surgeon) === null || _b === void 0 ? void 0 : _b.specialty,
                isVerified: doc.verificationStatus === 'VERIFIED',
                isFavorite: favoriteSet.has(doc._id.toString()),
                totalDownloads: doc.downloadCount || 0,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            });
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Favorite cards fetched successfully',
            pagination: cards.pagination,
            data: summarized,
        });
    })),
    countCards: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.getCountsForCards(user.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Card counts fetched successfully',
            data: result,
        });
    })),
    approveCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.updateVerificationStatusInDB(req.params.id, user.role, 'VERIFIED');
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card approved',
            data: result,
        });
    })),
    rejectCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.updateVerificationStatusInDB(req.params.id, user.role, 'UNVERIFIED');
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card rejected',
            data: result,
        });
    })),
};
