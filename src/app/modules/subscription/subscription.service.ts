import { Types } from 'mongoose';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { Subscription as SubscriptionModel } from './subscription.model';
import {
  ISubscription,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_PLATFORM,
  SUBSCRIPTION_STATUS,
} from './subscription.interface';
import { verifyAppleTransaction } from './providers/apple/apple.verify';
import { handleAppleNotification } from './providers/apple/apple.webhook';
import { AppleWebhookResult } from './providers/apple/apple.types';
import { mapAppleProductToPlan } from './helpers/plan.mapper';

const ensureSubscriptionDoc = async (
  userId: string
): Promise<ISubscription> => {
  const id = new Types.ObjectId(userId);
  const doc = await SubscriptionModel.findByUser(id);
  if (doc) return doc;
  return await SubscriptionModel.upsertForUser(id, {
    plan: SUBSCRIPTION_PLAN.FREE,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });
};

export const getMySubscription = async (
  userId: string
): Promise<ISubscription> => {
  return ensureSubscriptionDoc(userId);
};

export const setFreePlan = async (userId: string): Promise<ISubscription> => {
  return SubscriptionModel.upsertForUser(new Types.ObjectId(userId), {
    plan: SUBSCRIPTION_PLAN.FREE,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });
};

export const verifyApplePurchase = async (
  userId: string,
  signedTransactionInfo: string
): Promise<ISubscription> => {
  // 1. Cryptographically verify the JWS with Apple's library.
  const decoded = await verifyAppleTransaction(signedTransactionInfo);

  // 2. Fraud guard: reject if this transaction is already bound to a
  //    different user account.
  const existingByTx = await SubscriptionModel.findOne({
    appleOriginalTransactionId: decoded.originalTransactionId,
  });
  if (existingByTx && existingByTx.userId.toString() !== userId) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'This Apple transaction is already linked to another account'
    );
  }

  // 3. Map the store-side productId to a local plan.
  const plan = mapAppleProductToPlan(decoded.productId);
  if (plan === SUBSCRIPTION_PLAN.FREE) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Unknown or unsupported productId: ${decoded.productId}`
    );
  }

  // 4. Persist the subscription for this user.
  const updated = await SubscriptionModel.upsertForUser(
    new Types.ObjectId(userId),
    {
      plan,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      platform: SUBSCRIPTION_PLATFORM.APPLE,
      environment: decoded.environment,
      productId: decoded.productId,
      appleOriginalTransactionId: decoded.originalTransactionId,
      appleLatestTransactionId: decoded.transactionId,
      startedAt: new Date(decoded.purchaseDate),
      currentPeriodEnd: decoded.expiresDate
        ? new Date(decoded.expiresDate)
        : null,
      canceledAt: null,
      gracePeriodEndsAt: null,
      metadata: {
        appAccountToken: decoded.appAccountToken,
        bundleId: decoded.bundleId,
      },
    }
  );

  return updated;
};

export const processAppleWebhook = async (
  signedPayload: string
): Promise<AppleWebhookResult> => {
  return handleAppleNotification(signedPayload);
};

const SubscriptionService = {
  getMySubscription,
  setFreePlan,
  verifyApplePurchase,
  processAppleWebhook,
};

export default SubscriptionService;
