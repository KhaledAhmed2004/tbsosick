"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const event_interface_1 = require("./event.interface");
const PersonnelSchema = new mongoose_1.Schema({
    leadSurgeon: { type: String, required: true },
    surgicalTeam: { type: [String], required: true },
}, { _id: false });
const EventSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    durationHours: { type: Number, required: true },
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
const EventModel = (0, mongoose_1.model)('Event', EventSchema);
exports.default = EventModel;
