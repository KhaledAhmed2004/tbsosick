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
exports.EventService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const event_model_1 = __importDefault(require("./event.model"));
const NotificationBuilder_1 = require("../../builder/NotificationBuilder");
/**
 * Normalises a payload into { startsAt, endsAt } regardless of whether the
 * client sent the new `startsAt`/`endsAt` pair or the legacy
 * `{ date, time, durationHours }` triple. Throws on invalid input.
 */
const resolveTimeRange = (payload) => {
    if (payload.startsAt) {
        const startsAt = new Date(payload.startsAt);
        if (Number.isNaN(startsAt.getTime())) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid startsAt');
        }
        let endsAt;
        if (payload.endsAt) {
            endsAt = new Date(payload.endsAt);
            if (Number.isNaN(endsAt.getTime())) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid endsAt');
            }
        }
        else if (typeof payload.durationHours === 'number') {
            endsAt = new Date(startsAt.getTime() + payload.durationHours * 3600000);
        }
        else {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'endsAt or durationHours is required with startsAt');
        }
        if (endsAt <= startsAt) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'endsAt must be after startsAt');
        }
        return { startsAt, endsAt };
    }
    // Legacy triple: { date: 'YYYY-MM-DD', time: 'HH:MM', durationHours: N }
    if (payload.date && payload.time && payload.durationHours) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date');
        }
        if (!/^\d{2}:\d{2}$/.test(payload.time)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid time');
        }
        const startsAt = new Date(`${payload.date}T${payload.time}:00.000Z`);
        const endsAt = new Date(startsAt.getTime() + Number(payload.durationHours) * 3600000);
        return { startsAt, endsAt };
    }
    return null;
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
            .setResource('Event', eventId)
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
    const range = resolveTimeRange(payload);
    if (!range) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'startsAt (or legacy date + time + durationHours) is required');
    }
    // Strip legacy/duration fields from the payload to avoid writing them to DB.
    const { date, time, durationHours, startsAt, endsAt } = payload, rest = __rest(payload, ["date", "time", "durationHours", "startsAt", "endsAt"]);
    const event = yield event_model_1.default.create(Object.assign(Object.assign({ userId }, rest), { startsAt: range.startsAt, endsAt: range.endsAt }));
    const eventId = event._id.toString();
    yield scheduleEventReminders(userId, eventId, payload.title, range.startsAt);
    return event;
});
const listEventsForUserFromDB = (userId, query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = { userId };
    if (query.from || query.to) {
        filter.startsAt = {};
        if (query.from) {
            filter.startsAt.$gte = new Date(`${query.from}T00:00:00.000Z`);
        }
        if (query.to) {
            filter.startsAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
        }
    }
    return event_model_1.default.find(filter)
        .select('title eventType startsAt endsAt location notes personnel preferenceCard')
        .lean();
});
const getEventByIdFromDB = (id, requester) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(id)
        .populate('preferenceCard', 'cardTitle')
        .lean();
    if (!event)
        return null;
    if (event.userId.toString() !== requester.id && requester.role !== 'SUPER_ADMIN') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not allowed to view this event');
    }
    return event;
});
const updateEventInDB = (eventId, user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const event = yield event_model_1.default.findById(eventId);
    if (!event) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Event not found');
    }
    if (event.userId.toString() !== user.id && user.role !== 'SUPER_ADMIN') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not authorized to update this event');
    }
    // If any time-related field is in the payload, re-resolve the window.
    const touchesTime = payload.startsAt !== undefined ||
        payload.endsAt !== undefined ||
        payload.date !== undefined ||
        payload.time !== undefined ||
        payload.durationHours !== undefined;
    let normalised = Object.assign({}, payload);
    if (touchesTime) {
        const merged = {
            startsAt: (_a = payload.startsAt) !== null && _a !== void 0 ? _a : event.startsAt,
            endsAt: payload.endsAt,
            date: payload.date,
            time: payload.time,
            durationHours: payload.durationHours,
        };
        const range = resolveTimeRange(merged);
        if (!range) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Could not resolve event time range');
        }
        normalised.startsAt = range.startsAt;
        normalised.endsAt = range.endsAt;
        delete normalised.date;
        delete normalised.time;
        delete normalised.durationHours;
    }
    Object.assign(event, normalised);
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
