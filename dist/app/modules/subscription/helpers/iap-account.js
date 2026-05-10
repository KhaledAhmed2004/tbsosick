"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveIapAccountToken = void 0;
const uuid_1 = require("uuid");
// Stable namespace UUID for deriving per-user IAP account tokens. The mobile
// client must use the same constant when generating Apple `appAccountToken`
// and Google `obfuscatedAccountId` so the server can verify the buyer matches
// the authenticated user. Rotating this value invalidates every in-flight
// purchase, so it is treated as constant for the lifetime of the app.
const IAP_NAMESPACE = 'b9f6a4c0-1d2e-4f3a-9c8b-0e7d6c5b4a32';
const deriveIapAccountToken = (userId) => (0, uuid_1.v5)(userId, IAP_NAMESPACE);
exports.deriveIapAccountToken = deriveIapAccountToken;
