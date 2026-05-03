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
const mongoose_1 = require("mongoose");
const preference_card_model_1 = require("./preference-card.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const user_1 = require("../../../enums/user");
const builder_1 = require("../../builder");
const supplies_model_1 = require("../supplies/supplies.model");
const sutures_model_1 = require("../sutures/sutures.model");
const favorite_model_1 = require("../favorite/favorite.model");
const PDFBuilder_1 = __importDefault(require("../../builder/PDFBuilder"));
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const MAX_FAVORITES_PER_USER = 100;
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
    }).select('_id name').lean();
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
 * Flattens populated supplies/sutures.
 * After populate, `supply` / `suture` holds the referenced doc `{ name }`.
 * We flatten to `{ name, quantity }` for the API response so clients keep
 * seeing a stable `name` label regardless of internal FK field naming.
 */
const flattenCard = (doc) => {
    if (!doc)
        return doc;
    const obj = doc.toObject ? doc.toObject() : doc;
    if (obj.supplies) {
        obj.supplies = obj.supplies.map((item) => {
            var _a;
            return ({
                name: ((_a = item.supply) === null || _a === void 0 ? void 0 : _a.name) || item.supply,
                quantity: item.quantity,
            });
        });
    }
    if (obj.sutures) {
        obj.sutures = obj.sutures.map((item) => {
            var _a;
            return ({
                name: ((_a = item.suture) === null || _a === void 0 ? void 0 : _a.name) || item.suture,
                quantity: item.quantity,
            });
        });
    }
    return obj;
};
const flattenCards = (docs) => docs.map(flattenCard);
/**
 * Fields that a preference card must have filled out before it can be
 * published or verified. The schema itself keeps these optional so that
 * drafts can be saved — this list enforces completeness only at publish
 * / approve time.
 */
