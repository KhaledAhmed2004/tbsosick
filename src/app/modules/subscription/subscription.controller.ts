import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiError';
import SubscriptionService from './subscription.service';

export const getMySubscriptionController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.user as JwtPayload;
    const result = await SubscriptionService.getMySubscription(id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Subscription retrieved successfully',
      data: result,
    });
  }
);

export const verifyApplePurchaseController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.user as JwtPayload;
    const { signedTransactionInfo } = req.body as {
      signedTransactionInfo: string;
    };
    const result = await SubscriptionService.verifyApplePurchase(
      id,
      signedTransactionInfo
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Apple subscription verified successfully',
      data: result,
    });
  }
);

// Apple Server Notifications V2 webhook. No auth because signature
// verification inside the service replaces caller trust.
export const appleWebhookController = catchAsync(
  async (req: Request, res: Response) => {
    // The /apple/webhook route uses express.raw() so req.body is a Buffer
    // — parse it manually without mutating the raw bytes.
    let body: { signedPayload?: string };
    if (Buffer.isBuffer(req.body)) {
      try {
        body = JSON.parse(req.body.toString('utf8'));
      } catch {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid webhook body JSON');
      }
    } else {
      body = req.body as { signedPayload?: string };
    }

    const signedPayload = body?.signedPayload;
    if (!signedPayload) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'signedPayload missing from webhook body'
      );
    }

    const result = await SubscriptionService.processAppleWebhook(signedPayload);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Apple webhook processed',
      data: result,
    });
  }
);

export const chooseFreePlanController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.user as JwtPayload;
    const result = await SubscriptionService.setFreePlan(id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Switched to Free plan successfully',
      data: result,
    });
  }
);

const SubscriptionController = {
  getMySubscriptionController,
  verifyApplePurchaseController,
  appleWebhookController,
  chooseFreePlanController,
};

export default SubscriptionController;
