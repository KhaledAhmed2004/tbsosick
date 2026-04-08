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
    // Unified list/search method (Step 4 & 7)
    getCards: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const { visibility } = req.query;
        let result;
        if (visibility === 'private') {
            result = yield preference_card_service_1.PreferenceCardService.listPrivatePreferenceCardsForUserFromDB(user.id, req.query);
        }
        else {
            // Default to public
            result = yield preference_card_service_1.PreferenceCardService.listPublicPreferenceCardsFromDB(req.query);
        }
        const [favoriteCardIds] = yield Promise.all([
            preference_card_service_1.PreferenceCardService.getFavoriteCardIdsForUser(user.id),
        ]);
        const favoriteSet = new Set(favoriteCardIds.map(id => id.toString()));
        const summarized = result.data.map((doc) => {
            var _a, _b;
            return ({
                id: doc.id || doc._id,
                cardTitle: doc.cardTitle,
                surgeon: {
                    name: (_a = doc.surgeon) === null || _a === void 0 ? void 0 : _a.fullName,
                    specialty: (_b = doc.surgeon) === null || _b === void 0 ? void 0 : _b.specialty,
                },
                verificationStatus: doc.verificationStatus,
                isFavorited: favoriteSet.has((doc.id || doc._id).toString()),
                downloadCount: doc.downloadCount || 0,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            });
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: `${visibility === 'private' ? 'Private' : 'Public'} preference cards fetched successfully`,
            meta: result.meta,
            data: summarized,
        });
    })),
    listPrivateCards: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.listPrivatePreferenceCardsForUserFromDB(user.id, req.query);
        const [favoriteCardIds] = yield Promise.all([
            preference_card_service_1.PreferenceCardService.getFavoriteCardIdsForUser(user.id),
        ]);
        const favoriteSet = new Set(favoriteCardIds.map(id => id.toString()));
        const summarized = result.data.map((doc) => {
            var _a, _b;
            return ({
                id: doc.id || doc._id,
                cardTitle: doc.cardTitle,
                surgeon: {
                    name: (_a = doc.surgeon) === null || _a === void 0 ? void 0 : _a.fullName,
                    specialty: (_b = doc.surgeon) === null || _b === void 0 ? void 0 : _b.specialty,
                },
                verificationStatus: doc.verificationStatus,
                isFavorited: favoriteSet.has((doc.id || doc._id).toString()),
                downloadCount: doc.downloadCount || 0,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            });
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Private preference cards fetched successfully',
            meta: result.meta,
            data: summarized,
        });
    })),
    getById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.getPreferenceCardByIdFromDB(req.params.cardId, user.id, user.role);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card details fetched',
            data: result,
        });
    })),
    updateCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.updatePreferenceCardInDB(req.params.cardId, user.id, user.role, req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card updated',
            data: result,
        });
    })),
    deleteCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.deletePreferenceCardFromDB(req.params.cardId, user.id, user.role);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card deleted',
            data: result,
        });
    })),
    incrementDownloadCount: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.incrementDownloadCountInDB(req.params.cardId, user.id, user.role);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Download count incremented',
            data: result,
        });
    })),
    favoriteCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.favoritePreferenceCardInDB(req.params.cardId, user.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card favorited',
            data: result,
        });
    })),
    unfavoriteCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.unfavoritePreferenceCardInDB(req.params.cardId, user.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card unfavorited',
            data: result,
        });
    })),
    getStats: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        // BOLA Mitigation: derive userId from token, not query params
        const result = yield preference_card_service_1.PreferenceCardService.getCountsForCards(user.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Card statistics retrieved successfully',
            data: {
                publicCards: result.AllCardsCount,
                myCards: result.myCardsCount,
            },
        });
    })),
    getSpecialties: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield preference_card_service_1.PreferenceCardService.getDistinctSpecialtiesFromDB();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Specialties retrieved successfully',
            data: result,
        });
    })),
    approveCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.updateVerificationStatusInDB(req.params.cardId, user.role, 'VERIFIED');
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card approved',
            data: result,
        });
    })),
    rejectCard: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        const result = yield preference_card_service_1.PreferenceCardService.updateVerificationStatusInDB(req.params.cardId, user.role, 'UNVERIFIED');
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card rejected',
            data: result,
        });
    })),
};
