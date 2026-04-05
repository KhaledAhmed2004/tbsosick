import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import {
  getAdminDashboardStats,
  getPreferenceCardMonthlyTrend,
  getActiveSubscriptionMonthlyTrend,
} from './admin.service';

export const AdminController = {
  getDashboardStats: catchAsync(async (_req: Request, res: Response) => {
    const result = await getAdminDashboardStats();
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Admin dashboard stats',
      data: result,
    });
  }),

  getPreferenceCardMonthly: catchAsync(async (_req: Request, res: Response) => {
    const result = await getPreferenceCardMonthlyTrend();
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Preference card monthly trend',
      data: result,
    });
  }),

  getActiveSubscriptionMonthly: catchAsync(
    async (_req: Request, res: Response) => {
      const result = await getActiveSubscriptionMonthlyTrend();
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Active subscription monthly trend',
        data: result,
      });
    },
  ),
};
