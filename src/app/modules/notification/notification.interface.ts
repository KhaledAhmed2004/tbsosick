import { Model, Types } from 'mongoose';

export type NotificationLink = {
  label: string;
  url: string;
};

// Unified notification interface to support both legacy and new schema usages
export type INotification = {
  // Common/legacy fields
  _id?: Types.ObjectId;
  text?: string;
  receiver?: Types.ObjectId; // legacy target user
  referenceId?: Types.ObjectId;
  metadata?: Record<string, unknown> | undefined;
  isRead?: boolean;

  // New medical UI fields
  userId?: string; // target user
  type?:
    | 'PREFERENCE_CARD_CREATED'
    | 'EVENT_SCHEDULED'
    | 'GENERAL'
    | 'ADMIN'
    | 'BID'
    | 'BID_ACCEPTED'
    | 'BOOKING'
    | 'TASK'
    | 'SYSTEM'
    | 'DELIVERY_SUBMITTED'
    | 'PAYMENT_PENDING'
    | 'MESSAGE'
    | 'RATING'
    | 'PAYMENT'
    | 'REMINDER';
  title?: string;
  subtitle?: string;
  link?: NotificationLink;
  resourceType?: 'PreferenceCard' | 'Event' | string;
  resourceId?: string;
  read?: boolean;
  icon?: string;

  // Timestamps (Mongoose)
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Notification = INotification;
export type NotificationModel = Model<INotification, Record<string, unknown>>;
