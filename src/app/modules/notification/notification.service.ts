import { NotificationModel } from './notification.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { sendNotifications } from './notificationsHelper';
import { Types } from 'mongoose';

/**
 * Fetches notifications + total count + unread count in a single
 * aggregation. Previously this used 3 separate queries (find + 2x
 * countDocuments). `$facet` runs all three pipelines over the same
 * `$match` result, so we go from 3 round trips → 1.
 *
 * The compound index `{ userId: 1, read: 1, createdAt: -1 }` covers
 * every facet.
 */
const listForUser = async (
  userId: string,
  query: { page?: string; limit?: string } = {},
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const [result] = await NotificationModel.aggregate<{
    notifications: any[];
    totalCount: { n: number }[];
    unreadCount: { n: number }[];
  }>([
    { $match: { userId: new Types.ObjectId(userId), isDeleted: false } },
    {
      $facet: {
        notifications: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ],
        totalCount: [{ $count: 'n' }],
        unreadCount: [{ $match: { read: false } }, { $count: 'n' }],
      },
    },
  ]);

  return {
    notifications: result?.notifications ?? [],
    meta: {
      page,
      limit,
      total: result?.totalCount?.[0]?.n ?? 0,
      unreadCount: result?.unreadCount?.[0]?.n ?? 0,
    },
  };
};

const markAllRead = async (userId: string) => {
  await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
  return { updated: true };
};

const markRead = async (id: string, userId: string, read = true) => {
  const doc = await NotificationModel.findById(id);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  if (doc.userId?.toString() !== userId) throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized');
  doc.read = read;
  await doc.save();
  return doc;
};

const deleteById = async (id: string, userId: string) => {
  const doc = await NotificationModel.findOne({ _id: id, isDeleted: false });
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  if (doc.userId?.toString() !== userId) throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized');

  // Soft delete
  await NotificationModel.findByIdAndUpdate(id, { $set: { isDeleted: true } });
  return { deleted: true };
};

// Helper creators for triggers
const createForPreferenceCard = async (params: {
  userId: string;
  cardId: string;
  cardTitle: string;
  surgeonName?: string;
  procedure?: string;
}) => {
  const subtitle = params.surgeonName && params.procedure
    ? `${params.surgeonName} — ${params.procedure}`
    : params.cardTitle;

  return sendNotifications({
    userId: new Types.ObjectId(params.userId),
    type: 'PREFERENCE_CARD_CREATED',
    title: 'New Card Added',
    subtitle,
    link: { label: 'View Card', url: `/cards/${params.cardId}` },
    resourceType: 'PreferenceCard',
    resourceId: params.cardId,
    read: false,
    icon: 'card',
  });
};

const createForEventScheduled = async (params: {
  userId: string;
  eventId: string;
  title: string;
  whenText?: string;
}) => {
  return sendNotifications({
    userId: new Types.ObjectId(params.userId),
    type: 'EVENT_SCHEDULED',
    title: 'Event Scheduled',
    subtitle: `${params.title}${params.whenText ? ' on ' + params.whenText : ''}`,
    link: { label: 'View Event', url: `/events/${params.eventId}` },
    resourceType: 'Event',
    resourceId: params.eventId,
    read: false,
    icon: 'calendar',
  });
};

export const NotificationService = {
  listForUser,
  markAllRead,
  markRead,
  deleteById,
  createForPreferenceCard,
  createForEventScheduled,
};
