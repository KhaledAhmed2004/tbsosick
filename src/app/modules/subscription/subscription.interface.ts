import { Model, Types } from 'mongoose';

export enum SUBSCRIPTION_PLAN {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export const PLAN_RANK: Record<SUBSCRIPTION_PLAN, number> = {
  [SUBSCRIPTION_PLAN.FREE]: 0,
  [SUBSCRIPTION_PLAN.PREMIUM]: 1,
  [SUBSCRIPTION_PLAN.ENTERPRISE]: 2,
};

export enum SUBSCRIPTION_STATUS {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INACTIVE = 'inactive',
}

export enum SUBSCRIPTION_PLATFORM {
  APPLE = 'apple',
  GOOGLE = 'google',
  ADMIN = 'admin', // manually assigned by a super admin (e.g. enterprise contracts)
}

export type SubscriptionPlanType = SUBSCRIPTION_PLAN;
export type SubscriptionStatusType = SUBSCRIPTION_STATUS;
export type SubscriptionPlatformType = SUBSCRIPTION_PLATFORM;
export type SubscriptionEnvironmentType = 'sandbox' | 'production';

export type ISubscription = {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  plan: SubscriptionPlanType;
  status: SubscriptionStatusType;

  platform?: SubscriptionPlatformType;
  environment?: SubscriptionEnvironmentType;
  productId?: string | null;
  autoRenewing?: boolean;

  // Apple-specific
  appleOriginalTransactionId?: string;
  appleLatestTransactionId?: string;

  // Google-specific (populated in the next phase)
  packageName?: string;
  currentPurchaseToken?: string;
  googleOrderId?: string;

  // Lifecycle timestamps
  startedAt?: Date | null;
  currentPeriodEnd?: Date | null;
  gracePeriodEndsAt?: Date | null;
  canceledAt?: Date | null;

  metadata?: Record<string, any>;
  
  // Transfer & Verification Tracking
  transferredFromUserId?: Types.ObjectId;
  transferredAt?: Date | null;
  lastVerifiedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
};

export type SubscriptionModel = {
  findByUser(userId: Types.ObjectId): Promise<ISubscription | null>;
  upsertForUser(
    userId: Types.ObjectId,
    payload: Partial<ISubscription>,
    session?: import('mongoose').ClientSession
  ): Promise<ISubscription>;
} & Model<ISubscription>;
