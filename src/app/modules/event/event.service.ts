import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import EventModel from './event.model';
import { IEvent } from './event.interface';
import { NotificationBuilder } from '../../builder/NotificationBuilder';

const buildEventStartDate = (date: string, time: string): Date => {
  return new Date(`${date}T${time}:00.000Z`);
};

const scheduleEventReminders = async (
  userId: string,
  eventId: string,
  title: string,
  eventStart: Date,
): Promise<void> => {
  const now = new Date();
  const reminders = [
    { hoursBefore: 24 },
    { hoursBefore: 1 },
  ];

  for (const reminder of reminders) {
    const scheduledFor = new Date(
      eventStart.getTime() - reminder.hoursBefore * 60 * 60 * 1000,
    );

    if (scheduledFor <= now) {
      continue;
    }

    const body =
      reminder.hoursBefore === 24
        ? `Your event "${title}" is in 24 hours`
        : `Your event "${title}" is in 1 hour`;

    await new NotificationBuilder()
      .to(userId)
      .setTitle('Event Reminder')
      .setText(body)
      .setType('REMINDER')
      .setReference(eventId)
      .setData({
        type: 'EVENT_REMINDER',
        eventId,
        hoursBefore: reminder.hoursBefore,
      })
      .viaPush()
      .viaDatabase()
      .schedule(scheduledFor)
      .send();
  }
};

const createEventInDB = async (userId: string, payload: Record<string, any>) => {
  if (!payload.date?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid date');
  }
  if (!payload.time?.match(/^\d{2}:\d{2}$/)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid time');
  }

  const event = await EventModel.create({
    userId,
    ...payload,
    date: new Date(`${payload.date}T00:00:00.000Z`),
  });

  const eventId = (event._id as any).toString();
  const eventStart = buildEventStartDate(payload.date, payload.time);

  await scheduleEventReminders(
    userId,
    eventId,
    payload.title,
    eventStart,
  );

  return event;
};

const listEventsForUserFromDB = async (
  userId: string,
  query: { from?: string; to?: string },
) => {
  const filter: Record<string, any> = { userId };

  if (query.from || query.to) {
    filter.date = {};
    if (query.from) {
      filter.date.$gte = new Date(`${query.from}T00:00:00.000Z`);
    }
    if (query.to) {
      filter.date.$lte = new Date(`${query.to}T00:00:00.000Z`);
    }
  }

  return EventModel.find(filter).select(
    'title eventType date time durationHours location notes personnel preferenceCard',
  ).lean();
};

const getEventByIdFromDB = async (
  id: string,
  requester: { id: string; role: string },
): Promise<IEvent | null> => {
  const event = await EventModel.findById(id).populate(
    'preferenceCard',
    'cardTitle',
  ).lean();
  if (!event) return null;
  if (event.userId.toString() !== requester.id && requester.role !== 'SUPER_ADMIN') {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not allowed to view this event',
    );
  }
  return event;
};

const updateEventInDB = async (
  eventId: string,
  user: { id: string; role: string },
  payload: Partial<IEvent>,
) => {
  // Find the event by ID
  const event = await EventModel.findById(eventId);
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
  }

  // Check authorization: either the owner or a SUPER_ADMIN can update
  if (event.userId.toString() !== user.id && user.role !== 'SUPER_ADMIN') {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not authorized to update this event',
    );
  }

  // Update the event with new data
  Object.assign(event, payload);

  // Save the changes
  const updatedEvent = await event.save();

  return updatedEvent;
};

const deleteEventFromDB = async (
  id: string,
  requester: { id: string; role: string },
): Promise<IEvent | null> => {
  const event = await EventModel.findById(id);
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
  }
  if (event.userId.toString() !== requester.id && requester.role !== 'SUPER_ADMIN') {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not allowed to delete this event',
    );
  }
  const deleted = await EventModel.findByIdAndDelete(id);
  return deleted;
};

export const EventService = {
  createEventInDB,
  listEventsForUserFromDB,
  getEventByIdFromDB,
  updateEventInDB,
  deleteEventFromDB,
};
