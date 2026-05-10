# 05. Platform Webhooks (Server-to-Server)

- **Apple Webhook**: `POST /subscriptions/apple/webhook`
- **Google Webhook**: `POST /subscriptions/google/webhook`

> Store theke renewal, cancellation, ba billing issue-r update gulo automatically process hoy. Auth middleware thake na karon signature (Apple JWS / Google JWT) service level-e verify kora hoy.

## Security & Trust
- **Apple**: Verifies JWS (JSON Web Signature) payload using Apple's root certificates and OCSP for revocation checking.
- **Google**: Verifies Pub/Sub push bearer JWT against the configured audience and service account email.

## Key Logic
1. **Idempotency**: Webhook `messageId` (Google) ba `notificationUUID` (Apple) initially `ProcessedWebhook` collection-e **write** korar cheshtha kora hoy. Jodi ID-ti already exist kore, tobe atomic uniqueness fail hoy ebong processing skip kora hoy. (30 days TTL index enabled).
2. **Audit Logging**: Protiti webhook event processing-er por `SubscriptionEvent` audit log write kora hoy (via `upsertForUser`) with specific types: `UPGRADED`, `DOWNGRADED`, `RENEWED`, etc.
3. **Orphan Queue**: Jodi webhook arriving time-e corresponding subscription record DB-te na thake, tobe payload-ti `PendingWebhook` collection-e store kora hoy. Porobortite user jokhon `/verify` endpoint call korbe, tokhon ei orphan event-gulo auto-apply hobe.
4. **Upgrade Migration (Google)**: Jodi Google theke unknown `purchaseToken` ashe, system `linkedPurchaseToken` check kore existing record find korar ebong token migrate korar cheshtha kore.
5. **Authoritative Fetch & Acknowledgement**: Webhook payload-er opor full trust na kore, server Google/Apple API call kore latest authoritative state fetch kore updates apply kore. Google-er khetre, server proactive-ly purchase **acknowledge** kore (within 72h) jate auto-refund na hoy.

## Response Requirement
- **200 OK**: Webhook processing successfully receive hole (even if no-op or duplicate) system plain `200 OK` status pathay without any internal result data.

---

## ⚠️ Deploy / Migration Note — `ProcessedWebhook` Index Cleanup

The idempotency uniqueness was changed from a single-column index on `webhookId` to a compound index on `(provider, webhookId)`. **Mongoose does not auto-drop the old single-column unique index** — it remains in production MongoDB after deploy alongside the new compound, leaving stale metadata.

### One-time cleanup (run once, post-deploy)

PowerShell (mongosh):

```powershell
mongosh "$env:DATABASE_URL" --eval "db.processedwebhooks.dropIndex('webhookId_1')"
```

Or interactive shell:

```javascript
use <your-db-name>
db.processedwebhooks.dropIndex('webhookId_1')
db.processedwebhooks.getIndexes()  // verify only `_id_`, `processedAt_1`, and `provider_1_webhookId_1` remain
```

### Why this is safe
- The new compound `(provider, webhookId)` already enforces uniqueness for every (provider, id) tuple — duplicate-detection is unaffected during the gap.
- TTL on `processedAt` (30 days) is preserved.
- Skipping this step is not a correctness bug — just an operational lint that confuses future schema diffs.
