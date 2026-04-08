import { Schema, model } from 'mongoose';
import { INotification } from './notification.interface';

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String },
    title: { type: String },
    subtitle: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
    link: {
      label: { type: String },
      url: { type: String },
    },
    resourceType: { type: String },
    resourceId: { type: String },
    read: { type: Boolean, default: false },
    icon: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Keep both export names for compatibility with existing imports
export const Notification = model<INotification>('Notification', NotificationSchema);
export const NotificationModel = Notification;
