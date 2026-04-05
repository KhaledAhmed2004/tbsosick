"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    // Legacy/general fields
    text: { type: String },
    receiver: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    referenceId: { type: mongoose_1.Schema.Types.ObjectId },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    // New medical UI fields
    userId: { type: String, index: true },
    type: { type: String },
    title: { type: String },
    subtitle: { type: String },
    link: {
        label: { type: String },
        url: { type: String },
    },
    resourceType: { type: String },
    resourceId: { type: String },
    read: { type: Boolean, default: false, index: true },
    icon: { type: String },
    expiresAt: { type: Date },
}, { timestamps: true });
NotificationSchema.index({ receiver: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
// Keep both export names for compatibility with existing imports
exports.Notification = (0, mongoose_1.model)('Notification', NotificationSchema);
exports.NotificationModel = exports.Notification;
