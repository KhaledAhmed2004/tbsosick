import { v5 as uuidv5 } from 'uuid';

// Stable namespace UUID for deriving per-user IAP account tokens. The mobile
// client must use the same constant when generating Apple `appAccountToken`
// and Google `obfuscatedAccountId` so the server can verify the buyer matches
// the authenticated user. Rotating this value invalidates every in-flight
// purchase, so it is treated as constant for the lifetime of the app.
const IAP_NAMESPACE = 'b9f6a4c0-1d2e-4f3a-9c8b-0e7d6c5b4a32';

export const deriveIapAccountToken = (userId: string): string =>
  uuidv5(userId, IAP_NAMESPACE);
