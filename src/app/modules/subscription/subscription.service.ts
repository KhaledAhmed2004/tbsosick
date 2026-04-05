import { Types } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { Subscription as SubscriptionModel } from './subscription.model';
import { ISubscription, SUBSCRIPTION_PLAN, SUBSCRIPTION_STATUS } from './subscription.interface';

const ensureSubscriptionDoc = async (userId: string): Promise<ISubscription> => {
  const id = new Types.ObjectId(userId);
  const doc = await SubscriptionModel.findByUser(id);
  if (doc) return doc;
  return await SubscriptionModel.upsertForUser(id, {
    plan: SUBSCRIPTION_PLAN.FREE,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });
};

export const getMySubscription = async (userId: string): Promise<ISubscription> => {
  const sub = await ensureSubscriptionDoc(userId);
  return sub;
};

const mapIapProductToPlan = (productId: string): SUBSCRIPTION_PLAN => {
  const normalized = productId.toLowerCase();
  if (normalized.includes('enterprise')) {
    return SUBSCRIPTION_PLAN.ENTERPRISE;
  }
  if (normalized.includes('premium')) {
    return SUBSCRIPTION_PLAN.PREMIUM;
  }
  return SUBSCRIPTION_PLAN.FREE;
};

export const verifyIapSubscription = async (
  userId: string,
  payload: { platform: 'android' | 'ios'; productId: string; receipt: string }
): Promise<ISubscription> => {
  const { platform, productId, receipt } = payload;
  if (platform !== 'android' && platform !== 'ios') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid platform');
  }
  if (!receipt) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Receipt is required');
  }
  if (!productId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Product ID is required');
  }
  const existing = await ensureSubscriptionDoc(userId);
  const plan = mapIapProductToPlan(productId);
  const metadata: Record<string, unknown> = {
    ...(existing.metadata || {}),
    iapPlatform: platform,
    iapProductId: productId,
  };
  const updated = await SubscriptionModel.upsertForUser(new Types.ObjectId(userId), {
    plan,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    metadata,
  });
  return updated;
};

export const setFreePlan = async (userId: string): Promise<ISubscription> => {
  return SubscriptionModel.upsertForUser(new Types.ObjectId(userId), {
    plan: SUBSCRIPTION_PLAN.FREE,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    stripeSubscriptionId: undefined,
  });
};

const SubscriptionService = {
  getMySubscription,
  setFreePlan,
  verifyIapSubscription,
};

export default SubscriptionService;
