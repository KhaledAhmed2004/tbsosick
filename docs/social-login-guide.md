# Social Login Integration Guide (Google + Apple)

> **Endpoint:** `POST /api/v1/auth/social-login`
> **Pattern:** Mobile SDK login -> ID Token -> Server verification -> JWT issue

---

## Part 1: Backend Developer — Ki Ki Korte Hobe

### Step 1: Google Cloud Console Setup

Google-te iOS, Android, Web — prottekar **alada client ID** thake. Eita important — mismatch hole verify fail korbe.

1. [Google Cloud Console](https://console.cloud.google.com/) jao
2. Project select koro (ba notun create koro)
3. **APIs & Services** -> **Credentials**
4. **Create Credentials** -> **OAuth 2.0 Client ID** — **3 bar** create korte hobe:

| # | Application Type | Required Info | Env Var |
|---|-----------------|---------------|---------|
| 1 | **iOS** | Bundle ID (e.g. `com.yourcompany.app`) | `GOOGLE_CLIENT_ID_IOS` |
| 2 | **Android** | Package name + SHA-1 fingerprint | `GOOGLE_CLIENT_ID_ANDROID` |
| 3 | **Web application** | (optional, if web client exists) | `GOOGLE_CLIENT_ID_WEB` |

> **Important:** iOS ar Android-er client ID-te kono **client secret nai** — Google mobile clients-ke "public client" mone kore, tai secret generate kore na. Shudhu client ID lagbe.

> **How it works:** Server-e `verifyIdToken()` call korar shomoy audience-e tin-tai array hishebe pass hoy. Token-er `aud` claim jodi ANY ektar shathe match kore, verify pass hoy.

### Step 2: Apple Developer Portal Setup

Apple-er jonne **shudhu Bundle ID lagbe** as client ID. Alada Services ID lagbe na (sheta web-only flow-er jonne).

1. [Apple Developer Portal](https://developer.apple.com/account) jao
2. **Certificates, Identifiers & Services** -> **Identifiers**
3. App ID select koro
4. **Sign In with Apple** capability **enable** koro (checkbox tick)
5. Save koro

> **Bundle ID vs Services ID:**
> - **Bundle ID** = native iOS app-er identifier (e.g. `com.yourcompany.app`) — **mobile app eita use kore**
> - **Services ID** = web-based Sign In with Apple-er jonne — **tomar dorkar nai** (karon mobile-only app)
>
> Token-er `aud` claim = Bundle ID. Backend-e same Bundle ID dite hobe `APPLE_CLIENT_ID` env-e.

### Step 3: `.env` File Setup

```env
# ---- Social Login ----

# Google (prottek platform-er alada client ID — Google Cloud Console theke)
GOOGLE_CLIENT_ID_IOS=xxxxxxxxxxxx-ios.apps.googleusercontent.com
GOOGLE_CLIENT_ID_ANDROID=xxxxxxxxxxxx-android.apps.googleusercontent.com
GOOGLE_CLIENT_ID_WEB=xxxxxxxxxxxx-web.apps.googleusercontent.com

# Apple (Bundle ID — Apple Developer Portal theke)
APPLE_CLIENT_ID=com.yourcompany.yourapp
```

> Jodi kono platform nai (e.g. web nai), sei env var empty rakhle cholbe — server automatically filter kore fele.

### Step 4: Verify Setup

Server start koro (`npm run dev`) ar check koro kono error nai. Then app developer-ke bolte hobe test korte.

---

## Part 2: App Developer-ke Ki Provide Korte Hobe

Tumi backend developer hishebe app developer-ke ei jinishgulo dibe:

### 1. API Endpoint Details

```
POST /api/v1/auth/social-login
Content-Type: application/json
```

### 2. Request Body Schema

```json
{
  "provider": "google | apple",
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "nonce": "aB3xK9mP2qR7...",
  "deviceToken": "fcm-token-here",
  "platform": "ios | android",
  "appVersion": "1.2.0"
}
```

| Field         | Required    | Type   | Notes                                      |
| ------------- | ----------- | ------ | ------------------------------------------ |
| `provider`    | Yes         | string | `"google"` or `"apple"`                    |
| `idToken`     | Yes         | string | Provider SDK theke paowa ID token          |
| `nonce`       | Recommended | string | Replay attack prevention — random string   |
| `deviceToken` | No          | string | FCM push notification token                |
| `platform`    | No          | string | `"ios"` / `"android"` / `"web"`            |
| `appVersion`  | No          | string | App version tracking                       |

### 3. Response Format

**Success (200):**
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

**Error Responses:**

| Status | When                                                 |
| ------ | ---------------------------------------------------- |
| `400`  | Invalid body / email required for new Apple user     |
| `401`  | Invalid/expired token / nonce mismatch               |
| `403`  | Account deleted or restricted                        |

### 4. Google Client IDs (App Developer-ke dite hobe)

| Platform | Client ID | Where to Use |
|----------|-----------|--------------|
| iOS | `GOOGLE_CLIENT_ID_IOS` value | GoogleSignIn SDK configuration |
| Android | `GOOGLE_CLIENT_ID_ANDROID` value | Credential Manager / Google Sign In |

### 5. Apple Bundle ID

App developer already janbe — eta app-eroi Bundle ID.

---

## Part 3: App Developer er Step-by-Step Guide

### Nonce System (Replay Attack Prevention)

Prottek login request-e ekta unique random string generate korte hobe:

```
1. rawNonce = random string generate koro (32+ chars)
2. Apple: SHA256(rawNonce) -> Apple SDK-te pathao | Google: rawNonce directly SDK-te pathao
3. SDK theke idToken pao
4. Server-e pathao: idToken + rawNonce (original, hashed na)
5. Server verify kore match hocche kina
```

### Flow Diagram

```
+---------------+         +----------------+         +---------------+
|  Mobile App   |         | Google/Apple   |         |  Server       |
+-------+-------+         +-------+--------+         +-------+-------+
        |                         |                           |
        |  1. Generate rawNonce   |                           |
        |                         |                           |
        |  2. Login via SDK       |                           |
        |  Apple: sha256(nonce)   |                           |
        |  Google: raw nonce      |                           |
        | ----------------------> |                           |
        |                         |                           |
        |  3. Receive idToken     |                           |
        | <---------------------- |                           |
        |                         |                           |
        |  4. POST /social-login                              |
        |     { idToken, nonce: rawNonce, provider }          |
        | --------------------------------------------------> |
        |                         |                           |
        |                         |  5. Verify token          |
        |                         |     Verify nonce          |
        |                         |     Find/create user      |
        |                         |                           |
        |  6. { accessToken, refreshToken }                   |
        | <-------------------------------------------------- |
```

---

### iOS (Swift) Implementation

#### Nonce Helper

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

#### Apple Sign In

```swift
import AuthenticationServices

let rawNonce = randomNonceString()

let request = ASAuthorizationAppleIDProvider().createRequest()
request.requestedScopes = [.fullName, .email]
request.nonce = sha256(rawNonce)  // Apple gets the HASH

// ASAuthorizationController delegate callback:
func authorizationController(controller: ASAuthorizationController,
                             didCompleteWithAuthorization authorization: ASAuthorization) {
    guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
          let idTokenData = credential.identityToken,
          let idToken = String(data: idTokenData, encoding: .utf8) else { return }

    let body: [String: Any] = [
        "provider": "apple",
        "idToken": idToken,
        "nonce": rawNonce,           // RAW nonce — server will hash & compare
        "deviceToken": fcmToken,     // optional
        "platform": "ios"
    ]
    POST("/api/v1/auth/social-login", body: body)
}
```

#### Google Sign In

```swift
import GoogleSignIn

let rawNonce = randomNonceString()

GIDSignIn.sharedInstance.signIn(withPresenting: viewController,
                                hint: nil,
                                additionalScopes: nil,
                                nonce: rawNonce) { result, error in
    guard let idToken = result?.user.idToken?.tokenString else { return }

    let body: [String: Any] = [
        "provider": "google",
        "idToken": idToken,
        "nonce": rawNonce,           // RAW nonce — server compares directly
        "deviceToken": fcmToken,
        "platform": "ios"
    ]
    POST("/api/v1/auth/social-login", body: body)
}
```

---

### Android (Kotlin) Implementation

#### Nonce Helper

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

#### Google Sign In (Credential Manager)

```kotlin
val rawNonce = generateNonce()

val googleOption = GetSignInWithGoogleOption.Builder("GOOGLE_CLIENT_ID_ANDROID")
    .setNonce(rawNonce)
    .build()

val request = GetCredentialRequest.Builder()
    .addCredentialOption(googleOption)
    .build()

credentialManager.getCredential(context, request).let { result ->
    val credential = result.credential as CustomCredential
    val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
    val idToken = googleIdTokenCredential.idToken

    api.socialLogin(mapOf(
        "provider" to "google",
        "idToken" to idToken,
        "nonce" to rawNonce,
        "deviceToken" to fcmToken,
        "platform" to "android"
    ))
}
```

#### Apple Sign In (Android)

Apple Sign In on Android uses a web-based OAuth flow (Apple doesn't have a native Android SDK). Typically done via a WebView or third-party library.

```kotlin
// After obtaining Apple idToken via web flow:
api.socialLogin(mapOf(
    "provider" to "apple",
    "idToken" to appleIdToken,
    "nonce" to rawNonce,
    "deviceToken" to fcmToken,
    "platform" to "android"
))
```

---

## Part 4: Important Notes

### Apple Email Behavior (CRITICAL)

- Apple **shudhu prothombar** email + name dey
- Porer login-e email thakteo pare, na-o thakte pare
- `sub` (Apple user ID) **shobshomoy** ashe — server eta diye user match kore
- User email hide korle Apple ekta **private relay email** dey: `xyz@privaterelay.appleid.com`
- **Action:** App developer-ke bolte hobe — prothom login-e email + name save koro locally, karon Apple ar dibe na

### Google Multiple Client IDs

- iOS, Android, Web prottekar jonne **alada** OAuth client ID thake
- Server-e **tin-tai** env var dite hobe
- `verifyIdToken()` array accept kore — token-er `aud` jodi ANY ektar shathe match kore, pass

### Nonce is Optional but Recommended

- Nonce na pathaleo login kaj korbe (backwards compatible)
- Kintu production-e **must pathano uchit** — replay attack prevent kore
- Apple: nonce replay protection **officially recommended** by Apple
- Google: nonce extra security layer

### New User Creation via Social Login

- Social login-e new user create hole `country` ar `phone` required na (pore profile complete korbe)
- `password` o required na (OAuth user)
- User automatically `verified: true` hoy (provider already email verify korche)

### Backend Key Files

| File                                       | Purpose                                     |
| ------------------------------------------ | ------------------------------------------- |
| `src/app/modules/auth/auth.service.ts`     | `socialLoginToDB` — token verification + user logic |
| `src/app/modules/auth/auth.controller.ts`  | `socialLogin` — HTTP handler                |
| `src/app/modules/auth/auth.route.ts`       | `POST /social-login` route                  |
| `src/app/modules/auth/auth.validation.ts`  | Zod schema validation                       |
| `src/app/modules/user/user.model.ts`       | `googleId`, `appleId` fields                |
| `src/config/index.ts`                      | `google.clientId*`, `apple_client_id`       |

### References

- [Google Backend Auth — Official Docs](https://developers.google.com/identity/sign-in/android/backend-auth)
- [Google ID Token Verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [Apple Sign In — Getting Started](https://developer.apple.com/sign-in-with-apple/get-started/)
- [Apple Configuring Environment](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple)
- [Firebase Apple Auth + Nonce](https://firebase.google.com/docs/auth/ios/apple)
- [apple-signin-auth npm](https://www.npmjs.com/package/apple-signin-auth)
