import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import SubscriptionService from './subscription.service';
import { JwtPayload } from 'jsonwebtoken';

export const getMySubscriptionController = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user as JwtPayload;
  const result = await SubscriptionService.getMySubscription(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Subscription retrieved successfully',
    data: result,
  });
});

export const verifyIapSubscriptionController = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user as JwtPayload;
  const { platform, productId, receipt } = req.body as {
    platform: 'android' | 'ios';
    productId: string;
    receipt: string;
  };
  const result = await SubscriptionService.verifyIapSubscription(id, { platform, productId, receipt });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Subscription updated from in-app purchase',
    data: result,
  });
});

export const chooseFreePlanController = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user as JwtPayload;
  const result = await SubscriptionService.setFreePlan(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Switched to Free plan successfully',
    data: result,
  });
});

const SubscriptionController = {
  getMySubscriptionController,
  verifyIapSubscriptionController,
  chooseFreePlanController,
};

export default SubscriptionController;
