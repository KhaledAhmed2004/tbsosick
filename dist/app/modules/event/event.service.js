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
        let durationInHours;
        if (payload.endsAt) {
            endsAt = new Date(payload.endsAt);
            if (Number.isNaN(endsAt.getTime())) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid endsAt');
            }
            durationInHours = (endsAt.getTime() - startsAt.getTime()) / 3600000;
        }
        else if (typeof payload.durationInHours === 'number') {
            durationInHours = payload.durationInHours;
            endsAt = new Date(startsAt.getTime() + durationInHours * 3600000);
        }
        else {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'endsAt or durationInHours is required with startsAt');
        }
        if (endsAt <= startsAt) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'endsAt must be after startsAt');
        }
        return { startsAt, endsAt, durationInHours };
    }
    // Legacy triple: { date: 'YYYY-MM-DD', time: 'HH:MM' or 'HH:MM AM/PM', durationInHours: N }
    if (payload.date && payload.time && payload.durationInHours) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date');
        }
        let startsAt;
        const timeStr = payload.time.trim();
        // Check if time is in AM/PM format
        if (/(AM|PM)$/i.test(timeStr)) {
            const [time, modifier] = timeStr.split(/\s+/);
            let [hours, minutes] = time.split(':').map(Number);
            if (modifier.toUpperCase() === 'PM' && hours < 12)
                hours += 12;
            if (modifier.toUpperCase() === 'AM' && hours === 12)
                hours = 0;
            const paddedHours = hours.toString().padStart(2, '0');
            const paddedMinutes = minutes.toString().padStart(2, '0');
            startsAt = new Date(`${payload.date}T${paddedHours}:${paddedMinutes}:00.000Z`);
        }
        else {
            if (!/^\d{2}:\d{2}$/.test(timeStr)) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid time');
            }
            startsAt = new Date(`${payload.date}T${timeStr}:00.000Z`);
        }
        if (Number.isNaN(startsAt.getTime())) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date/time combination');
        }
        const durationInHours = Number(payload.durationInHours);
        const endsAt = new Date(startsAt.getTime() + durationInHours * 3600000);
        return { startsAt, endsAt, durationInHours };
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
/**
 * Transforms a DB event object into the user-friendly format requested by the client.
 */
const transformEventResponse = (event, isListView = false) => {
    const startsAt = new Date(event.startsAt);
    const now = new Date();
    // Extract date (YYYY-MM-DD)
    const date = startsAt.toISOString().split('T')[0];
    // Extract time in 12-hour AM/PM format
    let hours = startsAt.getUTCHours();
    const minutes = startsAt.getUTCMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const time = `${hours}:${minutes} ${ampm}`;
    const { userId, startsAt: _s, endsAt: _e, preferenceCard } = event, rest = __rest(event, ["userId", "startsAt", "endsAt", "preferenceCard"]);
    const tag = startsAt > now ? 'Upcoming' : 'Past';
    // If list view, return minimal fields
    if (isListView) {
        return {
            _id: event._id,
            title: event.title,
            tag,
            date,
            time,
            durationInHours: event.durationInHours,
            eventType: event.eventType,
        };
    }
    // Handle populated preferenceCard mapping for detailed view
    let linkedPreferenceCard = preferenceCard;
    if (preferenceCard &&
        typeof preferenceCard === 'object' &&
        preferenceCard.cardTitle) {
        linkedPreferenceCard = {
            _id: preferenceCard._id,
            title: preferenceCard.cardTitle,
        };
    }
    return Object.assign(Object.assign({}, rest), { tag,
        date,
        time,
        linkedPreferenceCard, createdBy: userId });
};
const createEventInDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const range = resolveTimeRange(payload);
    if (!range) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'startsAt (or legacy date + time + durationInHours) is required');
    }
    // Strip legacy fields from the payload to avoid writing them to DB.
    const { date, time, durationInHours, startsAt, endsAt } = payload, rest = __rest(payload, ["date", "time", "durationInHours", "startsAt", "endsAt"]);
    const event = yield event_model_1.default.create(Object.assign(Object.assign({ userId }, rest), { startsAt: range.startsAt, endsAt: range.endsAt, durationInHours: range.durationInHours }));
    const eventId = event._id.toString();
    yield scheduleEventReminders(userId, eventId, payload.title, range.startsAt);
    return transformEventResponse(event.toObject());
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
    const events = yield event_model_1.default.find(filter).sort({ startsAt: 1 }).lean();
    return events.map(event => transformEventResponse(event, true));
});
const getEventByIdFromDB = (id, requester) => __awaiter(void 0, void 0, void 0, function* () {
    const event = yield event_model_1.default.findById(id)
        .populate('preferenceCard', 'cardTitle')
        .lean();
    if (!event)
        return null;
    if (event.userId.toString() !== requester.id &&
        requester.role !== 'SUPER_ADMIN') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Not allowed to view this event');
    }
    return transformEventResponse(event);
});
const updateEventInDB = (eventId, user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
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
        payload.durationInHours !== undefined;
    let normalised = Object.assign({}, payload);
    if (touchesTime) {
        const merged = {
            startsAt: (_a = payload.startsAt) !== null && _a !== void 0 ? _a : event.startsAt,
            endsAt: payload.endsAt,
            date: payload.date,
            time: payload.time,
            durationInHours: (_b = payload.durationInHours) !== null && _b !== void 0 ? _b : event.durationInHours,
        };
        const range = resolveTimeRange(merged);
        if (range) {
            normalised.startsAt = range.startsAt;
            normalised.endsAt = range.endsAt;
            normalised.durationInHours = range.durationInHours;
        }
    }
    // Strip temporary fields from normalised before updating DB
    delete normalised.date;
    delete normalised.time;
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
