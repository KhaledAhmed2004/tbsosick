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
exports.UserService = void 0;
const http_status_codes_1 = require("http-status-codes");
const user_1 = require("../../../enums/user");
const mongoose_1 = require("mongoose");
const preference_card_model_1 = require("../preference-card/preference-card.model");
const subscription_model_1 = require("../subscription/subscription.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const user_model_1 = require("./user.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const createUserToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const createUser = yield user_model_1.User.create(Object.assign(Object.assign({}, payload), { verified: true }));
    if (!createUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user');
    }
    return createUser;
});
const getUserProfileFromDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return isExistUser;
});
const updateProfileToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // //unlink file here
    // if (payload.image) {
    //   unlinkFile(isExistUser.image);
    // }
    //unlink file here
    if (payload.profilePicture) {
        (0, unlinkFile_1.default)(isExistUser.profilePicture);
    }
    const updateDoc = yield user_model_1.User.findOneAndUpdate({ _id: id }, payload, {
        new: true,
    });
    return updateDoc;
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const userQuery = new QueryBuilder_1.default(user_model_1.User.find(), query)
        .search(['name', 'email'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const users = yield userQuery.modelQuery;
    const paginationInfo = yield userQuery.getPaginationInfo();
    return {
        pagination: paginationInfo,
        data: users,
    };
});
const getAllUserRoles = (query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const qb = new QueryBuilder_1.default(user_model_1.User.find({ role: user_1.USER_ROLES.USER }), query)
        .filter()
        .sort()
        .paginate();
    // Select core fields needed for listing
    const docs = (yield qb.modelQuery
        .select('_id name email profilePicture status specialty hospital role')
        .lean());
    const paginationInfo = yield qb.getPaginationInfo();
    // Build id arrays for lookups
    const idStrings = docs.map(d => (d._id ? d._id.toString() : null)).filter(Boolean);
    // Cards count per user (PreferenceCard.createdBy stores string userId)
    const cardCountsAgg = yield preference_card_model_1.PreferenceCardModel.aggregate([
        { $match: { createdBy: { $in: idStrings } } },
        { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    ]);
    const cardCountsMap = new Map();
    for (const item of cardCountsAgg) {
        cardCountsMap.set(item._id, item.count);
    }
    // Subscription per user
    const objectIds = idStrings.map(id => new mongoose_1.Types.ObjectId(id));
    const subs = yield subscription_model_1.Subscription.find({ userId: { $in: objectIds } })
        .select('userId plan status currentPeriodEnd')
        .lean();
    const subsMap = new Map();
    for (const s of subs) {
        subsMap.set(s.userId.toString(), {
            plan: s.plan,
            status: s.status,
            currentPeriodEnd: (_a = s.currentPeriodEnd) !== null && _a !== void 0 ? _a : null,
        });
    }
    // Compose final response objects
    const data = docs.map(d => {
        var _a, _b, _c, _d, _e;
        const id = (_a = d._id) === null || _a === void 0 ? void 0 : _a.toString();
        return {
            _id: d._id,
            name: d.name,
            email: d.email,
            profilePicture: d.profilePicture,
            role: d.role,
            specialty: (_b = d.specialty) !== null && _b !== void 0 ? _b : null,
            hospital: (_c = d.hospital) !== null && _c !== void 0 ? _c : null,
            status: d.status,
            cards: id ? (_d = cardCountsMap.get(id)) !== null && _d !== void 0 ? _d : 0 : 0,
            subscription: id ? (_e = subsMap.get(id)) !== null && _e !== void 0 ? _e : null : null,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
        };
    });
    return {
        pagination: paginationInfo,
        data,
    };
});
const updateUserStatus = (id, status) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.isExistUserById(id);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    const updatedUser = yield user_model_1.User.findByIdAndUpdate(id, { status }, { new: true });
    return updatedUser;
});
const deleteUserPermanently = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    const deletedUser = yield user_model_1.User.findByIdAndDelete(id)
        .select('-password -authentication');
    return deletedUser;
});
const updateUserByAdmin = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id).select('+password');
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // Whitelist fields admin can update (excluding password/auth info)
    if (payload.name !== undefined)
        user.name = payload.name;
    if (payload.email !== undefined)
        user.email = payload.email;
    if (payload.phone !== undefined)
        user.phone = payload.phone;
    if (payload.country !== undefined)
        user.country = payload.country;
    if (payload.specialty !== undefined)
        user.specialty = payload.specialty;
    if (payload.hospital !== undefined)
        user.hospital = payload.hospital;
    if (payload.location !== undefined)
        user.location = payload.location;
    if (payload.gender !== undefined)
        user.gender = payload.gender;
    if (payload.dateOfBirth !== undefined)
        user.dateOfBirth = payload.dateOfBirth;
    if (payload.profilePicture !== undefined)
        user.profilePicture = payload.profilePicture;
    if (payload.status !== undefined)
        user.status = payload.status;
    if (payload.role !== undefined)
        user.role = payload.role;
    yield user.save();
    const plain = user.toObject();
    delete plain.password;
    delete plain.authentication;
    return plain;
});
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // Only return user info; remove task/bid side data
    const user = yield user_model_1.User.findById(id).select('-password -authentication');
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User doesn't exist!");
    }
    return { user };
});
const getUserDetailsById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(id).select('-password -authentication');
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User doesn't exist!");
    }
    return user;
});
exports.UserService = {
    createUserToDB,
    getUserProfileFromDB,
    updateProfileToDB,
    getAllUsers,
    getAllUserRoles,
    updateUserStatus,
    updateUserByAdmin,
    deleteUserPermanently,
    getUserById,
    getUserDetailsById,
};
