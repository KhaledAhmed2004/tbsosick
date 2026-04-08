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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const user_service_1 = require("./user.service");
const user_1 = require("../../../enums/user");
const preference_card_service_1 = require("../preference-card/preference-card.service");
const createUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = __rest(req.body, []);
    const result = yield user_service_1.UserService.createUserToDB(userData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: 'User created successfully',
        data: result,
    });
}));
const getUserProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield user_service_1.UserService.getUserProfileFromDB(user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Profile data retrieved successfully',
        data: result,
    });
}));
const getFavoriteCards = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield preference_card_service_1.PreferenceCardService.listFavoritePreferenceCardsForUserFromDB(user.id, req.query);
    const favoriteCardIds = yield preference_card_service_1.PreferenceCardService.getFavoriteCardIdsForUser(user.id);
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
        message: result.data.length > 0 ? 'Favorite preference cards retrieved successfully' : 'No favorite cards found.',
        meta: result.meta,
        data: summarized,
    });
}));
const updateProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // All files + text data are in req.body
    const payload = Object.assign({}, req.body);
    const result = yield user_service_1.UserService.updateProfileToDB(user, payload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Profile updated successfully',
        data: result,
    });
}));
const updateUserStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { status } = req.body;
    const result = yield user_service_1.UserService.updateUserStatus(userId, status);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `User status updated to ${status}`,
        data: result,
    });
}));
const adminUpdateUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const payload = Object.assign({}, req.body);
    const result = yield user_service_1.UserService.updateUserByAdmin(userId, payload);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User updated successfully',
        data: result,
    });
}));
const deleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const result = yield user_service_1.UserService.deleteUserPermanently(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User permanently deleted',
        data: result,
    });
}));
const getAllUserRoles = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_service_1.UserService.getAllUserRoles(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User roles retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
}));
const blockUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const result = yield user_service_1.UserService.updateUserStatus(userId, user_1.USER_STATUS.RESTRICTED);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User blocked successfully',
        data: result,
    });
}));
const unblockUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const result = yield user_service_1.UserService.updateUserStatus(userId, user_1.USER_STATUS.ACTIVE);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User unblocked successfully',
        data: result,
    });
}));
const getUserById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const result = yield user_service_1.UserService.getUserById(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User data retrieved successfully',
        data: result,
    });
}));
const getUserDetailsById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const result = yield user_service_1.UserService.getUserDetailsById(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User details retrieved successfully',
        data: result,
    });
}));
exports.UserController = {
    createUser,
    getUserProfile,
    getFavoriteCards,
    updateProfile,
    getAllUserRoles,
    updateUserStatus,
    adminUpdateUser,
    deleteUser,
    blockUser,
    unblockUser,
    getUserById,
    getUserDetailsById,
};
