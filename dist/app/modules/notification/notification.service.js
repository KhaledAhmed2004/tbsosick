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
exports.NotificationService = void 0;
const notification_model_1 = require("./notification.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const listForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return notification_model_1.NotificationModel.find({ userId }).sort({ createdAt: -1 });
});
const markAllRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield notification_model_1.NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
    return { updated: true };
});
const markRead = (id_1, userId_1, ...args_1) => __awaiter(void 0, [id_1, userId_1, ...args_1], void 0, function* (id, userId, read = true) {
    const doc = yield notification_model_1.NotificationModel.findById(id);
    if (!doc)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
    if (doc.userId !== userId)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized');
    doc.read = read;
    yield doc.save();
    return doc;
});
const deleteById = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield notification_model_1.NotificationModel.findById(id);
    if (!doc)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Notification not found');
    if (doc.userId !== userId)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized');
    yield notification_model_1.NotificationModel.findByIdAndDelete(id);
    return { deleted: true };
});
// Helper creators for triggers
const createForPreferenceCard = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const subtitle = params.surgeonName && params.procedure
        ? `${params.surgeonName} — ${params.procedure}`
        : params.cardTitle;
    return notification_model_1.NotificationModel.create({
        userId: params.userId,
        type: 'PREFERENCE_CARD_CREATED',
        title: 'New Card Added',
        subtitle,
        link: { label: 'View Card', url: `/cards/${params.cardId}` },
        resourceType: 'PreferenceCard',
        resourceId: params.cardId,
        read: false,
        icon: 'card',
    });
});
const createForEventScheduled = (params) => __awaiter(void 0, void 0, void 0, function* () {
    return notification_model_1.NotificationModel.create({
        userId: params.userId,
        type: 'EVENT_SCHEDULED',
        title: 'Event Scheduled',
        subtitle: `${params.title}${params.whenText ? ' on ' + params.whenText : ''}`,
        link: { label: 'View Event', url: `/events/${params.eventId}` },
        resourceType: 'Event',
        resourceId: params.eventId,
        read: false,
        icon: 'calendar',
    });
});
exports.NotificationService = {
    listForUser,
    markAllRead,
    markRead,
    deleteById,
    createForPreferenceCard,
    createForEventScheduled,
};
