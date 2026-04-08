import { Model, Types } from 'mongoose';

export type NotificationLink = {
  label: string;
  url: string;
};

export type INotification = {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  referenceId?: Types.ObjectId;
  metadata?: Record<string, unknown> | undefined;
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
