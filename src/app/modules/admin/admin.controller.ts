import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AdminService } from './admin.service';

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getAdminDashboardStats();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Admin dashboard metrics',
    data: result,
  });
});

const getPreferenceCardMonthly = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getPreferenceCardMonthlyTrend();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Preference card monthly trend',
    data: result,
  });
});

const getActiveSubscriptionMonthly = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getActiveSubscriptionMonthlyTrend();
  const currentYear = new Date().getFullYear();
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `Monthly analytics for ${currentYear} retrieved successfully.`,
    data: result,
  });
});

export const AdminController = {
  getDashboardStats,
  getPreferenceCardMonthly,
  getActiveSubscriptionMonthly,
};
