# 04. Set Free Plan (Internal/Manual)

```http
POST /subscriptions/choose/free
Auth: Bearer {{accessToken}}
```

> User-ke manually free plan-e downgrade ba switch korte allow kore.

## Business Logic (`setFreePlan`)
- User-er current subscription record-ke `FREE` plan ebong `ACTIVE` status-e reset kore dey.
