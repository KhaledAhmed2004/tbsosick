import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { NotificationService } from './notification.service';

const listMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.listForUser(
    req.user.id!,
    req.query as any,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'OK',
    meta: result.meta,
    data: result.data,
  });
});

const markAllRead = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.markAllRead(req.user.id!);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'All notifications marked as read',
    data: result,
  });
});

const markRead = catchAsync(async (req: Request, res: Response) => {
  const read = req.body?.read ?? true;
  const result = await NotificationService.markRead(
    req.params.notificationId,
    req.user.id!,
    read,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: read
      ? 'Notification marked as read'
      : 'Notification marked as unread',
    data: result,
  });
});

export const NotificationController = {
  listMyNotifications,
  markAllRead,
  markRead,
};
