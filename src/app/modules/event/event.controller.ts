import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { EventService } from './event.service';
import { JwtPayload } from 'jsonwebtoken';

export const EventController = {
  createEvent: catchAsync(async (req: Request, res: Response) => {
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
  }),

  getMyEvents: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await EventService.listEventsForUserFromDB(
      (user as any).id,
      {
        from: req.query.from as string,
        to: req.query.to as string,
      },
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Events retrieved successfully',
      data: result,
    });
  }),

  getEventById: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const { id } = req.params;
    const result = await EventService.getEventByIdFromDB(id, {
      id: (user as any).id,
      role: (user as any).role as string,
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Event details retrieved successfully',
      data: result,
    });
  }),

  updateEvent: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const { id } = req.params;
    const result = await EventService.updateEventInDB(
      id,
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
  }),

  deleteEvent: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const { id } = req.params;
    const result = await EventService.deleteEventFromDB(id, {
      id: (user as any).id,
      role: (user as any).role as string,
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Event deleted successfully',
      data: result,
    });
  }),
};
