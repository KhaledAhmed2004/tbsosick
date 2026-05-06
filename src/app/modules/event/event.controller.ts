import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { EventService } from './event.service';
import { JwtPayload } from 'jsonwebtoken';

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await EventService.createEventInDB(
    (user as any).id,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Event created successfully',
    data: result,
  });
});

const getMyEvents = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await EventService.listEventsForUserFromDB(
    (user as any).id,
    {
      from: req.query.from as string,
      to: req.query.to as string,
      date: req.query.date as string,
    },
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Events fetched successfully',
    data: result,
  });
});

const getCalendarHighlights = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await EventService.getCalendarHighlightsFromDB(
    (user as any).id,
    {
      from: req.query.from as string,
      to: req.query.to as string,
    },
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Calendar highlights fetched successfully',
    data: result,
  });
});

const getEventById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { eventId } = req.params;
  const result = await EventService.getEventByIdFromDB(eventId, {
    id: (user as any).id,
    role: (user as any).role as string,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Event details fetched successfully',
    data: result,
  });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { eventId } = req.params;
  const result = await EventService.updateEventInDB(
    eventId,
    {
      id: (user as any).id,
      role: (user as any).role as string,
    },
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Event updated successfully',
    data: result,
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { eventId } = req.params;
  const result = await EventService.deleteEventFromDB(eventId, {
    id: (user as any).id,
    role: (user as any).role as string,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Event deleted successfully',
    data: result,
  });
});

export const EventController = {
  createEvent,
  getMyEvents,
  getCalendarHighlights,
  getEventById,
  updateEvent,
  deleteEvent,
};
