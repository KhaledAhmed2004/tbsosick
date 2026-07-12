import mongoose, { Types } from 'mongoose';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import config from '../../../config';
import { jwtHelper } from '../../../helpers/jwtHelper';
import QueryBuilder from '../../builder/QueryBuilder';
import { Subscription as SubscriptionModel } from './subscription.model';
import { IdempotencyRecord } from './idempotency-record.model';
import {
  ISubscription,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_PLATFORM,
  SUBSCRIPTION_STATUS,
} from './subscription.interface';
import { verifyAppleTransaction } from './providers/apple/apple.verify';
import { handleAppleNotification } from './providers/apple/apple.webhook';
import { AppleWebhookResult } from './providers/apple/apple.types';
import { verifyGoogleSubscription } from './providers/google/google.verify';
import { handleGoogleNotification } from './providers/google/google.webhook';
import { GoogleWebhookResult } from './providers/google/google.types';
import {
  mapAppleProductToPlan,
  mapGoogleProductToPlan,
} from './helpers/plan.mapper';
import { getUserEntitlement } from './helpers/entitlement';
import { PendingWebhook } from './pending-webhook.model';
import { SubscriptionEvent } from './subscription-event.model';
import { ISubscriptionEvent } from './subscription-event.interface';
import { ProcessedWebhook } from './processed-webhook.model';
import { deriveIapAccountToken } from './helpers/iap-account';
import { logger } from '../../../shared/logger';
import { User } from '../user/user.model';

// --- Admin Service Methods ---

export const getAllSubscriptions = async (query: Record<string, any>) => {
  const builder = new QueryBuilder(
    SubscriptionModel.find().populate('userId', 'fullName email'),
    query
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    builder.modelQuery,
    builder.getPaginationInfo(),
  ]);

  return { data, meta };
};

export const getSubscriptionAnalytics = async () => {
  // Single $facet aggregation — one round-trip instead of three.
  const [result] = await SubscriptionModel.aggregate([
    {
      $facet: {
        planDistribution: [{ $group: { _id: '$plan', count: { $sum: 1 } } }],
        platformDistribution: [
          { $group: { _id: '$platform', count: { $sum: 1 } } },
        ],
        activeCount: [
          { $match: { status: SUBSCRIPTION_STATUS.ACTIVE } },
          { $count: 'count' },
        ],
      },
    },
  ]);

  return {
    planDistribution: result?.planDistribution ?? [],
    platformDistribution: result?.platformDistribution ?? [],
    activeCount: result?.activeCount?.[0]?.count ?? 0,
  };
};

export const getPendingWebhooks = async () => {
  return PendingWebhook.find().sort({ receivedAt: -1 }).limit(100);
};

export const getSubscriptionById = async (
  id: string
): Promise<ISubscription | null> => {
  return SubscriptionModel.findById(id).populate('userId', 'fullName email');
};

export const getSubscriptionEvents = async (
  userId: string,
  query: Record<string, any> = {}
) => {
  const builder = new QueryBuilder(
    SubscriptionEvent.find({ userId: new Types.ObjectId(userId) }).sort({
      occurredAt: -1,
    }),
    query
  )
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    builder.modelQuery,
    builder.getPaginationInfo(),
  ]);

  return { data: data as ISubscriptionEvent[], meta };
};

