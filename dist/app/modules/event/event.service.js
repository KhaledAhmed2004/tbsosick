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
exports.EventService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const event_model_1 = __importDefault(require("./event.model"));
const NotificationBuilder_1 = require("../../builder/NotificationBuilder");
const buildEventStartDate = (date, time) => {
    return new Date(`${date}T${time}:00.000Z`);
};
const scheduleEventReminders = (userId, eventId, title, eventStart) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const reminders = [
        { hoursBefore: 24 },
        { hoursBefore: 1 },
    ];
    for (const reminder of reminders) {
        const scheduledFor = new Date(eventStart.getTime() - reminder.hoursBefore * 60 * 60 * 1000);
        if (scheduledFor <= now) {
            continue;
        }
        const body = reminder.hoursBefore === 24
            ? `Your event "${title}" is in 24 hours`
            : `Your event "${title}" is in 1 hour`;
        yield new NotificationBuilder_1.NotificationBuilder()
            .to(userId)
            .setTitle('Event Reminder')
            .setText(body)
            .setType('REMINDER')
            .setReference(eventId)
            .setData({
            type: 'EVENT_REMINDER',
            eventId,
            hoursBefore: reminder.hoursBefore,
        })
            .viaPush()
            .viaDatabase()
            .schedule(scheduledFor)
            .send();
    }
});
const createEventInDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!((_a = payload.date) === null || _a === void 0 ? void 0 : _a.match(/^\d{4}-\d{2}-\d{2}$/))) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date');
    }
    if (!((_b = payload.time) === null || _b === void 0 ? void 0 : _b.match(/^\d{2}:\d{2}$/))) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid time');
    }
    const event = yield event_model_1.default.create(Object.assign(Object.assign({ userId }, payload), { date: new Date(`${payload.date}T00:00:00.000Z`) }));
    const eventId = event._id.toString();
    const eventStart = buildEventStartDate(payload.date, payload.time);
    yield scheduleEventReminders(userId, eventId, payload.title, eventStart);
    return event;
});
const listEventsForUserFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = { userId };
    if (query.from || query.to) {
        filter.date = {};
        if (query.from) {
            filter.date.$gte = new Date(`${query.from}T00:00:00.000Z`);
        }
        if (query.to) {
            filter.date.$lte = new Date(`${query.to}T00:00:00.000Z`);
        }
    }
    return event_model_1.default.find(filter).select('title eventType date time durationHours location notes personnel preferenceCard').lean();
});
const getEventByIdFromDB = (id, requester) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(id).populate('preferenceCard', 'cardTitle').lean();
    if (!event)
        return null;
    if (event.userId.toString() !== requester.id && requester.role !== 'SUPER_ADMIN') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not allowed to view this event');
    }
    return event;
});
const updateEventInDB = (eventId, user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the event by ID
    const event = yield event_model_1.default.findById(eventId);
    if (!event) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found');
    }
    // Check authorization: either the owner or a SUPER_ADMIN can update
    if (event.userId.toString() !== user.id && user.role !== 'SUPER_ADMIN') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to update this event');
    }
    // Update the event with new data
    Object.assign(event, payload);
    // Save the changes
    const updatedEvent = yield event.save();
    return updatedEvent;
});
const deleteEventFromDB = (id, requester) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(id);
    if (!event) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found');
    }
    if (event.userId.toString() !== requester.id && requester.role !== 'SUPER_ADMIN') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not allowed to delete this event');
    }
    const deleted = yield event_model_1.default.findByIdAndDelete(id);
    return deleted;
});
exports.EventService = {
    createEventInDB,
    listEventsForUserFromDB,
    getEventByIdFromDB,
    updateEventInDB,
    deleteEventFromDB,
};
