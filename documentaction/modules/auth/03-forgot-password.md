# 03. Forgot Password

```http
POST /auth/forgot-password
Content-Type: application/json
Auth: None
```

> Triggers password reset flow by sending an OTP to the user's email.

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
- **Controller**: [auth.controller.ts](file:///src/app/modules/auth/auth.controller.ts) — `forgetPassword`
- **Service**: [auth.service.ts](file:///src/app/modules/auth/auth.service.ts) — `forgetPasswordToDB`

### Business Logic
1. **User Check**: Checks if user exists.
2. **Silent Success**: If user doesn't exist, returns a success message anyway. This prevents "Account Enumeration" attacks where hackers check which emails are registered.
3. **Cleanup**: Deletes any previously issued reset tokens for this user to ensure only the latest request is valid.
4. **OTP Generation**: Generates a 6-digit random OTP.
5. **Email Delivery**: Sends an email with the OTP using the `resetPassword` template.
6. **Storage**: Saves the OTP and a TTL-based expiry (e.g., 3-5 minutes) to the user's `authentication` field in the database.

## Responses

### Scenario: Silent Success (200)
<details>
<summary><strong>View Response JSON</strong></summary>

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Please check your email. We have sent you a one-time passcode (OTP)."
}
```
</details>
