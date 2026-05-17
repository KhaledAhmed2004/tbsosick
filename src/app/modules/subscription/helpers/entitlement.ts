import { Types } from 'mongoose';
import { Subscription as SubscriptionModel } from '../subscription.model';
import {
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
  SubscriptionPlanType,
  SubscriptionStatusType,
} from '../subscription.interface';

export type UserEntitlement = {
  plan: SubscriptionPlanType;
  status: SubscriptionStatusType;
  isActive: boolean;
  isPremium: boolean;
  isEnterprise: boolean;
  currentPeriodEnd?: Date | null;
  gracePeriodEndsAt?: Date | null;
};

// Status values that grant the user their paid entitlement.
// PAST_DUE is included so users in the Apple/Google billing-retry grace
// period keep their access — this matches the industry standard.
const ACTIVE_STATUSES: ReadonlySet<SubscriptionStatusType> = new Set<
  SubscriptionStatusType
>([
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
  SUBSCRIPTION_STATUS.PAST_DUE,
]);

export const getUserEntitlement = async (
  userId: string
): Promise<UserEntitlement> => {
  const sub = await SubscriptionModel.findByUser(new Types.ObjectId(userId));

  if (!sub) {
    return {
      plan: SUBSCRIPTION_PLAN.FREE,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      isActive: true,
      isPremium: false,
      isEnterprise: false,
    };
  }

  // Temporal consistency check: if the period end is in the past but status
  // is still ACTIVE, a lifecycle webhook (EXPIRED / GRACE_PERIOD_EXPIRED) was
  // missed — server downtime, Apple/Google outage, etc. We treat the
  // subscription as effectively expired to prevent indefinite free access.
  //
  // Buffer: We add a buffer to account for clock skew and webhook latency.
  // Production gets 24 hours; Sandbox gets 2 minutes to allow for rapid testing cycles.
  const isSandbox = sub.environment === 'sandbox';
  const expiryBufferMs = isSandbox ? 2 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const isExpiredByTime =
    sub.status === SUBSCRIPTION_STATUS.ACTIVE &&
    sub.currentPeriodEnd != null &&
    sub.currentPeriodEnd.getTime() + expiryBufferMs < Date.now();

  const isActive = !isExpiredByTime && ACTIVE_STATUSES.has(sub.status);
  const hasPaidPlan = sub.plan !== SUBSCRIPTION_PLAN.FREE;

  return {
    // If the subscription is inactive (expired/canceled), treat the user as FREE
    // for all intent and purposes (quota, gating logic, etc.)
    plan: isActive ? sub.plan : SUBSCRIPTION_PLAN.FREE,
    status: sub.status,
    isActive,
    isPremium: isActive && hasPaidPlan,
    isEnterprise: isActive && sub.plan === SUBSCRIPTION_PLAN.ENTERPRISE,
    currentPeriodEnd: sub.currentPeriodEnd,
    gracePeriodEndsAt: sub.gracePeriodEndsAt,
  };
};

export const isUserPremium = async (userId: string): Promise<boolean> => {
  const entitlement = await getUserEntitlement(userId);
  return entitlement.isPremium;
};

export const isUserEnterprise = async (userId: string): Promise<boolean> => {
  const entitlement = await getUserEntitlement(userId);
  return entitlement.isEnterprise;
};