const assertUserExists = async (userId: string) => {
  const exists = await User.exists({ _id: new Types.ObjectId(userId) });
  if (!exists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
};

export const adminGrantPlan = async (
  userId: string,
  plan: SUBSCRIPTION_PLAN
): Promise<ISubscription> => {
  await assertUserExists(userId);
  const uId = new Types.ObjectId(userId);
  return SubscriptionModel.upsertForUser(uId, {
    plan,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    platform: SUBSCRIPTION_PLATFORM.ADMIN,
    productId: null,
    currentPeriodEnd: null, // Admin grants are perpetual unless managed manually
  });
};

export const adminResetPlan = async (userId: string): Promise<ISubscription> => {
  await assertUserExists(userId);
  const uId = new Types.ObjectId(userId);
  return SubscriptionModel.upsertForUser(uId, {
    plan: SUBSCRIPTION_PLAN.FREE,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    platform: SUBSCRIPTION_PLATFORM.ADMIN,
    productId: null,
    currentPeriodEnd: null,
    canceledAt: new Date(),
  });
};

// --- End Admin Service Methods ---


// GET handlers must not mutate state except for self-healing lazy cleanup.
// If no subscription row exists for a user, return a synthetic FREE/ACTIVE
// entitlement instead of writing one.
export const getMySubscription = async (
  userId: string
): Promise<Partial<ISubscription>> => {
  const id = new Types.ObjectId(userId);
  const entitlement = await getUserEntitlement(userId);

  // Lazy Cleanup: if the user has a row in the DB that is technically
  // expired but still marked as 'active', we update it now to 'inactive'
  // and 'FREE'. This fixes state drift if webhooks were missed.
  // We check entitlement.isActive which already includes our 24h safety buffer.
  const doc = await SubscriptionModel.findOne({ userId: id });

  if (
    doc &&
    doc.status === SUBSCRIPTION_STATUS.ACTIVE &&
    !entitlement.isActive
  ) {
    logger.info(
      `Lazy cleaning expired subscription for user ${userId} (expired at ${doc.currentPeriodEnd})`
    );
    await SubscriptionModel.upsertForUser(id, {
      status: SUBSCRIPTION_STATUS.INACTIVE,
      plan: SUBSCRIPTION_PLAN.FREE,
      gracePeriodEndsAt: null,
    });
  }

  // Return the entitlement-corrected view.
  return {
    userId: id,
    plan: entitlement.plan,
    status: entitlement.status,
    platform: doc?.platform,
    productId: doc?.productId,
    currentPeriodEnd: entitlement.currentPeriodEnd,
    gracePeriodEndsAt: entitlement.gracePeriodEndsAt,
    createdAt: doc?.createdAt,
    updatedAt: doc?.updatedAt,
  };
};

export const setFreePlan = async (userId: string): Promise<ISubscription> => {
  const uId = new Types.ObjectId(userId);
  const existing = await SubscriptionModel.findByUser(uId);

  // C2 Fix: Guard against active store subscriptions.
  // If a user has an active Apple/Google subscription, we cannot unilaterally
  // downgrade them to FREE, as the store remains the source of truth.
  if (
    existing &&
    existing.platform !== SUBSCRIPTION_PLATFORM.ADMIN &&
    (existing.status === SUBSCRIPTION_STATUS.ACTIVE ||
      existing.status === SUBSCRIPTION_STATUS.TRIALING ||
      existing.status === SUBSCRIPTION_STATUS.PAST_DUE) &&
    existing.currentPeriodEnd &&
    existing.currentPeriodEnd > new Date()
  ) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'You have an active store subscription. Please cancel it through the App Store or Play Store first.'
    );
  }

  return SubscriptionModel.upsertForUser(uId, {
    plan: SUBSCRIPTION_PLAN.FREE,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    platform: SUBSCRIPTION_PLATFORM.ADMIN, // Mark as admin-reset
  });
};

