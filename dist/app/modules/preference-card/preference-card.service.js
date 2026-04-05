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
exports.PreferenceCardService = void 0;
const preference_card_model_1 = require("./preference-card.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const user_1 = require("../../../enums/user");
const builder_1 = require("../../builder");
const user_model_1 = require("../user/user.model");
const supplies_model_1 = require("../supplies/supplies.model");
const sutures_model_1 = require("../sutures/sutures.model");
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
/**
 * Resolves an array of { supply/suture: idOrName, quantity } items.
 * ObjectId strings are kept as-is. Plain-text names are looked up
 * by name; if not found, created. Returns resolved items with ObjectIds.
 */
const resolveMixedItemsWithQuantity = (items, refField, ItemModel) => __awaiter(void 0, void 0, void 0, function* () {
    const resolved = [];
    const customNameItems = [];
    for (let i = 0; i < items.length; i++) {
        const value = items[i][refField];
        if (OBJECT_ID_REGEX.test(value)) {
            resolved.push({ [refField]: value, quantity: items[i].quantity });
        }
        else {
            resolved.push({ [refField]: '', quantity: items[i].quantity });
            customNameItems.push({ index: i, name: value.trim() });
        }
    }
    if (customNameItems.length === 0) {
        return resolved;
    }
    const uniqueNames = [...new Set(customNameItems.map(item => item.name))];
    const existingDocs = yield ItemModel.find({
        name: { $in: uniqueNames },
    }).select('_id name');
    const nameToIdMap = new Map(existingDocs.map((doc) => [doc.name, doc._id.toString()]));
    const toCreate = uniqueNames
        .filter(name => !nameToIdMap.has(name))
        .map(name => ({ name }));
    if (toCreate.length > 0) {
        const newDocs = yield ItemModel.insertMany(toCreate);
        for (const doc of newDocs) {
            nameToIdMap.set(doc.name, doc._id.toString());
        }
    }
    for (const { index, name } of customNameItems) {
        resolved[index][refField] = nameToIdMap.get(name);
    }
    return resolved;
});
/**
 * Flattens populated supplies/sutures from { name: { name: "X" }, quantity: N }
 * to { name: "X", quantity: N } for clean API response.
 */
const flattenCard = (doc) => {
    if (!doc)
        return doc;
    const obj = doc.toObject ? doc.toObject() : doc;
    if (obj.supplies) {
        obj.supplies = obj.supplies.map((item) => {
            var _a;
            return ({
                name: ((_a = item.name) === null || _a === void 0 ? void 0 : _a.name) || item.name,
                quantity: item.quantity,
            });
        });
    }
    if (obj.sutures) {
        obj.sutures = obj.sutures.map((item) => {
            var _a;
            return ({
                name: ((_a = item.name) === null || _a === void 0 ? void 0 : _a.name) || item.name,
                quantity: item.quantity,
            });
        });
    }
    return obj;
};
const flattenCards = (docs) => docs.map(flattenCard);
exports.PreferenceCardService = {
    getCountsForCards: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const [AllCardsCount, myCardsCount] = yield Promise.all([
            preference_card_model_1.PreferenceCardModel.countDocuments({ published: true }),
            preference_card_model_1.PreferenceCardModel.countDocuments({ createdBy: userId }),
        ]);
        return { AllCardsCount, myCardsCount };
    }),
    getFavoriteCardIdsForUser: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield user_model_1.User.findById(userId).select('favoriteCards');
        if (!user || !Array.isArray(user.favoriteCards)) {
            return [];
        }
        return user.favoriteCards;
    }),
    incrementDownloadCountInDB: (id, userId, role) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield preference_card_model_1.PreferenceCardModel.findById(id);
        if (!doc)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
        const isOwner = doc.createdBy.toString() === userId;
        const isSuperAdmin = role === user_1.USER_ROLES.SUPER_ADMIN;
        if (!isOwner && !isSuperAdmin && !doc.published) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to update download count');
        }
        doc.downloadCount = (doc.downloadCount || 0) + 1;
        yield doc.save();
        return { downloadCount: doc.downloadCount };
    }),
    createPreferenceCardInDB: (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (data.supplies && Array.isArray(data.supplies)) {
            data.supplies = yield resolveMixedItemsWithQuantity(data.supplies, 'name', supplies_model_1.SupplyModel);
        }
        if (data.sutures && Array.isArray(data.sutures)) {
            data.sutures = yield resolveMixedItemsWithQuantity(data.sutures, 'name', sutures_model_1.SutureModel);
        }
        const dataToSave = Object.assign(Object.assign({}, data), { createdBy: userId });
        const card = yield preference_card_model_1.PreferenceCardModel.create(dataToSave);
        return card;
    }),
    listPreferenceCardsForUserFromDB: (userId) => __awaiter(void 0, void 0, void 0, function* () {
        const docs = yield preference_card_model_1.PreferenceCardModel.find({
            createdBy: userId,
        })
            .populate('supplies.name', 'name -_id')
            .populate('sutures.name', 'name -_id')
            .sort({
            updatedAt: -1,
        });
        return flattenCards(docs);
    }),
    listPrivatePreferenceCardsForUserFromDB: (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
        const qb = new builder_1.QueryBuilder(preference_card_model_1.PreferenceCardModel.find({
            createdBy: userId,
            published: false,
        }), query || {})
            .search(['cardTitle', 'surgeon.fullName', 'medication'])
            .filter()
            .sort()
            .paginate()
            .fields()
            .populate(['supplies.name', 'sutures.name'], {
            'supplies.name': 'name -_id',
            'sutures.name': 'name -_id',
        });
        const docs = yield qb.modelQuery;
        const paginationInfo = yield qb.getPaginationInfo();
        return {
            pagination: paginationInfo,
            data: flattenCards(docs),
        };
    }),
    getPreferenceCardByIdFromDB: (id, userId, role) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield preference_card_model_1.PreferenceCardModel.findById(id)
            .populate('supplies.name', 'name -_id')
            .populate('sutures.name', 'name -_id');
        if (!doc) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
        }
        const isOwner = doc.createdBy.toString() === userId;
        const isSuperAdmin = role === user_1.USER_ROLES.SUPER_ADMIN;
        if (!isOwner && !isSuperAdmin && !doc.published) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to access this card');
        }
        return flattenCard(doc);
    }),
    updatePreferenceCardInDB: (id, userId, role, payload) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if the card exists and get its creator
        const existingCard = yield preference_card_model_1.PreferenceCardModel.findById(id).select('createdBy');
        if (!existingCard) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
        }
        // Authorization check
        if (existingCard.createdBy.toString() !== userId &&
            role !== 'SUPER_ADMIN') {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to update this card');
        }
        // Resolve mixed supplies/sutures if present
        if (payload.supplies && Array.isArray(payload.supplies)) {
            payload.supplies = yield resolveMixedItemsWithQuantity(payload.supplies, 'name', supplies_model_1.SupplyModel);
        }
        if (payload.sutures && Array.isArray(payload.sutures)) {
            payload.sutures = yield resolveMixedItemsWithQuantity(payload.sutures, 'name', sutures_model_1.SutureModel);
        }
        // Update the document in one step
        const updatedCard = yield preference_card_model_1.PreferenceCardModel.findOneAndUpdate({ _id: id }, { $set: payload }, { new: true });
        return updatedCard;
    }),
    deletePreferenceCardFromDB: (id, userId, role) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield preference_card_model_1.PreferenceCardModel.findById(id);
        if (!doc)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
        if (doc.createdBy.toString() !== userId && role !== 'SUPER_ADMIN') {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to delete this card');
        }
        yield preference_card_model_1.PreferenceCardModel.findByIdAndDelete(id);
        return { deleted: true };
    }),
    updateVerificationStatusInDB: (id, role, status) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield preference_card_model_1.PreferenceCardModel.findById(id);
        if (!doc)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
        if (role !== user_1.USER_ROLES.SUPER_ADMIN) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to verify/reject this card');
        }
        doc.verificationStatus = status;
        yield doc.save();
        return { verificationStatus: doc.verificationStatus };
    }),
    listPublicPreferenceCardsFromDB: (query) => __awaiter(void 0, void 0, void 0, function* () {
        const rawQuery = query || {};
        const { specialty, surgeonSpecialty } = rawQuery, rest = __rest(rawQuery, ["specialty", "surgeonSpecialty"]);
        const enrichedQuery = Object.assign({}, rest);
        const specialtyValue = specialty || surgeonSpecialty;
        if (specialtyValue) {
            enrichedQuery['surgeon.specialty'] = {
                $regex: String(specialtyValue),
                $options: 'i',
            };
        }
        const qb = new builder_1.QueryBuilder(preference_card_model_1.PreferenceCardModel.find({ published: true }), enrichedQuery)
            .search(['cardTitle', 'surgeon.fullName', 'medication'])
            .filter()
            .sort()
            .paginate()
            .fields()
            .populate(['supplies.name', 'sutures.name'], {
            'supplies.name': 'name -_id',
            'sutures.name': 'name -_id',
        });
        const cards = yield qb.modelQuery;
        const paginationInfo = yield qb.getPaginationInfo();
        return {
            pagination: paginationInfo,
            data: flattenCards(cards),
        };
    }),
    listFavoritePreferenceCardsForUserFromDB: (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield user_model_1.User.findById(userId).select('favoriteCards');
        if (!user || !Array.isArray(user.favoriteCards) || user.favoriteCards.length === 0) {
            return {
                pagination: {
                    total: 0,
                    limit: Number(query === null || query === void 0 ? void 0 : query.limit) || 10,
                    page: Number(query === null || query === void 0 ? void 0 : query.page) || 1,
                    totalPage: 0,
                },
                data: [],
            };
        }
        const qb = new builder_1.QueryBuilder(preference_card_model_1.PreferenceCardModel.find({
            _id: { $in: user.favoriteCards },
        }), query || {})
            .search(['cardTitle', 'surgeon.fullName', 'medication'])
            .filter()
            .sort()
            .paginate()
            .fields()
            .populate(['supplies.name', 'sutures.name'], {
            'supplies.name': 'name -_id',
            'sutures.name': 'name -_id',
        });
        const docs = yield qb.modelQuery;
        const paginationInfo = yield qb.getPaginationInfo();
        return {
            pagination: paginationInfo,
            data: flattenCards(docs),
        };
    }),
    favoritePreferenceCardInDB: (cardId, userId) => __awaiter(void 0, void 0, void 0, function* () {
        const card = yield preference_card_model_1.PreferenceCardModel.findById(cardId);
        if (!card) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
        }
        if (!card.published && card.createdBy.toString() !== userId) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to favorite this card');
        }
        yield user_model_1.User.findByIdAndUpdate(userId, { $addToSet: { favoriteCards: cardId } }, { new: true });
        return { favorited: true };
    }),
    unfavoritePreferenceCardInDB: (cardId, userId) => __awaiter(void 0, void 0, void 0, function* () {
        const card = yield preference_card_model_1.PreferenceCardModel.findById(cardId);
        if (!card) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
        }
        yield user_model_1.User.findByIdAndUpdate(userId, { $pull: { favoriteCards: cardId } }, { new: true });
        return { favorited: false };
    }),
};
