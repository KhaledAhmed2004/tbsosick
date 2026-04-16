"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const event_interface_1 = require("./event.interface");
const PersonnelSchema = new mongoose_1.Schema({
    leadSurgeon: { type: String, required: true },
    surgicalTeam: { type: [String], required: true },
}, { _id: false });
const EventSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    eventType: {
        type: String,
        enum: Object.values(event_interface_1.EVENT_TYPE),
        required: true,
    },
    location: { type: String },
    preferenceCard: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PreferenceCard' },
    notes: { type: String },
    personnel: { type: PersonnelSchema },
}, {
    timestamps: true,
});
// Primary calendar query: "events for user X between T1 and T2".
EventSchema.index({ userId: 1, startsAt: 1 });
const EventModel = (0, mongoose_1.model)('Event', EventSchema);
exports.default = EventModel;