export const verifyApplePurchase = async (
  userId: string,
  signedTransactionInfo: string
): Promise<ISubscription> => {
  // 1. Cryptographically verify the JWS with Apple's library.
  const decoded = await verifyAppleTransaction(signedTransactionInfo);

  // C3 Fix: Reject if this transaction has been superseded by an upgrade.
  if (decoded.isUpgraded) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This transaction has been superseded by an upgrade. Please verify the latest transaction.'
    );
  }

  // Receipt-theft defense: warning instead of strict block.
  if (decoded.appAccountToken) {
    const expected = deriveIapAccountToken(userId);
    if (decoded.appAccountToken.toLowerCase() !== expected.toLowerCase()) {
      logger.warn(
        `Apple verify: appAccountToken mismatch for user ${userId}. Expected ${expected}, got ${decoded.appAccountToken}`
      );
    }
  } else {
    logger.warn(
      `Apple verify: missing appAccountToken for user ${userId} (txn ${decoded.originalTransactionId})`
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

  const session = await mongoose.startSession();
  let updated: ISubscription;

  try {
    await session.withTransaction(async () => {
      // 2. Fraud guard: check if this transaction is already bound to a different user account.
      const existingByTx = await SubscriptionModel.findOne({
        platform: SUBSCRIPTION_PLATFORM.APPLE,
        appleOriginalTransactionId: decoded.originalTransactionId,
      }).session(session);

      let transferredFromUserId: Types.ObjectId | undefined;

      if (existingByTx && existingByTx.userId.toString() !== userId) {
        const previousUserId = existingByTx.userId;

        // Atomic release with exact conditions to avoid concurrent races
        const released = await SubscriptionModel.findOneAndUpdate(
          {
            _id: existingByTx._id,
            userId: previousUserId,
            appleOriginalTransactionId: decoded.originalTransactionId,
          },
          {
            $set: {
              plan: SUBSCRIPTION_PLAN.FREE,
              status: SUBSCRIPTION_STATUS.INACTIVE,
            },
            $unset: {
              currentPurchaseToken: '',
              googleOrderId: '',
              appleOriginalTransactionId: '',
              appleLatestTransactionId: '',
            },
          },
          { new: true, session }
        );

        if (!released) {
          throw new ApiError(
            httpStatus.CONFLICT,
            'Ownership conflict during transfer. The entitlement was already transferred or released.'
          );
        }

        transferredFromUserId = previousUserId;

        // Log transfer audit event inside the same transaction
        try {
          await SubscriptionEvent.create(
            [{
              userId: new Types.ObjectId(userId),
              subscriptionId: existingByTx._id,
              eventType: 'TRANSFERRED',
              previousPlan: existingByTx.plan,
              nextPlan: SUBSCRIPTION_PLAN.FREE,
              previousStatus: existingByTx.status,
              nextStatus: SUBSCRIPTION_STATUS.INACTIVE,
              platform: SUBSCRIPTION_PLATFORM.APPLE,
              productId: decoded.productId,
              externalTransactionId: decoded.originalTransactionId,
              fromUserId: previousUserId,
              toUserId: new Types.ObjectId(userId),
              occurredAt: new Date(),
            }],
            { session }
          );
        } catch (err) {
          console.error('Failed to write transfer SubscriptionEvent:', err);
        }
      }

      // Prevent accidental overwrite of higher-tier entitlements
      const currentUserDoc = await SubscriptionModel.findOne({
        userId: new Types.ObjectId(userId),
      }).session(session);
      
      if (
        currentUserDoc &&
        (currentUserDoc.platform === SUBSCRIPTION_PLATFORM.ADMIN ||
          currentUserDoc.plan === SUBSCRIPTION_PLAN.ENTERPRISE)
      ) {
        if (currentUserDoc.appleOriginalTransactionId === decoded.originalTransactionId) {
          updated = currentUserDoc;
          return;
        }
        throw new ApiError(
          httpStatus.CONFLICT,
          'User already holds a higher priority enterprise or admin entitlement.'
        );
      }

      // 4. Upsert the subscription for this user.
      const payload: Partial<ISubscription> = {
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
        lastVerifiedAt: new Date(),
      };

      if (transferredFromUserId) {
        payload.transferredFromUserId = transferredFromUserId;
        payload.transferredAt = new Date();
      }

      updated = await SubscriptionModel.upsertForUser(
        new Types.ObjectId(userId),
        payload,
        session
      );
    });
  } finally {
    await session.endSession();
  }

  // 5. Re-process any orphan webhooks that arrived before this verify call.
  // We don't await this so the user gets their response immediately.
  reprocessPendingWebhooks(decoded.originalTransactionId, 'apple').catch(
    err => {
      console.error('Failed to re-process pending Apple webhooks:', err);
    }
  );

  return updated!;
};

export const processAppleWebhook = async (
  signedPayload: string
): Promise<AppleWebhookResult> => {
  return handleAppleNotification(signedPayload);
};

export const verifyGooglePurchase = async (
  userId: string,
  purchaseToken: string,
  productId: string
): Promise<ISubscription> => {
  // 1. Pull the authoritative subscription state from Google.
  const decoded = await verifyGoogleSubscription(purchaseToken, productId);

  // Receipt-theft defense: warning instead of strict block.
  if (decoded.obfuscatedExternalAccountId) {
    const expected = deriveIapAccountToken(userId);
    if (decoded.obfuscatedExternalAccountId !== expected) {
      logger.warn(
        `Google verify: obfuscatedAccountId mismatch for user ${userId}. Expected ${expected}, got ${decoded.obfuscatedExternalAccountId}`
      );
    }
  } else {
    logger.warn(
      `Google verify: missing obfuscatedAccountId for user ${userId} (token ${purchaseToken.slice(0, 12)}...)`
    );
  }

  const plan = mapGoogleProductToPlan(decoded.productId);
  if (plan === SUBSCRIPTION_PLAN.FREE) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Unknown or unsupported productId: ${decoded.productId}`
    );
  }

  const isActiveState =
    decoded.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' ||
    decoded.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';
  if (!isActiveState) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Google subscription is not active (state: ${decoded.subscriptionState})`
    );
  }
  const localStatus =
    decoded.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
      ? SUBSCRIPTION_STATUS.PAST_DUE
      : SUBSCRIPTION_STATUS.ACTIVE;

  const session = await mongoose.startSession();
  let updated: ISubscription;

  try {
    await session.withTransaction(async () => {
      // 2. Find existing ownership strictly by purchaseToken
      const existingByToken = await SubscriptionModel.findOne({
        platform: SUBSCRIPTION_PLATFORM.GOOGLE,
        currentPurchaseToken: decoded.purchaseToken,
      }).session(session);

      let transferredFromUserId: Types.ObjectId | undefined;

      if (existingByToken && existingByToken.userId.toString() !== userId) {
        const previousUserId = existingByToken.userId;

        // Atomic release with exact conditions to avoid concurrent races
        const released = await SubscriptionModel.findOneAndUpdate(
          {
            _id: existingByToken._id,
            userId: previousUserId,
            currentPurchaseToken: decoded.purchaseToken,
          },
          {
            $set: {
              plan: SUBSCRIPTION_PLAN.FREE,
              status: SUBSCRIPTION_STATUS.INACTIVE,
            },
            $unset: {
              currentPurchaseToken: '',
              googleOrderId: '',
              appleOriginalTransactionId: '',
              appleLatestTransactionId: '',
            },
          },
          { new: true, session }
        );

        if (!released) {
          throw new ApiError(
            httpStatus.CONFLICT,
            'Ownership conflict during transfer. The entitlement was already transferred or released.'
          );
        }

        transferredFromUserId = previousUserId;

        // Log transfer audit event inside the same transaction
        try {
          await SubscriptionEvent.create(
            [{
              userId: new Types.ObjectId(userId), // new owner
              subscriptionId: existingByToken._id, // This records the transfer action on the old doc
              eventType: 'TRANSFERRED',
              previousPlan: existingByToken.plan,
              nextPlan: SUBSCRIPTION_PLAN.FREE,
              previousStatus: existingByToken.status,
              nextStatus: SUBSCRIPTION_STATUS.INACTIVE,
              platform: SUBSCRIPTION_PLATFORM.GOOGLE,
              productId: decoded.productId,
              externalTransactionId: decoded.purchaseToken,
              fromUserId: previousUserId,
              toUserId: new Types.ObjectId(userId),
              occurredAt: new Date(),
            }],
            { session }
          );
        } catch (err) {
          console.error('Failed to write transfer SubscriptionEvent:', err);
        }
      }

      // 3. Prevent accidental overwrite of higher-tier entitlements
      const currentUserDoc = await SubscriptionModel.findOne({
        userId: new Types.ObjectId(userId),
      }).session(session);
      
      if (
        currentUserDoc &&
        (currentUserDoc.platform === SUBSCRIPTION_PLATFORM.ADMIN ||
          currentUserDoc.plan === SUBSCRIPTION_PLAN.ENTERPRISE)
      ) {
        // Idempotent success if they are restoring the exact same token they already have
        if (currentUserDoc.currentPurchaseToken === decoded.purchaseToken) {
          updated = currentUserDoc;
          return;
        }
        throw new ApiError(
          httpStatus.CONFLICT,
          'User already holds a higher priority enterprise or admin entitlement.'
        );
      }

      // 4. Upsert for current user
      const payload: Partial<ISubscription> = {
        plan,
        status: localStatus,
        platform: SUBSCRIPTION_PLATFORM.GOOGLE,
        environment: decoded.environment,
        productId: decoded.productId,
        autoRenewing: decoded.autoRenewing,
        packageName: config.googlePlay.packageName,
        currentPurchaseToken: decoded.purchaseToken,
        googleOrderId: decoded.orderId,
        startedAt: decoded.startTime ? new Date(decoded.startTime) : null,
        currentPeriodEnd: decoded.expiryTime
          ? new Date(decoded.expiryTime)
          : null,
        canceledAt: null,
        gracePeriodEndsAt:
          localStatus === SUBSCRIPTION_STATUS.PAST_DUE && decoded.expiryTime
            ? new Date(decoded.expiryTime)
            : null,
        metadata: {
          acknowledgementState: decoded.acknowledgementState,
          linkedPurchaseToken: decoded.linkedPurchaseToken,
          testPurchase: decoded.testPurchase,
        },
        lastVerifiedAt: new Date(),
      };

      if (transferredFromUserId) {
        payload.transferredFromUserId = transferredFromUserId;
        payload.transferredAt = new Date();
      }

      updated = await SubscriptionModel.upsertForUser(
        new Types.ObjectId(userId),
        payload,
        session
      );
    });
  } finally {
    await session.endSession();
  }

  // 5. Re-process any orphan webhooks outside the transaction
  reprocessPendingWebhooks(decoded.purchaseToken, 'google').catch((err) => {
    console.error('Failed to re-process pending Google webhooks:', err);
  });

  return updated!;
};

