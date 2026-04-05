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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorService = void 0;
const user_model_1 = require("../user/user.model");
const preference_card_model_1 = require("../preference-card/preference-card.model");
const subscription_model_1 = require("../subscription/subscription.model");
const user_interface_1 = require("../user/user.interface");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
exports.DoctorService = {
    createDoctor(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const docPayload = {
                name: payload.name,
                email: payload.email,
                password: payload.password,
                phone: payload.phone,
                specialty: payload.specialty,
                hospital: payload.hospital,
                location: payload.location,
                gender: payload.gender,
                dateOfBirth: payload.dateOfBirth,
                profilePicture: payload.profilePicture,
                role: user_interface_1.USER_ROLES.USER,
            };
            const user = yield user_model_1.User.create(docPayload);
            const plain = user.toObject();
            delete plain.password;
            return plain;
        });
    },
    searchDoctors(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { search, email, specialty, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
            const { page, limit, skip } = paginationHelper_1.paginationHelper.calculatePagination({
                page: params.page,
                limit: params.limit,
                sortBy,
                sortOrder,
            });
            const match = {};
            if (status)
                match.status = status;
            if (email)
                match.email = { $regex: email, $options: 'i' };
            if (search) {
                match.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }
            const basePipeline = [
                { $match: match },
                // Lookup preference cards created by this user
                {
                    $lookup: {
                        from: preference_card_model_1.PreferenceCardModel.collection.name,
                        let: { userIdStr: { $toString: '$_id' } },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$createdBy', '$$userIdStr'] } } },
                        ],
                        as: 'cards',
                    },
                },
                // Compute specialties and cards count
                {
                    $addFields: {
                        cardsCount: { $size: '$cards' },
                        specialties: {
                            $setDifference: [
                                {
                                    $setUnion: [
                                        {
                                            $map: {
                                                input: '$cards',
                                                as: 'c',
                                                in: { $ifNull: ['$$c.surgeon.specialty', null] },
                                            },
                                        },
                                        [],
                                    ],
                                },
                                [null],
                            ],
                        },
                    },
                },
                // Optional specialty filter
                ...(specialty
                    ? [
                        {
                            $match: {
                                specialties: { $elemMatch: { $regex: specialty, $options: 'i' } },
                            },
                        },
                    ]
                    : []),
                // Lookup subscription status
                {
                    $lookup: {
                        from: subscription_model_1.Subscription.collection.name,
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'subscription',
                    },
                },
                {
                    $addFields: {
                        subscriptionStatus: {
                            $ifNull: [{ $arrayElemAt: ['$subscription.status', 0] }, 'inactive'],
                        },
                        subscriptionPlan: {
                            $ifNull: [{ $arrayElemAt: ['$subscription.plan', 0] }, 'FREE'],
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        phone: 1,
                        specialty: 1,
                        hospital: 1,
                        status: 1,
                        verified: 1,
                        specialties: 1,
                        cardsCount: 1,
                        subscriptionStatus: 1,
                        subscriptionPlan: 1,
                        createdAt: 1,
                    },
                },
            ];
            const sortStage = {
                $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
            };
            const paginatedPipeline = [
                ...basePipeline,
                sortStage,
                { $skip: skip },
                { $limit: limit },
            ];
            const countPipeline = [
                ...basePipeline,
                { $count: 'total' },
            ];
            const [data, countResult] = yield Promise.all([
                user_model_1.User.aggregate(paginatedPipeline),
                user_model_1.User.aggregate(countPipeline),
            ]);
            const total = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPage: Math.ceil(total / limit),
                },
            };
        });
    },
    blockDoctor(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_model_1.User.findByIdAndUpdate(id, { status: user_interface_1.USER_STATUS.RESTRICTED }, { new: true });
        });
    },
    unblockDoctor(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_model_1.User.findByIdAndUpdate(id, { status: user_interface_1.USER_STATUS.ACTIVE }, { new: true });
        });
    },
    deleteDoctor(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // Optionally, cascade delete their preference cards (commented to keep minimal)
            // await PreferenceCardModel.deleteMany({ createdBy: id });
            return user_model_1.User.findByIdAndDelete(id);
        });
    },
    updateDoctorProfile(id, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(id).select('+password'); // ensure hooks run properly
            if (!user)
                return null;
            // Ensure target is a doctor
            // In SUPER_ADMIN-only system, allow update for existing users
            // Whitelist allowed fields
            if (payload.name !== undefined)
                user.name = payload.name;
            if (payload.email !== undefined)
                user.email = payload.email;
            if (payload.phone !== undefined)
                user.phone = payload.phone;
            if (payload.specialty !== undefined)
                user.specialty = payload.specialty;
            if (payload.hospital !== undefined)
                user.hospital = payload.hospital;
            if (payload.location !== undefined)
                user.location = payload.location;
            // Do NOT change password here
            yield user.save();
            // Return without password field
            const plain = user.toObject();
            delete plain.password;
            return plain;
        });
    },
};
