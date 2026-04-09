import { Schema, model, Types } from 'mongoose';
import {
  ISubscription,
  SubscriptionModel,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_PLATFORM,
} from './subscription.interface';

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: Object.values(SUBSCRIPTION_PLAN),
      default: SUBSCRIPTION_PLAN.FREE,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.ACTIVE,
    },
    platform: {
      type: String,
      enum: Object.values(SUBSCRIPTION_PLATFORM),
    },
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
    },
    productId: { type: String, index: true },
    autoRenewing: { type: Boolean },

    // Apple-specific — unique per originalTransactionId prevents the same
    // Apple purchase from being linked to multiple users (fraud prevention).
    appleOriginalTransactionId: {
      type: String,
      index: true,
      sparse: true,
      unique: true,
    },
    appleLatestTransactionId: { type: String },

    // Google-specific — populated in the next phase.
    googlePurchaseToken: {
      type: String,
      index: true,
      sparse: true,
      unique: true,
    },
    googleOrderId: { type: String },

    // Lifecycle timestamps
    startedAt: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    gracePeriodEndsAt: { type: Date, default: null },
    canceledAt: { type: Date, default: null },

    metadata: { type: Object },
  },
  { timestamps: true }
);

subscriptionSchema.statics.findByUser = async function (userId: Types.ObjectId) {
  return this.findOne({ userId });
};

subscriptionSchema.statics.upsertForUser = async function (
  userId: Types.ObjectId,
  payload: Partial<ISubscription>
) {
  return this.findOneAndUpdate(
    { userId },
    { $set: { ...payload, userId } },
    { new: true, upsert: true }
  );
};

export const Subscription = model<ISubscription, SubscriptionModel>(
  'Subscription',
  subscriptionSchema
);
