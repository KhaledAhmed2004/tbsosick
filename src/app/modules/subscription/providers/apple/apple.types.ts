// Local type aliases for the Apple IAP provider.
// These wrap @apple/app-store-server-library types into a narrower, safer
// shape that the rest of the subscription module consumes. If the Apple
// library ever changes, only this module adapts.

export type AppleEnvironment = 'sandbox' | 'production';

export type DecodedAppleTransaction = {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  bundleId: string;
  purchaseDate: number; // UNIX ms
  expiresDate?: number;
  revocationDate?: number;
  revocationReason?: number;
  environment: AppleEnvironment;
  appAccountToken?: string; // UUID set by the iOS client at purchase time
  isUpgraded?: boolean;
};

export type AppleWebhookResult = {
  processed: boolean;
  notificationType?: string;
  subtype?: string;
  reason?:
    | 'duplicate'
    | 'no_transaction_info'
    | 'no_matching_subscription'
    | 'unhandled_type'
    | 'applied';
};