export const processGoogleWebhook = async (
  rawBody: Buffer | string,
  authorizationHeader: string | undefined
): Promise<GoogleWebhookResult> => {
  return handleGoogleNotification(rawBody, authorizationHeader);
};

const reprocessPendingWebhooks = async (
  externalPurchaseId: string,
  provider: 'apple' | 'google'
) => {
  const pending = await PendingWebhook.find({
    externalPurchaseId,
    provider,
  }).sort({ receivedAt: 1 });

  if (pending.length === 0) return;

  for (const item of pending) {
    try {
      if (provider === 'apple') {
        await handleAppleNotification(item.payload as string);
      } else {
        await handleGoogleNotification(item.payload as Buffer, undefined, true);
      }
      // Delete after successful processing
      await PendingWebhook.findByIdAndDelete(item._id);
    } catch (err) {
      console.error(
        `Failed to re-process pending ${provider} webhook ${item._id}:`,
        err
      );
    }
  }
};



const SubscriptionService = {
  getMySubscription,
  setFreePlan,
  verifyApplePurchase,
  processAppleWebhook,
  verifyGooglePurchase,
  processGoogleWebhook,
  getAllSubscriptions,
  getSubscriptionAnalytics,
  getPendingWebhooks,
  getSubscriptionById,
  getSubscriptionEvents,
  adminGrantPlan,
  adminResetPlan,
};

export default SubscriptionService;
