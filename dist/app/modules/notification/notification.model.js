"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notification_interface_1 = require("./notification.interface");
const NotificationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: notification_interface_1.NOTIFICATION_TYPES,
        required: true,
    },
    title: { type: String, required: true },
    subtitle: { type: String },
    // Polymorphic reference: `resourceType` + `resourceId` is the single way
    // to link a notification back to its source entity. The legacy
    // `referenceId` field has been removed — migrate any reads to
    // `{ resourceType, resourceId }` instead.
    resourceType: { type: String },
    resourceId: { type: String },
    link: {
        label: { type: String },
        url: { type: String },
    },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    icon: { type: String },
    expiresAt: { type: Date },
}, { timestamps: true });
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index({ resourceType: 1, resourceId: 1 });
// Keep both export names for compatibility with existing imports
exports.Notification = (0, mongoose_1.model)('Notification', NotificationSchema);
exports.NotificationModel = exports.Notification;
