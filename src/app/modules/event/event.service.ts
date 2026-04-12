import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import EventModel from './event.model';
import { IEvent } from './event.interface';
import { NotificationBuilder } from '../../builder/NotificationBuilder';

/**
 * Normalises a payload into { startsAt, endsAt } regardless of whether the
 * client sent the new `startsAt`/`endsAt` pair or the legacy
 * `{ date, time, durationHours }` triple. Throws on invalid input.
 */
const resolveTimeRange = (
  payload: Record<string, any>,
): { startsAt: Date; endsAt: Date } | null => {
  if (payload.startsAt) {
    const startsAt = new Date(payload.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid startsAt');
    }

    let endsAt: Date;
    if (payload.endsAt) {
      endsAt = new Date(payload.endsAt);
      if (Number.isNaN(endsAt.getTime())) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid endsAt');
      }
    } else if (typeof payload.durationHours === 'number') {
      endsAt = new Date(startsAt.getTime() + payload.durationHours * 3600_000);
    } else {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'endsAt or durationHours is required with startsAt',
      );
    }

    if (endsAt <= startsAt) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'endsAt must be after startsAt');
    }
    return { startsAt, endsAt };
  }

  // Legacy triple: { date: 'YYYY-MM-DD', time: 'HH:MM', durationHours: N }
  if (payload.date && payload.time && payload.durationHours) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid date');
    }
    if (!/^\d{2}:\d{2}$/.test(payload.time)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid time');
    }
    const startsAt = new Date(`${payload.date}T${payload.time}:00.000Z`);
    const endsAt = new Date(
      startsAt.getTime() + Number(payload.durationHours) * 3600_000,
    );
    return { startsAt, endsAt };
  }

  return null;
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
      .setResource('Event', eventId)
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
  const range = resolveTimeRange(payload);
  if (!range) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'startsAt (or legacy date + time + durationHours) is required',
    );
  }

  // Strip legacy/duration fields from the payload to avoid writing them to DB.
  const { date, time, durationHours, startsAt, endsAt, ...rest } = payload;

  const event = await EventModel.create({
    userId,
    ...rest,
    startsAt: range.startsAt,
    endsAt: range.endsAt,
  });

  const eventId = (event._id as any).toString();

  await scheduleEventReminders(userId, eventId, payload.title, range.startsAt);

  return event;
};

const listEventsForUserFromDB = async (
  userId: string,
  query: { from?: string; to?: string },
) => {
  const filter: Record<string, any> = { userId };

  if (query.from || query.to) {
    filter.startsAt = {};
    if (query.from) {
      filter.startsAt.$gte = new Date(`${query.from}T00:00:00.000Z`);
    }
    if (query.to) {
      filter.startsAt.$lte = new Date(`${query.to}T23:59:59.999Z`);
    }
  }

  return EventModel.find(filter)
    .select(
      'title eventType startsAt endsAt location notes personnel preferenceCard',
    )
    .lean();
};

const getEventByIdFromDB = async (
  id: string,
  requester: { id: string; role: string },
): Promise<IEvent | null> => {
  const event = await EventModel.findById(id)
    .populate('preferenceCard', 'cardTitle')
    .lean();
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
  payload: Partial<IEvent> & Record<string, any>,
) => {
  const event = await EventModel.findById(eventId);
  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Event not found');
  }

  if (event.userId.toString() !== user.id && user.role !== 'SUPER_ADMIN') {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not authorized to update this event',
    );
  }

  // If any time-related field is in the payload, re-resolve the window.
  const touchesTime =
    payload.startsAt !== undefined ||
    payload.endsAt !== undefined ||
    (payload as any).date !== undefined ||
    (payload as any).time !== undefined ||
    (payload as any).durationHours !== undefined;

  let normalised: Record<string, any> = { ...payload };
  if (touchesTime) {
    const merged = {
      startsAt: payload.startsAt ?? event.startsAt,
      endsAt: payload.endsAt,
      date: (payload as any).date,
      time: (payload as any).time,
      durationHours: (payload as any).durationHours,
    };
    const range = resolveTimeRange(merged);
    if (!range) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Could not resolve event time range',
      );
    }
    normalised.startsAt = range.startsAt;
    normalised.endsAt = range.endsAt;
    delete normalised.date;
    delete normalised.time;
    delete normalised.durationHours;
  }

  Object.assign(event, normalised);
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
