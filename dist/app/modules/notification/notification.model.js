"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String },
    title: { type: String },
    subtitle: { type: String },
    referenceId: { type: mongoose_1.Schema.Types.ObjectId },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    link: {
        label: { type: String },
        url: { type: String },
    },
    resourceType: { type: String },
    resourceId: { type: String },
    read: { type: Boolean, default: false },
    icon: { type: String },
    expiresAt: { type: Date },
}, { timestamps: true });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Keep both export names for compatibility with existing imports
exports.Notification = (0, mongoose_1.model)('Notification', NotificationSchema);
exports.NotificationModel = exports.Notification;
