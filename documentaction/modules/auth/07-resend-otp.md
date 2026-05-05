# 07. Resend OTP

```http
POST /auth/resend-otp
Content-Type: application/json
Auth: None
```

> Resends a new 6-digit verification code to the user's email.

## Request Body

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | User's email |

```json
{
  "email": "john@example.com"
}
```

## Implementation

- **Route**: [auth.route.ts](file:///src/app/modules/auth/auth.route.ts)
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `resendVerifyEmail`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `resendVerifyEmailToDB`

### Business Logic
1. **User Lookup**: Checks if user exists and is not `DELETED`.
2. **OTP Generation**: Generates and saves a new 6-digit OTP and expiry.
3. **Email Delivery**: Sends the new OTP via email.

## Responses

### Scenario: Success (200)
<details>
<summary><strong>View Response JSON</strong></summary>

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Verification code has been resent to your email."
}
```
</details>
