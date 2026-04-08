import { NotificationModel } from './notification.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';

const listForUser = async (userId: string) => {
  return NotificationModel.find({ userId }).sort({ createdAt: -1 }).lean();
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
  const doc = await NotificationModel.findById(id);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  if (doc.userId?.toString() !== userId) throw new ApiError(StatusCodes.FORBIDDEN, 'Not authorized');
  await NotificationModel.findByIdAndDelete(id);
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
  return NotificationModel.create({
    userId: params.userId,
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
  whenText?: string; // e.g., "2026-01-08 at 08:00"
}) => {
  return NotificationModel.create({
    userId: params.userId,
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
