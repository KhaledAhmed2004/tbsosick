import { Types } from 'mongoose';
import { Subscription } from './subscription.model';
import {
  ReconciliationIssue,
  ReconciliationCode,
  ReconciliationStatus,
} from './reconciliation-issue.model';

export type VerifiedPurchaseInfo = {
  platform: 'apple' | 'google';
  environment: 'sandbox' | 'production';
  packageName: string;
  purchaseToken: string;
  productId: string;
  userId?: string; // If known
};

export const reconcileOrphanPurchase = async (
  verifiedPurchase: VerifiedPurchaseInfo
) => {
  const { platform, environment, packageName, purchaseToken, productId } =
    verifiedPurchase;

  // Rule 4: Check if there's a competing active owner
  const existingOwner = await Subscription.findOne({
    platform,
    environment,
    packageName,
    currentPurchaseToken: purchaseToken,
  });

  if (existingOwner) {
    // Already mapped. If the user IDs conflict, it's an ownership conflict.
    if (verifiedPurchase.userId && existingOwner.userId.toString() !== verifiedPurchase.userId) {
      await ReconciliationIssue.create({
        reconciliationCode: ReconciliationCode.RECONCILIATION_OWNERSHIP_CONFLICT,
        evidence: { verifiedPurchase, existingOwnerId: existingOwner._id },
        status: ReconciliationStatus.OPEN,
      });
      return null;
    }
    return existingOwner; // All good, already mapped to the right owner
  }

  if (!verifiedPurchase.userId) {
    await ReconciliationIssue.create({
      reconciliationCode: ReconciliationCode.RECONCILIATION_MANUAL_REVIEW_REQUIRED,
      evidence: { verifiedPurchase, reason: 'Missing userId for deterministic candidate lookup' },
      status: ReconciliationStatus.OPEN,
    });
    return null;
  }

  // Find candidates that match the platform, environment, product, and userId, but are missing a token
  // (or have an old token that needs updating).
  const candidates = await Subscription.find({
    platform,
    environment,
    productId,
    userId: new Types.ObjectId(verifiedPurchase.userId),
    $or: [{ currentPurchaseToken: null }, { currentPurchaseToken: { $exists: false } }],
  });

  // Rule 1: Zero candidates
  if (candidates.length === 0) {
    await ReconciliationIssue.create({
      reconciliationCode: ReconciliationCode.RECONCILIATION_NO_CANDIDATE,
      evidence: { verifiedPurchase },
      status: ReconciliationStatus.OPEN,
    });
    return null;
  }

  // Rule 2: Multiple candidates
  if (candidates.length > 1) {
    await ReconciliationIssue.create({
      reconciliationCode: ReconciliationCode.RECONCILIATION_MULTIPLE_CANDIDATES,
      evidence: {
        verifiedPurchase,
        candidateIds: candidates.map((c) => c._id),
      },
      status: ReconciliationStatus.OPEN,
    });
    return null;
  }

  const candidate = candidates[0];

  // Rule 3: Exactly one deterministic candidate -> Auto-repair safely
  // Ensures no new entitlement is created (just repairing the reference)
  // Ensures no ownership reassignment (candidate was missing a token, we just link it)
  candidate.currentPurchaseToken = purchaseToken;
  if (platform === 'google') {
    candidate.packageName = packageName;
  }

  await candidate.save();

  await ReconciliationIssue.create({
    reconciliationCode: ReconciliationCode.RECONCILIATION_AUTO_REPAIRED,
    evidence: {
      verifiedPurchase,
      repairedSubscriptionId: candidate._id,
      previousState: 'missing_token',
    },
    status: ReconciliationStatus.RESOLVED,
    resolvedAt: new Date(),
  });

  return candidate;
};
