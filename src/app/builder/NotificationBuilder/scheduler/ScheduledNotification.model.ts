/**
 * ScheduledNotification Model
 *
 * MongoDB model for storing scheduled notifications.
 * The scheduler service processes these at the scheduled time.
 */

import { Schema, model, Document, Types } from 'mongoose';

// ==================== INTERFACE ====================

export interface IScheduledNotification extends Document {
  // Recipients
  recipients: Types.ObjectId[];

  // Content - Template based
  template?: string;
  variables?: Record<string, any>;

  // Content - Manual
  title?: string;
  text?: string;
  type?: string;
  referenceId?: Types.ObjectId;
  data?: Record<string, any>;

  // Channels
  channels: ('push' | 'socket' | 'email' | 'database')[];

  // Scheduling
  scheduledFor: Date;

  // Status
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

  // Results
  result?: {
    sent?: {
      push?: number;
      socket?: number;
      email?: number;
      database?: number;
    };
    failed?: {
      push?: string[];
      socket?: string[];
      email?: string[];
      database?: string[];
    };
    processedAt?: Date;
    error?: string;
  };

  // Metadata
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SCHEMA ====================

const ScheduledNotificationSchema = new Schema<IScheduledNotification>(
  {
    // Recipients - array of user IDs
    recipients: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],

    // Template-based content
    template: {
      type: String,
    },
    variables: {
      type: Schema.Types.Mixed,
    },

    // Manual content
    title: {
      type: String,
    },
    text: {
      type: String,
    },
    type: {
      type: String,
      enum: [
        'ADMIN',
        'BID',
        'BID_ACCEPTED',
        'BOOKING',
        'TASK',
        'SYSTEM',
        'DELIVERY_SUBMITTED',
        'PAYMENT_PENDING',
        'ORDER',
        'PAYMENT',
        'MESSAGE',
        'REMINDER',
      ],
      default: 'SYSTEM',
    },
    referenceId: {
      type: Schema.Types.ObjectId,
    },
    data: {
      type: Schema.Types.Mixed,
    },

    // Channels to send to
    channels: [{
      type: String,
      enum: ['push', 'socket', 'email', 'database'],
      required: true,
    }],

    // When to send
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },

    // Current status
    status: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // Results after processing
    result: {
      sent: {
        push: Number,
        socket: Number,
        email: Number,
        database: Number,
      },
      failed: {
        push: [String],
        socket: [String],
        email: [String],
        database: [String],
      },
      processedAt: Date,
      error: String,
    },

    // Who created this scheduled notification
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================

// Compound index for finding due notifications efficiently
ScheduledNotificationSchema.index(
  { scheduledFor: 1, status: 1 },
  { name: 'due_notifications_idx' }
);

// Index for finding user's scheduled notifications
ScheduledNotificationSchema.index(
  { recipients: 1, status: 1 },
  { name: 'user_scheduled_idx' }
);

// ==================== MODEL ====================

const ScheduledNotification = model<IScheduledNotification>(
  'ScheduledNotification',
  ScheduledNotificationSchema
);

export default ScheduledNotification;
