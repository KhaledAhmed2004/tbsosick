import { Model, Types } from 'mongoose';

export enum SUBSCRIPTION_PLAN {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SUBSCRIPTION_STATUS {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INACTIVE = 'inactive',
}

export type SubscriptionPlanType = SUBSCRIPTION_PLAN;
export type SubscriptionStatusType = SUBSCRIPTION_STATUS;

export type ISubscription = {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  plan: SubscriptionPlanType;
  status: SubscriptionStatusType;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date | null;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SubscriptionModel = {
  findByUser(userId: Types.ObjectId): Promise<ISubscription | null>;
  upsertForUser(userId: Types.ObjectId, payload: Partial<ISubscription>): Promise<ISubscription>;
} & Model<ISubscription>;