const PUBLISH_REQUIRED_FIELDS = [
    'medication',
    'instruments',
    'positioningEquipment',
    'prepping',
    'workflow',
    'keyNotes',
];
const assertCardIsPublishable = (card) => {
    const missing = [];
    for (const field of PUBLISH_REQUIRED_FIELDS) {
        const value = card === null || card === void 0 ? void 0 : card[field];
        if (typeof value !== 'string' || value.trim() === '') {
            missing.push(field);
        }
    }
    if (!Array.isArray(card === null || card === void 0 ? void 0 : card.supplies) || card.supplies.length === 0) {
        missing.push('supplies');
    }
    if (!Array.isArray(card === null || card === void 0 ? void 0 : card.sutures) || card.sutures.length === 0) {
        missing.push('sutures');
    }
    if (missing.length > 0) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Cannot publish — missing required fields: ${missing.join(', ')}`);
    }
};
const getPreferenceCardCountsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const [AllCardsCount, myCardsCount] = yield Promise.all([
        preference_card_model_1.PreferenceCardModel.countDocuments({ published: true }),
        preference_card_model_1.PreferenceCardModel.countDocuments({ createdBy: userId }),
    ]);
    return { AllCardsCount, myCardsCount };
});
const getDistinctSpecialtiesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const specialties = yield preference_card_model_1.PreferenceCardModel.distinct('surgeon.specialty', {
        published: true,
    });
    return specialties.filter(Boolean).sort();
});
const getFavoriteCardIdsForUserFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const favorites = yield favorite_model_1.Favorite.find({ userId }).select('cardId -_id').lean();
    return favorites.map(f => f.cardId.toString());
});
/**
 * Flattens a card document to make it easy for PDF generation.
 * Extracts names from populated supplies and sutures.
 */
const flattenCard = (doc) => {
    return Object.assign(Object.assign({}, doc), { supplies: (doc.supplies || []).map((s) => {
            var _a;
            return ({
                name: ((_a = s.supply) === null || _a === void 0 ? void 0 : _a.name) || 'N/A',
                quantity: s.quantity,
            });
        }), sutures: (doc.sutures || []).map((s) => {
            var _a;
            return ({
                name: ((_a = s.suture) === null || _a === void 0 ? void 0 : _a.name) || 'N/A',
                quantity: s.quantity,
            });
        }) });
};
const downloadPreferenceCardInDB = (id, userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Fetch Card Safely
    const doc = yield preference_card_model_1.PreferenceCardModel.findById(id)
        .populate('supplies.supply', 'name -_id')
        .populate('sutures.suture', 'name -_id')
        .lean();
    if (!doc) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
    }
    // 2. Check Card Status (isDeleted or inactive/unverified)
    // Requirement: Reject if deleted or inactive.
    // We'll use published: false as "inactive" for public users.
    if (doc.isDeleted) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.GONE, 'This preference card has been deleted');
    }
    // 3. Authorization Rules
    const isOwner = doc.createdBy.toString() === userId;
    const isSuperAdmin = role === user_1.USER_ROLES.SUPER_ADMIN;
    if (!doc.published && !isOwner && !isSuperAdmin) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You do not have permission to download this private card');
    }
    // 4. Idempotency / Spam Control
    // userId + cardId + date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    try {
        // Attempt to create a download log. Unique index handles idempotency.
        yield preference_card_model_1.PreferenceCardDownloadModel.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            cardId: new mongoose_1.Types.ObjectId(id),
            downloadDate: today,
        });
        // 5. Atomic Increment (only if log creation succeeded)
        yield preference_card_model_1.PreferenceCardModel.findByIdAndUpdate(id, {
            $inc: { downloadCount: 1 },
        });
    }
    catch (error) {
        // If it's a duplicate key error (code 11000), it means user already downloaded today.
        // We return success without incrementing.
        if (error.code !== 11000) {
            throw error;
        }
    }
    // 6. Generate PDF
    const flattenedDoc = flattenCard(doc);
    const pdfBuffer = yield generatePreferenceCardPDF(flattenedDoc);
    return {
        buffer: pdfBuffer,
        fileName: `${flattenedDoc.cardTitle.replace(/\s+/g, '_')}_Preference_Card.pdf`,
    };
});
/**
 * Generates a "beautiful" PDF for a preference card using PDFBuilder.
 */
const generatePreferenceCardPDF = (card) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const builder = new PDFBuilder_1.default()
        .setTheme('corporate') // Using corporate for a more professional/beautiful look
        .setTitle(card.cardTitle)
        .setHeader({
        title: card.cardTitle,
        subtitle: 'Official Preference Card',
        showDate: true,
        style: {
            padding: 24,
        },
    })
        .addText({
        content: 'Surgeon Information',
        style: 'heading',
        margin: { top: 20, bottom: 10 },
    })
        .addTable({
        headers: ['Field', 'Details'],
        rows: [
            ['Full Name', ((_a = card.surgeon) === null || _a === void 0 ? void 0 : _a.fullName) || 'N/A'],
            ['Specialty', ((_b = card.surgeon) === null || _b === void 0 ? void 0 : _b.specialty) || 'N/A'],
            ['Hand Preference', ((_c = card.surgeon) === null || _c === void 0 ? void 0 : _c.handPreference) || 'N/A'],
            ['Contact', ((_d = card.surgeon) === null || _d === void 0 ? void 0 : _d.contactNumber) || 'N/A'],
            ['Music Preference', ((_e = card.surgeon) === null || _e === void 0 ? void 0 : _e.musicPreference) || 'N/A'],
        ],
        striped: true,
    })
        .addSpacer(20);
    if (card.medication) {
        builder
            .addText({ content: 'Medication', style: 'subheading' })
            .addText({
            content: card.medication,
            style: 'body',
            margin: { bottom: 15 },
        })
            .addDivider();
    }
    if (card.supplies && card.supplies.length > 0) {
        builder.addText({ content: 'Supplies', style: 'subheading' }).addTable({
            headers: ['Item Name', 'Quantity'],
            rows: card.supplies.map((s) => [s.name, s.quantity]),
            striped: true,
        });
        builder.addSpacer(20);
    }
    if (card.sutures && card.sutures.length > 0) {
        builder.addText({ content: 'Sutures', style: 'subheading' }).addTable({
            headers: ['Item Name', 'Quantity'],
            rows: card.sutures.map((s) => [s.name, s.quantity]),
            striped: true,
        });
        builder.addSpacer(20);
    }
    const sections = [
        { label: 'Instruments', value: card.instruments },
        { label: 'Positioning Equipment', value: card.positioningEquipment },
        { label: 'Prepping', value: card.prepping },
        { label: 'Workflow', value: card.workflow },
        { label: 'Key Notes', value: card.keyNotes },
    ];
    for (const section of sections) {
        if (section.value) {
            builder
                .addText({ content: section.label, style: 'subheading' })
                .addText({
                content: section.value,
                style: 'body',
                margin: { bottom: 15 },
            })
                .addDivider();
        }
    }
    // Add Photo Library if exists
    if (card.photoLibrary && card.photoLibrary.length > 0) {
        builder.addText({
            content: 'Photo Library',
            style: 'heading',
            margin: { top: 20, bottom: 10 },
        });
        for (const photo of card.photoLibrary) {
            if (photo.url) {
                builder
                    .addImage({
                    src: photo.url,
                    width: 500, // Large enough to see details
                })
                    .addSpacer(10);
            }
        }
    }
    builder.setFooter({
        showPageNumbers: true,
        text: '© Preference Card System - Secure Document',
    });
    return builder.toBuffer();
});
/**
 * Accepts client payloads that still use `{ name, quantity }` (backwards
 * compat with the API contract) and normalises them into the schema's
 * `{ supply|suture, quantity }` shape.
 */
const normaliseClientRefField = (items, targetField) => {
    return items.map(item => {
        if (item && item[targetField] === undefined && item.name !== undefined) {
            const { name } = item, rest = __rest(item, ["name"]);
            return Object.assign(Object.assign({}, rest), { [targetField]: name });
        }
        return item;
    });
};
const createPreferenceCardInDB = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (data.supplies && Array.isArray(data.supplies)) {
        const normalised = normaliseClientRefField(data.supplies, 'supply');
        data.supplies = yield resolveMixedItemsWithQuantity(normalised, 'supply', supplies_model_1.SupplyModel);
    }
    if (data.sutures && Array.isArray(data.sutures)) {
        const normalised = normaliseClientRefField(data.sutures, 'suture');
        data.sutures = yield resolveMixedItemsWithQuantity(normalised, 'suture', sutures_model_1.SutureModel);
    }
    const dataToSave = Object.assign(Object.assign({}, data), { createdBy: userId });
    // If the client is creating the card already marked as published,
    // enforce the completeness invariant up front.
    if (dataToSave.published === true) {
        assertCardIsPublishable(dataToSave);
    }
    const card = yield preference_card_model_1.PreferenceCardModel.create(dataToSave);
    return card;
});
const listPreferenceCardsForUserFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const docs = yield preference_card_model_1.PreferenceCardModel.find({
        createdBy: userId,
    })
        .populate('supplies.supply', 'name -_id')
        .populate('sutures.suture', 'name -_id')
        .sort({
        updatedAt: -1,
    })
        .lean();
    return flattenCards(docs);
});
const listPrivatePreferenceCardsForUserFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const qb = new builder_1.QueryBuilder(preference_card_model_1.PreferenceCardModel.find({
        createdBy: userId,
    }), query || {})
        // Text index on cardTitle + medication + surgeon.fullName + surgeon.specialty
        // handles the full search path — see `card_text_idx` in the model.
        .textSearch()
        .filter()
        .sort()
        .paginate()
        .fields()
        .populate(['supplies.supply', 'sutures.suture'], {
        'supplies.supply': 'name -_id',
        'sutures.suture': 'name -_id',
    });
    const docs = yield qb.modelQuery;
    const meta = yield qb.getPaginationInfo();
    return {
        meta,
        data: flattenCards(docs),
    };
});
const getPreferenceCardByIdFromDB = (id, userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield preference_card_model_1.PreferenceCardModel.findById(id)
        .populate('supplies.supply', 'name -_id')
        .populate('sutures.suture', 'name -_id')
        .lean();
    if (!doc) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
    }
    const isOwner = doc.createdBy.toString() === userId;
    const isSuperAdmin = role === user_1.USER_ROLES.SUPER_ADMIN;
    if (!isOwner && !isSuperAdmin && !doc.published) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to access this card');
    }
    return flattenCard(doc);
});
const updatePreferenceCardInDB = (id, userId, role, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if the card exists and get its creator
    const existingCard = yield preference_card_model_1.PreferenceCardModel.findById(id)
        .select('createdBy')
        .lean();
    if (!existingCard) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
    }
    // Authorization check
    if (existingCard.createdBy.toString() !== userId &&
        role !== user_1.USER_ROLES.SUPER_ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to update this card');
    }
    // Resolve mixed supplies/sutures if present
    if (payload.supplies && Array.isArray(payload.supplies)) {
        const normalised = normaliseClientRefField(payload.supplies, 'supply');
        payload.supplies = yield resolveMixedItemsWithQuantity(normalised, 'supply', supplies_model_1.SupplyModel);
    }
    if (payload.sutures && Array.isArray(payload.sutures)) {
        const normalised = normaliseClientRefField(payload.sutures, 'suture');
        payload.sutures = yield resolveMixedItemsWithQuantity(normalised, 'suture', sutures_model_1.SutureModel);
    }
    // If the update flips the card to `published: true`, pre-check the
    // merged shape so half-filled drafts can never be published.
    if (payload.published === true) {
        const full = yield preference_card_model_1.PreferenceCardModel.findById(id).lean();
        if (full) {
            assertCardIsPublishable(Object.assign(Object.assign({}, full), payload));
        }
    }
    // Update the document in one step
    const updatedCard = yield preference_card_model_1.PreferenceCardModel.findOneAndUpdate({ _id: id }, { $set: payload }, { new: true });
    return updatedCard;
});
const deletePreferenceCardFromDB = (id, userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield preference_card_model_1.PreferenceCardModel.findById(id);
    if (!doc)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
    if (doc.createdBy.toString() !== userId && role !== user_1.USER_ROLES.SUPER_ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to delete this card');
    }
    yield preference_card_model_1.PreferenceCardModel.findByIdAndDelete(id);
    return { deleted: true };
});
const updateVerificationStatusInDB = (id, role, status) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield preference_card_model_1.PreferenceCardModel.findById(id);
    if (!doc)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
    if (role !== user_1.USER_ROLES.SUPER_ADMIN) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to verify/reject this card');
    }
    // Enforce completeness before moving to VERIFIED. Drafts and
    // UNVERIFIED cards are allowed to be incomplete.
    if (status === 'VERIFIED') {
        assertCardIsPublishable(doc.toObject());
    }
    doc.verificationStatus = status;
    yield doc.save();
    return { verificationStatus: doc.verificationStatus };
});
/**
 * Public preference card list — hottest read endpoint (home screen).
 *
 * This method uses a **single aggregation pipeline** instead of the
 * QueryBuilder `populate()` chain used by the other list methods:
 *
 *   - One `$match` hits the `{ published, verificationStatus, createdAt }`
 *     compound index directly.
 *   - A `$facet` returns paginated data + total count in one round trip
 *     so the caller doesn't need a separate `countDocuments` call.
 *   - Inside the data facet, `$lookup` joins supplies / sutures server
 *     side — no round trip per populate path.
 *   - `$addFields` rewrites each embedded `supply` / `suture` ObjectId
 *     into the populated `{ name }` shape that the API contract expects.
 *
 * Net effect: 3 round trips (find + 2 populate) → 1 aggregation. At
 * small scale the saving is ~10-20ms per call; at 10k+ cards the
 * text-index-backed `$match` also keeps it O(log n).
 *
 * The other list methods (`listPrivate...`, `listFavorite...`, owner
 * list, details) still use the QueryBuilder populate chain — they're
 * lower-traffic and this method is the reference pattern when they're
 * migrated.
 */
const listPublicPreferenceCardsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const rawQuery = query || {};
    const page = Math.max(Number(rawQuery.page) || 1, 1);
    const limit = Math.min(Math.max(Number(rawQuery.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;
    const match = { published: true, isDeleted: false };
    // Specialty facet filter. Uses exact match now that `surgeon.specialty`
    // is indexed — callers pass the canonical string from `/specialties`.
    const specialtyValue = rawQuery.specialty || rawQuery.surgeonSpecialty;
    if (specialtyValue) {
        match['surgeon.specialty'] = String(specialtyValue);
    }
    // Text search — leverages `card_text_idx` and `score` sorting.
    const searchTerm = typeof rawQuery.searchTerm === 'string'
        ? rawQuery.searchTerm.trim()
        : '';
    if (searchTerm.length > 0) {
        match.$text = { $search: searchTerm };
    }
    const sortStage = searchTerm.length > 0
        ? { score: { $meta: 'textScore' } }
        : { createdAt: -1 };
    const [result] = yield preference_card_model_1.PreferenceCardModel.aggregate([
        { $match: match },
        { $sort: sortStage },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: 'supplies',
                            localField: 'supplies.supply',
                            foreignField: '_id',
                            as: 'supplyDocs',
                            pipeline: [{ $project: { _id: 1, name: 1 } }],
                        },
                    },
                    {
                        $lookup: {
                            from: 'sutures',
                            localField: 'sutures.suture',
                            foreignField: '_id',
                            as: 'sutureDocs',
                            pipeline: [{ $project: { _id: 1, name: 1 } }],
                        },
                    },
                    // Rewrite embedded `supplies[]` / `sutures[]` into the
                    // { name, quantity } shape the API contract promises.
                    {
                        $addFields: {
                            supplies: {
                                $map: {
                                    input: '$supplies',
                                    as: 'item',
                                    in: {
                                        name: {
                                            $let: {
                                                vars: {
                                                    hit: {
                                                        $first: {
                                                            $filter: {
                                                                input: '$supplyDocs',
                                                                as: 's',
                                                                cond: { $eq: ['$$s._id', '$$item.supply'] },
                                                            },
                                                        },
                                                    },
                                                },
                                                in: { $ifNull: ['$$hit.name', '$$item.supply'] },
                                            },
                                        },
                                        quantity: '$$item.quantity',
                                    },
                                },
                            },
                            sutures: {
                                $map: {
                                    input: '$sutures',
                                    as: 'item',
                                    in: {
                                        name: {
                                            $let: {
                                                vars: {
                                                    hit: {
                                                        $first: {
                                                            $filter: {
                                                                input: '$sutureDocs',
                                                                as: 's',
                                                                cond: { $eq: ['$$s._id', '$$item.suture'] },
                                                            },
                                                        },
                                                    },
                                                },
                                                in: { $ifNull: ['$$hit.name', '$$item.suture'] },
                                            },
                                        },
                                        quantity: '$$item.quantity',
                                    },
                                },
                            },
                        },
                    },
                    { $project: { supplyDocs: 0, sutureDocs: 0, __v: 0 } },
                ],
                total: [{ $count: 'count' }],
            },
        },
    ]);
    const total = (_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.total) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.count) !== null && _c !== void 0 ? _c : 0;
    const totalPages = Math.ceil(total / limit);
    return {
        meta: {
            total,
            limit,
            page,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
        data: (_d = result === null || result === void 0 ? void 0 : result.data) !== null && _d !== void 0 ? _d : [],
    };
});
const listFavoritePreferenceCardsForUserFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const favorites = yield favorite_model_1.Favorite.find({ userId }).select('cardId -_id').lean();
    const cardIds = favorites.map(f => f.cardId);
    if (cardIds.length === 0) {
        return {
            meta: {
                total: 0,
                limit: Math.min(Number(query === null || query === void 0 ? void 0 : query.limit) || 10, 50),
                page: Number(query === null || query === void 0 ? void 0 : query.page) || 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            },
            data: [],
        };
    }
    const qb = new builder_1.QueryBuilder(preference_card_model_1.PreferenceCardModel.find({
        _id: { $in: cardIds },
    }), query || {})
        // Text index on cardTitle + medication + surgeon.fullName + surgeon.specialty
        // handles the full search path — see `card_text_idx` in the model.
        .textSearch()
        .filter()
        .sort()
        .paginate()
        .fields()
        .populate(['supplies.supply', 'sutures.suture'], {
        'supplies.supply': 'name -_id',
        'sutures.suture': 'name -_id',
    });
    const docs = yield qb.modelQuery;
    const meta = yield qb.getPaginationInfo();
    return {
        meta,
        data: flattenCards(docs),
    };
});
const favoritePreferenceCardInDB = (cardId, userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    const card = yield preference_card_model_1.PreferenceCardModel.findById(cardId);
    if (!card) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
    }
    // Soft-delete check
    if (card.isDeleted) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.GONE, 'This preference card has been deleted');
    }
    // Visibility check: Card must be published OR the user must be the creator OR SUPER_ADMIN
    const isOwner = card.createdBy.toString() === userId;
    const isSuperAdmin = role === user_1.USER_ROLES.SUPER_ADMIN;
    if (!card.published && !isOwner && !isSuperAdmin) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to favorite this private card');
    }
    // Per-user favorites cap. Skip for re-adds (idempotent) — only enforce when
    // this card is not already in the user's favorites.
    const existing = yield favorite_model_1.Favorite.findOne({
        userId: new mongoose_1.Types.ObjectId(userId),
        cardId: new mongoose_1.Types.ObjectId(cardId),
    }).lean();
    if (!existing) {
        const count = yield favorite_model_1.Favorite.countDocuments({
            userId: new mongoose_1.Types.ObjectId(userId),
        });
        if (count >= MAX_FAVORITES_PER_USER) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, `Favorites limit reached (cap = ${MAX_FAVORITES_PER_USER} per user)`);
        }
    }
    // Idempotent favorite using unique index constraint
    try {
        yield favorite_model_1.Favorite.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            cardId: new mongoose_1.Types.ObjectId(cardId),
        });
    }
    catch (error) {
        // 11000 is MongoDB's duplicate key error code
        if (error.code !== 11000) {
            throw error;
        }
    }
    return { favorited: true };
});
const unfavoritePreferenceCardInDB = (cardId, userId, role) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if card exists
    const card = yield preference_card_model_1.PreferenceCardModel.findById(cardId);
    if (!card) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Preference card not found');
    }
    // Soft-delete check
    if (card.isDeleted) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.GONE, 'This preference card has been deleted');
    }
    // Visibility check: Card must be published OR the user must be the creator OR SUPER_ADMIN
    const isOwner = card.createdBy.toString() === userId;
    const isSuperAdmin = role === user_1.USER_ROLES.SUPER_ADMIN;
    if (!card.published && !isOwner && !isSuperAdmin) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to unfavorite this private card');
    }
    // Idempotent unfavorite
    const result = yield favorite_model_1.Favorite.deleteOne({
        userId: new mongoose_1.Types.ObjectId(userId),
        cardId: new mongoose_1.Types.ObjectId(cardId),
    });
    return { favorited: false, deletedCount: result.deletedCount };
});
exports.PreferenceCardService = {
    getPreferenceCardCountsFromDB,
    getDistinctSpecialtiesFromDB,
    getFavoriteCardIdsForUserFromDB,
    downloadPreferenceCardInDB,
    createPreferenceCardInDB,
    listPreferenceCardsForUserFromDB,
    listPrivatePreferenceCardsForUserFromDB,
    getPreferenceCardByIdFromDB,
    updatePreferenceCardInDB,
    deletePreferenceCardFromDB,
    updateVerificationStatusInDB,
    listPublicPreferenceCardsFromDB,
    listFavoritePreferenceCardsForUserFromDB,
    favoritePreferenceCardInDB,
    unfavoritePreferenceCardInDB,
};
