import { Schema, model, Types } from 'mongoose';
import {
  ISubscription,
  SubscriptionModel,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_PLATFORM,
} from './subscription.interface';
import { SubscriptionEvent } from './subscription-event.model';

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
    // NOTE: `status` is intentionally NOT defaulted. A subscription record
    // only transitions to `active` after a verified purchase (Apple/Google
    // verify call or explicit admin grant). Defaulting to `active` would
    // hand out paid access to any row that got inserted without hitting the
    // verification code path.
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      required: true,
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

/**
 * Upserts the current-state `subscriptions` row for a user AND appends an
 * entry to `subscription_events` capturing what changed. The events
 * collection is the durable audit trail — the `subscriptions` row is the
 * single "current state" view.
 */
subscriptionSchema.statics.upsertForUser = async function (
  userId: Types.ObjectId,
  payload: Partial<ISubscription>
) {
  const before = await this.findOne({ userId }).lean();

  const next = await this.findOneAndUpdate(
    { userId },
    { $set: { ...payload, userId } },
    { new: true, upsert: true }
  );

  // Diff and log only the meaningful transitions.
  const beforePlan = before?.plan;
  const afterPlan = next.plan;
  const beforeStatus = before?.status;
  const afterStatus = next.status;

  const events: Array<{
    eventType:
      | 'CREATED'
      | 'PLAN_CHANGED'
      | 'STATUS_CHANGED'
      | 'UPGRADED'
      | 'DOWNGRADED';
  }> = [];

  if (!before) {
    events.push({ eventType: 'CREATED' });
  } else {
    if (beforePlan !== afterPlan) {
      events.push({ eventType: 'PLAN_CHANGED' });
    }
    if (beforeStatus !== afterStatus) {
      events.push({ eventType: 'STATUS_CHANGED' });
    }
  }

  for (const evt of events) {
    try {
      await SubscriptionEvent.create({
        userId,
        subscriptionId: next._id,
        eventType: evt.eventType,
        previousPlan: beforePlan,
        nextPlan: afterPlan,
        previousStatus: beforeStatus,
        nextStatus: afterStatus,
        platform: next.platform,
        productId: next.productId,
        externalTransactionId:
          next.appleLatestTransactionId ||
          next.appleOriginalTransactionId ||
          next.googleOrderId ||
          next.googlePurchaseToken,
        occurredAt: new Date(),
      });
    } catch (err) {
      // Audit writes must never fail the primary subscription update.
      console.error('Failed to write SubscriptionEvent:', err);
    }
  }

  return next;
};

export const Subscription = model<ISubscription, SubscriptionModel>(
  'Subscription',
  subscriptionSchema
);
