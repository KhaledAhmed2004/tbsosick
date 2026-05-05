# 10. Download Preference Card

```http
POST /preference-cards/:cardId/download
Auth: Bearer {{accessToken}}
```

> use case: User increments the card download count and logs the download history.

## Business Logic (`downloadPreferenceCardInDB`)
- **Idempotency**: If the same user downloads the same card multiple times in a single day, the download count is only incremented once (Spam control).
- **Atomic Increment**: The `$inc` operator is used to maintain atomicity upon successful logging.
