import { z } from 'zod';
import { EVENT_TYPE } from './event.interface';

// Require date, time, durationHours and eventType
const createEventZodSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    durationHours: z.number().positive('Duration must be positive'),
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
  }),
});

const updateEventZodSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional(),
    durationHours: z.number().positive().optional(),
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
  }),
});

export const EventValidation = {
  createEventZodSchema,
  updateEventZodSchema,
};
