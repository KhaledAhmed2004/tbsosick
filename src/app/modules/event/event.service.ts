import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
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
): { startsAt: Date; endsAt: Date; durationInHours: number } | null => {
  if (payload.startsAt) {
    const startsAt = new Date(payload.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid startsAt');
    }

    let endsAt: Date;
    let durationInHours: number;

    if (payload.endsAt) {
      endsAt = new Date(payload.endsAt);
      if (Number.isNaN(endsAt.getTime())) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid endsAt');
      }
      durationInHours = (endsAt.getTime() - startsAt.getTime()) / 3600_000;
    } else if (typeof payload.durationInHours === 'number') {
      durationInHours = payload.durationInHours;
      endsAt = new Date(startsAt.getTime() + durationInHours * 3600_000);
    } else {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'endsAt or durationInHours is required with startsAt',
      );
    }

    if (endsAt <= startsAt) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'endsAt must be after startsAt');
    }
    return { startsAt, endsAt, durationInHours };
  }

  // Legacy triple: { date: 'YYYY-MM-DD', time: 'HH:MM' or 'HH:MM AM/PM', durationInHours: N }
  if (payload.date && payload.time && payload.durationInHours) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid date');
    }

    let startsAt: Date;
    const timeStr = payload.time.trim();

    // Check if time is in AM/PM format
    if (/(AM|PM)$/i.test(timeStr)) {
      const [time, modifier] = timeStr.split(/\s+/);
      let [hours, minutes] = time.split(':').map(Number);

      if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

      const paddedHours = hours.toString().padStart(2, '0');
      const paddedMinutes = minutes.toString().padStart(2, '0');
      startsAt = new Date(`${payload.date}T${paddedHours}:${paddedMinutes}:00.000Z`);
    } else {
      if (!/^\d{2}:\d{2}$/.test(timeStr)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid time');
      }
      startsAt = new Date(`${payload.date}T${timeStr}:00.000Z`);
    }

    if (Number.isNaN(startsAt.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid date/time combination');
    }

    const durationInHours = Number(payload.durationInHours);
    const endsAt = new Date(startsAt.getTime() + durationInHours * 3600_000);

    return { startsAt, endsAt, durationInHours };
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

/**
 * Transforms a DB event object into the user-friendly format requested by the client.
 */
const transformEventResponse = (event: any, isListView: boolean = false) => {
  const startsAt = new Date(event.startsAt);
  const now = new Date();

  // Extract date (YYYY-MM-DD)
  const date = startsAt.toISOString().split('T')[0];

  // Extract time in 12-hour AM/PM format
  let hours = startsAt.getUTCHours();
  const minutes = startsAt.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const time = `${hours}:${minutes} ${ampm}`;

  const {
    userId,
    startsAt: _s,
    endsAt: _e,
    preferenceCard,
    ...rest
  } = event;

  const tag = startsAt > now ? 'Upcoming' : 'Past';

  // If list view, return minimal fields
  if (isListView) {
    return {
      _id: event._id,
      title: event.title,
      tag,
      date,
      time,
      durationInHours: event.durationInHours,
      eventType: event.eventType,
    };
  }

  // Handle populated preferenceCard mapping for detailed view
  let linkedPreferenceCard = preferenceCard;
  if (
    preferenceCard &&
    typeof preferenceCard === 'object' &&
    preferenceCard.cardTitle
  ) {
    linkedPreferenceCard = {
      _id: preferenceCard._id,
      title: preferenceCard.cardTitle,
    };
  }

  return {
    ...rest,
    tag,
    date,
    time,
    linkedPreferenceCard,
    createdBy: userId,
  };
};

const createEventInDB = async (userId: string, payload: Record<string, any>) => {
  const range = resolveTimeRange(payload);
  if (!range) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'startsAt (or legacy date + time + durationInHours) is required',
    );
  }

  // Strip legacy fields from the payload to avoid writing them to DB.
  const { date, time, durationInHours, startsAt, endsAt, ...rest } = payload;

  const event = await EventModel.create({
    userId,
    ...rest,
    startsAt: range.startsAt,
    endsAt: range.endsAt,
    durationInHours: range.durationInHours,
  });

  const eventId = (event._id as any).toString();

  await scheduleEventReminders(userId, eventId, payload.title, range.startsAt);

  return transformEventResponse(event.toObject());
};

const listEventsForUserFromDB = async (
  userId: string,
  query: { from?: string; to?: string; date?: string },
) => {
  const filter: Record<string, any> = { userId };

  const from = query.date || query.from;
  const to = query.date || query.to;

  if (from || to) {
    filter.startsAt = {};
    if (from) {
      filter.startsAt.$gte = new Date(`${from}T00:00:00.000Z`);
    }
    if (to) {
      filter.startsAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }
  }

  const events = await EventModel.find(filter).sort({ startsAt: 1 }).lean();

  return events.map(event => transformEventResponse(event, true));
};

/**
 * Returns an array of unique dates (YYYY-MM-DD) that have events.
 * Used for calendar dots to keep the payload extremely lightweight.
 */
const getCalendarHighlightsFromDB = async (
  userId: string,
  query: { from: string; to: string },
) => {
  const filter = {
    userId: new Types.ObjectId(userId),
    startsAt: {
      $gte: new Date(`${query.from}T00:00:00.000Z`),
      $lte: new Date(`${query.to}T23:59:59.999Z`),
    },
  };

  const highlights = await EventModel.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startsAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Return a map of dates to counts: { "2026-05-06": 2 }
  const result: Record<string, number> = {};
  highlights.forEach(h => {
    result[h._id] = h.count;
  });

  return result;
};

const getEventByIdFromDB = async (
  id: string,
  requester: { id: string; role: string },
) => {
  const event = await EventModel.findById(id)
    .populate('preferenceCard', 'cardTitle')
    .lean();

  if (!event) return null;

  if (
    event.userId.toString() !== requester.id &&
    requester.role !== 'SUPER_ADMIN'
  ) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Not allowed to view this event');
  }

  return transformEventResponse(event);
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
    (payload as any).durationInHours !== undefined;

  let normalised: Record<string, any> = { ...payload };
  if (touchesTime) {
    const merged = {
      startsAt: payload.startsAt ?? event.startsAt,
      endsAt: payload.endsAt,
      date: (payload as any).date,
      time: (payload as any).time,
      durationInHours: (payload as any).durationInHours ?? event.durationInHours,
    };
    const range = resolveTimeRange(merged);
    if (range) {
      normalised.startsAt = range.startsAt;
      normalised.endsAt = range.endsAt;
      normalised.durationInHours = range.durationInHours;
    }
  }

  // Strip temporary fields from normalised before updating DB
  delete (normalised as any).date;
  delete (normalised as any).time;

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
  getCalendarHighlightsFromDB,
  getEventByIdFromDB,
  updateEventInDB,
  deleteEventFromDB,
};
