import { Schema, model, Types } from 'mongoose';
import { INotification } from './notification.interface';

const NotificationSchema = new Schema<INotification>(
  {
    // Legacy/general fields
    text: { type: String },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    referenceId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
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
  },
  { timestamps: true }
);

NotificationSchema.index({ receiver: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

// Keep both export names for compatibility with existing imports
export const Notification = model<INotification>('Notification', NotificationSchema);
export const NotificationModel = Notification;
