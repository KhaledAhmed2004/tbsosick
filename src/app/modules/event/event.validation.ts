import { z } from 'zod';
import { EVENT_TYPE } from './event.interface';

// Accept either a combined ISO `startsAt` OR the legacy `{ date, time, durationHours }`
// triple for backwards compatibility with existing clients. The service normalises
// everything into `startsAt` / `endsAt` before writing to the DB.
const legacyDateTimeFields = {
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  durationHours: z.number().positive().optional(),
};

const createEventZodSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, 'Title is required'),
      startsAt: z.string().datetime().optional(),
      endsAt: z.string().datetime().optional(),
      eventType: z.enum(Object.values(EVENT_TYPE) as [string, ...string[]]),
      location: z.string().optional(),
      preferenceCard: z.string().optional(),
      notes: z.string().optional(),
      personnel: z
        .object({
          leadSurgeon: z.string().min(1, 'Lead surgeon is required'),
          surgicalTeam: z.array(z.string()).optional(),
        })
        .optional(),
      ...legacyDateTimeFields,
    })
    .refine(
      data =>
        Boolean(data.startsAt) || (data.date && data.time && data.durationHours),
      {
        message:
          'Provide startsAt (ISO) or the legacy date + time + durationHours triple',
      },
    ),
});

const updateEventZodSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    eventType: z
      .enum(Object.values(EVENT_TYPE) as [string, ...string[]])
      .optional(),
    location: z.string().optional(),
    preferenceCard: z.string().optional(),
    notes: z.string().optional(),
    personnel: z
      .object({
        leadSurgeon: z.string().optional(),
        surgicalTeam: z.array(z.string()).optional(),
      })
      .optional(),
    ...legacyDateTimeFields,
  }),
});

export const EventValidation = {
  createEventZodSchema,
  updateEventZodSchema,
};
