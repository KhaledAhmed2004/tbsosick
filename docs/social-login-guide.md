# Social Login Integration Guide (Google + Apple)

> **Endpoint:** `POST /api/v1/auth/social-login`
> **Pattern:** Mobile SDK login -> ID Token -> Server verification -> JWT issue

---

## Credentials Setup

### Google Client ID

1. [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**
2. **Create Credentials** -> **OAuth 2.0 Client ID**
3. Application type:
   - iOS -> select **iOS**, Bundle ID dao
   - Android -> select **Android**, package name + SHA-1 fingerprint dao
4. Mobile SDK jeii client ID diye token ney, server-eo seii same client ID `GOOGLE_CLIENT_ID` env-e dite hobe. Mismatch hole verify fail korbe.

```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
```

### Apple Client ID (Sign in with Apple)

1. [Apple Developer Portal](https://developer.apple.com/account) -> **Certificates, Identifiers & Services**
2. **Identifiers** -> App ID select koro
3. **Sign In with Apple** capability enable koro
4. **Apple Client ID = Bundle ID** (e.g. `com.yourcompany.yourapp`)

```env
APPLE_CLIENT_ID=com.yourcompany.yourapp
```

> Apple-er jonno shudhu Bundle ID lagbe. `TEAM_ID`, `KEY_ID` shudhu server-to-server API call-er jonno dorkar (subscription verification) -- sign-in token verify-te lage na.

### Final `.env`

```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
APPLE_CLIENT_ID=com.yourcompany.yourapp
```

---

## Flow Diagram

```
+---------------+         +----------------+         +---------------+
|  Mobile App   |         | Google/Apple   |         |  Server       |
+-------+-------+         +-------+--------+         +-------+-------+
        |                         |                           |
        |  1. Generate nonce      |                           |
        |  (random string)        |                           |
        |                         |                           |
        |  2. Login via SDK       |                           |
        |  (pass nonce hash)      |                           |
        | ----------------------> |                           |
        |                         |                           |
        |  3. Receive idToken     |                           |
        | <---------------------- |                           |
        |                         |                           |
        |  4. POST /social-login (idToken + raw nonce)        |
        | -----------------------------------------------------> 
        |                         |                           |
        |                         |  5. Verify idToken        |
        |                         |     + nonce match         |
        |                         |                           |
        |  6. accessToken + refreshToken (cookie)             |
        | <----------------------------------------------------- 
        |                         |                           |
```

### Nonce Flow (Replay Attack Prevention)

- **Apple**: iOS SDK receives `SHA256(nonce)`, puts **hash** in token's `nonce` claim. Server hashes raw nonce, compares.
- **Google**: SDK puts **raw nonce** in token. Server compares directly.

---

## API Reference

### Request

```http
POST /api/v1/auth/social-login
Content-Type: application/json
```

```json
{
  "provider": "google",
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "nonce": "aB3xK9mP2qR7...",
  "deviceToken": "fcm-token-here",
  "platform": "ios",
  "appVersion": "1.2.0"
}
```

| Field         | Required    | Type   | Notes                                 |
| ------------- | ----------- | ------ | ------------------------------------- |
| `provider`    | Yes         | string | `"google"` or `"apple"`               |
| `idToken`     | Yes         | string | Provider SDK theke paowa token        |
| `nonce`       | Recommended | string | Replay attack prevention              |
| `deviceToken` | No          | string | FCM push token                        |
| `platform`    | No          | string | `"ios"` / `"android"` / `"web"`       |
| `appVersion`  | No          | string | App version tracking                  |

### Success Response (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

> `refreshToken` httpOnly cookie-teo set hoy.

### Error Responses

| Status | When                                        |
| ------ | ------------------------------------------- |
| `400`  | Invalid body / email required (new Apple user) |
| `401`  | Invalid token / nonce mismatch              |
| `403`  | Account deleted / restricted                |

---

## iOS (Swift) Implementation

### Nonce Helper

```swift
import CryptoKit

func randomNonceString(length: Int = 32) -> String {
    let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
    var result = ""
    var remainingLength = length
    while remainingLength > 0 {
        let randoms: [UInt8] = (0..<16).map { _ in
            var random: UInt8 = 0
            _ = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
            return random
        }
        for random in randoms {
            if remainingLength == 0 { break }
            if random < charset.count {
                result.append(charset[Int(random)])
                remainingLength -= 1
            }
        }
    }
    return result
}

func sha256(_ input: String) -> String {
    let data = Data(input.utf8)
    let hash = SHA256.hash(data: data)
    return hash.map { String(format: "%02x", $0) }.joined()
}
```

### Apple Sign In

```swift
import AuthenticationServices

let rawNonce = randomNonceString()

let request = ASAuthorizationAppleIDProvider().createRequest()
request.requestedScopes = [.fullName, .email]
request.nonce = sha256(rawNonce)  // Apple gets the HASH

// After ASAuthorizationController callback:
func authorizationController(controller: ASAuthorizationController,
                             didCompleteWithAuthorization authorization: ASAuthorization) {
    guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
          let idTokenData = credential.identityToken,
          let idToken = String(data: idTokenData, encoding: .utf8) else { return }

    // Send to server
    let body: [String: Any] = [
        "provider": "apple",
        "idToken": idToken,
        "nonce": rawNonce,           // Server gets the RAW nonce
        "deviceToken": fcmToken,     // optional
        "platform": "ios"            // optional
    ]
    POST("/api/v1/auth/social-login", body: body)
}
```

### Google Sign In

```swift
import GoogleSignIn

let rawNonce = randomNonceString()

let config = GIDConfiguration(clientID: "YOUR_GOOGLE_CLIENT_ID")
GIDSignIn.sharedInstance.configuration = config
GIDSignIn.sharedInstance.signIn(withPresenting: viewController, hint: nil,
                                additionalScopes: nil, nonce: rawNonce) { result, error in
    guard let idToken = result?.user.idToken?.tokenString else { return }

    let body: [String: Any] = [
        "provider": "google",
        "idToken": idToken,
        "nonce": rawNonce,
        "deviceToken": fcmToken,
        "platform": "ios"
    ]
    POST("/api/v1/auth/social-login", body: body)
}
```

---

## Android (Kotlin) Implementation

### Nonce Helper

```kotlin
import java.security.MessageDigest
import java.security.SecureRandom

fun generateNonce(length: Int = 32): String {
    val chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    return (1..length).map { chars[SecureRandom().nextInt(chars.length)] }.joinToString("")
}

fun sha256(input: String): String {
    val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
    return bytes.joinToString("") { "%02x".format(it) }
}
```

### Google Sign In (Credential Manager)

```kotlin
val rawNonce = generateNonce()

val googleOption = GetSignInWithGoogleOption.Builder("YOUR_GOOGLE_CLIENT_ID")
    .setNonce(rawNonce)
    .build()

val request = GetCredentialRequest.Builder()
    .addCredentialOption(googleOption)
    .build()

credentialManager.getCredential(context, request).let { result ->
    val credential = result.credential as CustomCredential
    val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
    val idToken = googleIdTokenCredential.idToken

    // Send to server
    api.socialLogin(mapOf(
        "provider" to "google",
        "idToken" to idToken,
        "nonce" to rawNonce,
        "deviceToken" to fcmToken,
        "platform" to "android"
    ))
}
```

### Apple Sign In (Android)

Apple Sign In on Android typically uses a web-based OAuth flow. If using a library, extract the idToken and send same way:

```kotlin
api.socialLogin(mapOf(
    "provider" to "apple",
    "idToken" to appleIdToken,
    "nonce" to rawNonce,
    "deviceToken" to fcmToken,
    "platform" to "android"
))
```

---

## Important Notes

### Apple Email Behavior

- Apple **shudhu prothombar** email + name dey
- Porer bar ID token-e email thakteo pare, na-o thakte pare
- `sub` (Apple user ID) shobshomoy ashe -- server ei diye user khuje ney
- User email hide korle Apple ekta private relay email dey (`xyz@privaterelay.appleid.com`)

### Server-side Verification (What the backend does)

1. **Google**: `google-auth-library` -> `OAuth2Client.verifyIdToken()` with `audience` check
2. **Apple**: `apple-signin-auth` -> `verifyIdToken()` with `audience` + JWK auto-fetch
3. Nonce verification (SHA256 for Apple, direct for Google)
4. Find/create user by provider ID or email
5. Issue access + refresh tokens with `tokenVersion` rotation

### Key Files (Backend)

| File                                            | Purpose                              |
| ----------------------------------------------- | ------------------------------------ |
| `src/app/modules/auth/auth.service.ts`          | `socialLoginToDB` -- core logic      |
| `src/app/modules/auth/auth.controller.ts`       | `socialLogin` -- HTTP handler        |
| `src/app/modules/auth/auth.route.ts`            | `POST /social-login` route           |
| `src/app/modules/auth/auth.validation.ts`       | Zod schema validation                |
| `src/app/modules/user/user.model.ts`            | `googleId`, `appleId` fields         |
| `src/config/index.ts`                           | `google_client_id`, `apple_client_id`|
