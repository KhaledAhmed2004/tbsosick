/**
 * Database Channel - MongoDB Notification Storage
 *
 * Persists notifications to the Notification collection.
 * Uses the existing Notification model.
 */

import { Notification } from '../../../modules/notification/notification.model';
import { Types } from 'mongoose';

type NotificationType =
  | 'ADMIN'
  | 'BID'
  | 'BID_ACCEPTED'
  | 'BOOKING'
  | 'TASK'
  | 'SYSTEM'
  | 'DELIVERY_SUBMITTED'
  | 'PAYMENT_PENDING';

interface IUser {
  _id: any;
}

interface DatabaseContent {
  title?: string;
  text: string;
  type: NotificationType | string;
  referenceId?: string | Types.ObjectId;
}

interface DatabaseResult {
  sent: number;
  failed: string[];
}

/**
 * Save notifications to MongoDB
 */
export const saveToDatabase = async (
  users: IUser[],
  content: DatabaseContent
): Promise<DatabaseResult> => {
  const result: DatabaseResult = { sent: 0, failed: [] };

  // Prepare notification documents
  const notifications = users.map(user => ({
    title: content.title,
    subtitle: content.text,
    userId: user._id,
    type: content.type || 'SYSTEM',
    referenceId: content.referenceId,
    read: false,
  }));

  try {
    // Bulk insert for efficiency
    const created = await Notification.insertMany(notifications, {
      ordered: false, // Continue on error
    });
    result.sent = created.length;
  } catch (error: any) {
    // Handle partial success in bulk insert
    if (error.insertedDocs) {
      result.sent = error.insertedDocs.length;
      // Remaining are failed
      const insertedIds = new Set(
        error.insertedDocs.map((d: any) => d.userId.toString())
      );
      result.failed = users
        .filter(u => !insertedIds.has(u._id.toString()))
        .map(u => u._id.toString());
    } else {
      console.error('Database insert error:', error);
      result.failed = users.map(u => u._id.toString());
    }
  }

  return result;
};

export default saveToDatabase;
