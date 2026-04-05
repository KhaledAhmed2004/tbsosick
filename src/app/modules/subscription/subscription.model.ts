import { Schema, model, Types } from 'mongoose';
import { ISubscription, SubscriptionModel, SUBSCRIPTION_PLAN, SUBSCRIPTION_STATUS } from './subscription.interface';

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    plan: { type: String, enum: Object.values(SUBSCRIPTION_PLAN), default: SUBSCRIPTION_PLAN.FREE },
    status: { type: String, enum: Object.values(SUBSCRIPTION_STATUS), default: SUBSCRIPTION_STATUS.ACTIVE },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    currentPeriodEnd: { type: Date, default: null },
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

export const Subscription = model<ISubscription, SubscriptionModel>('Subscription', subscriptionSchema);