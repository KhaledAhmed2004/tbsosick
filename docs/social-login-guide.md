# Social Login Integration Guide (Google + Apple)

> **Endpoint:** `POST /api/v1/auth/social-login`
> **Pattern:** Mobile SDK login -> ID Token -> Server verification -> JWT issue

---

## Part 1: Backend Developer — Ki Ki Korte Hobe

### Step 1: Google Cloud Console Setup

Google-te iOS, Android, Web — prottekar **alada client ID** thake. Eita important — mismatch hole verify fail korbe.

**Overview — 3 ta OAuth Client ID create korte hobe:**

| # | Application Type | Required Info | Env Var |
|---|-----------------|---------------|---------|
| 1 | **iOS** | Bundle ID (e.g. `com.yourcompany.app`) | `GOOGLE_CLIENT_ID_IOS` |
| 2 | **Android** | Package name + SHA-1 fingerprint | `GOOGLE_CLIENT_ID_ANDROID` |
| 3 | **Web application** | (optional, if web client exists) | `GOOGLE_CLIENT_ID_WEB` |

> **Important:** iOS ar Android-er client ID-te kono **client secret nai** — Google mobile clients-ke "public client" mone kore, tai secret generate kore na. Shudhu client ID lagbe.

> **How it works:** Server-e `verifyIdToken()` call korar shomoy audience-e tin-tai array hishebe pass hoy. Token-er `aud` claim jodi ANY ektar shathe match kore, verify pass hoy.

---

#### Prerequisite: OAuth Consent Screen Configure (ekbar matro)

Client ID create korar **age** ei step ta korte **must**, na hole "Create Credentials" button disable thakbe.

1. [Google Cloud Console](https://console.cloud.google.com/) -> tomar project select koro (ba notun create koro)
2. Left sidebar: **APIs & Services** -> **OAuth consent screen**
3. **Get Started** button click koro
4. **App Information**:
   - App name: `YourAppName`
   - User support email: tomar email
5. **Audience**: `External` select koro (normal users-er jonne)
6. **Contact Information**: developer email
7. **Agree** to policy -> **Create**

> Production-e jaoyar age **Publishing Status** "Testing" theke "In Production" korte hobe (Audience tab theke). Testing mode-e shudhu add kora test users login korte parbe.

---

#### 1.1: iOS Client ID Create

1. Left sidebar: **APIs & Services** -> **Credentials**
2. Top-e **+ Create Credentials** -> **OAuth client ID**
3. **Application type**: `iOS` select koro
4. **Name**: `iOS Client` (ja khushi)
5. **Bundle ID**: tomar iOS app-er Bundle ID (app developer theke nao)
   - Example: `com.yourcompany.yourapp`
   - Xcode-e: Project -> General -> Bundle Identifier
6. **App Store ID** (optional, publish korar por dibe)
7. **Team ID** (optional, Apple Developer account theke)
8. **Create** click koro

> Copy: **Client ID** (ends with `.apps.googleusercontent.com`) -> `.env`-e `GOOGLE_CLIENT_ID_IOS`-e paste koro.
> **Client secret nai** — eita normal, mobile client "public" bole Google secret dey na.

---

#### 1.2: Android Client ID Create

**Age SHA-1 fingerprint lagbe** — app developer theke nao, othoba niche-r command diye generate koro:

**Debug SHA-1** (development):

Windows PowerShell (tested, kaj kore):
```powershell
keytool -list -v -alias androiddebugkey -keystore "$env:USERPROFILE\.android\debug.keystore" -storepass android -keypass android
```

macOS / Linux:
```bash
keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android -keypass android
```

> **Windows-e `~/.android/` kaj kore na** — PowerShell tilde expand kore na. `$env:USERPROFILE` use korte hobe (e.g. `C:\Users\YourName\.android\debug.keystore`).
> **`keytool` not found?** -> `JAVA_HOME\bin` PATH-e add koro, othoba Android Studio-er bundled JDK use koro: `C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`.

**Release SHA-1** (production APK) — tomar release keystore-er actual path dao:
```powershell
keytool -list -v -alias your-key-alias -keystore "C:\path\to\release.keystore"
```

Output-e `SHA1:` line-er pashe je fingerprint ache — copy koro (format: `AA:BB:CC:...`).

**Example output:**
```
SHA1:   E1:91:D1:6C:72:58:69:6C:73:BA:6C:13:0D:A4:6F:AF:3C:42:E1:5D
SHA256: 45:6F:16:BF:6F:67:F3:2A:D6:A4:20:88:C9:D3:EE:21:92:3D:00:50:18:DF:5F:21:CF:47:59:47:5B:A5:5E:3E
```
> Google Cloud Console-e **SHA-1** value ta paste korte hobe (SHA-256 na).

**Tarpor:**

1. **Credentials** -> **+ Create Credentials** -> **OAuth client ID**
2. **Application type**: `Android`
3. **Name**: `Android Client`
4. **Package name**: `com.yourcompany.yourapp` (app-er `build.gradle` theke)
5. **SHA-1 certificate fingerprint**: upor-er command theke paoya value paste koro
6. **Create**

> Copy: **Client ID** -> `GOOGLE_CLIENT_ID_ANDROID`.
> **Debug ar Release SHA-1 alada** — dui tar jonne dui ta Android Client ID banano best practice, othoba ek Client ID-te dui SHA-1 add koro (Edit -> Add fingerprint).

---

#### 1.2.1: SHA-1 Ta Ashol-e Ki? (Concept Explained)

> Ei section pore rakha — porer bar setup korar shomoy confusion hole ei part dekhle clear hobe.

**Apartment Building Analogy:**

Google Server = apartment building. Shudhu authorized resident-ke dhuktai dite chao.

| Real World | OAuth World |
|-----------|-------------|
| Guard | Google verification system |
| Resident | Tomar Android app |
| ID Card (naam) | Package name (e.g. `com.yourcompany.app`) |
| Fingerprint | SHA-1 |

Guard-er rule: *"Naam + Fingerprint **dui-tai** match korle dhukte dibo. Shudhu naam nokol kora jay, fingerprint jay na."*

---

**Keno SHA-1 lage?**

Android app-e **client secret rakha jay na** — karon APK basically ekta zip, decompile kore keo secret churi kore nite pare. Tai Google "mobile = public client" dhore, secret dey na.

Kintu tahole security risk: attacker jodi tomar Client ID jane (APK theke easily paoya jay), nokol app banaiye token nite parbe?

**SHA-1 exactly ei problem solve kore:**
- Tomar app-er signing keystore theke ekta unique hash generate hoy -> SHA-1
- Google Cloud Console-e tumi register koro: "ei SHA-1 + package name er app-i shudhu amar Client ID use korte parbe"
- Attacker Client ID janleo, **tomar keystore chhara** app sign korte parbe na -> alada SHA-1 -> Google reject korbe

---

**Ek Machine, Onek App — Kivabe Distinguish Hoy?**

Dhoro Android dev-er laptop-e 5 ta app:

| App | Package Name | Debug SHA-1 |
|-----|--------------|-------------|
| tbsosick | `com.tbsosick.app` | `E1:91:D1:6C:...` |
| food-app | `com.mdbay.foodapp` | `E1:91:D1:6C:...` |
| chat-app | `com.mdbay.chatapp` | `E1:91:D1:6C:...` |

SHA-1 **shob app-er same** — karon ek machine-e ekta-i debug keystore (`~/.android/debug.keystore`), shob app sei same file diye sign hoy.

**Distinguisher:** `package_name + SHA-1` **combination** — ei pair-i unique identifier. Google match kore dui tai.

---

**Team-e Onek Developer Thakle?**

Prottek developer-er debug keystore **alada** (alada laptop, alada Android Studio install). Tai ek app-er jonne multiple debug SHA-1 ashbe:

| Developer | Debug SHA-1 |
|-----------|-------------|
| mdbay | `E1:91:D1:6C:...` |
| karim | `AA:BB:CC:DD:...` |
| rahim | `77:88:99:00:...` |

**Solution:** Google Cloud Console-e ekta Android Client ID-te **multiple SHA-1 add kora jay**:

```
Android Client ID: tbsosick
  Package: com.tbsosick.app
  SHA-1 fingerprints:
    ├── E1:91:D1:6C:... (mdbay debug)
    ├── AA:BB:CC:DD:... (karim debug)
    ├── 77:88:99:00:... (rahim debug)
    └── 12:34:56:78:... (release — production)
```

**Notun dev team-e ashle:** tar debug SHA-1 nao, Client ID-e "Add fingerprint" diye add koro. Na hole oi dev-er build-e login fail korbe.

---

**Debug vs Release Keystore:**

| Keystore | Kothay thake | SHA-1 |
|----------|-------------|-------|
| **Debug** | Prottek dev-er laptop-e alada (Android Studio auto-generate) | Prottek-er alada |
| **Release** | Shudhu ek jaygay — secret file, Git-e commit hoy na | App-er jonne ekta-i |

**Minimum 2 ta SHA-1 lagbe production-er age:**
1. Dev team-er prottek-er debug SHA-1 (development/testing)
2. Release keystore-er SHA-1 (Play Store build)

---

**Ke Command Chalabe?**

| Scenario | Ke Chalabe |
|----------|-----------|
| Tomar backend dev-er laptop-e keystore nai | **Android dev chalabe**, tomake SHA-1 share korbe |
| Tumi nije Android app build korcho | Tumi nije chalabe |
| Release SHA-1 lagbe | Jar kache release keystore ache (lead dev/DevOps) |

**Backend dev-er kaj:** Android dev theke value nao -> Google Cloud Console-e paste koro. Bas.

---

**tl;dr:**

1. **SHA-1** = tomar app-er "digital fingerprint" (keystore file theke ashe)
2. **App identity = package_name + SHA-1** combination
3. **Ek machine-er shob app-e same debug SHA-1**, but package name alada -> unique
4. **Ek Client ID-e multiple SHA-1 add kora jay** (team members + release mile)
5. **Debug keystore = dev laptop-e auto-generate**, **Release keystore = team-er ek shared secret file**

---

#### 1.3: Web Client ID Create (Optional)

Web frontend thakle banao, na thakle skip koro (server automatic filter kore).

1. **+ Create Credentials** -> **OAuth client ID**
2. **Application type**: `Web application`
3. **Name**: `Web Client`
4. **Authorized JavaScript origins**: `https://yourdomain.com` (production), `http://localhost:3000` (dev)
5. **Authorized redirect URIs**: `https://yourdomain.com/auth/callback` (jodi redirect flow use koro)
6. **Create**

> Copy: **Client ID** -> `GOOGLE_CLIENT_ID_WEB`.
> Web client-e **Client Secret thake** — kintu `social-login` endpoint ID token verify kore, secret lagbe na. Shudhu Client ID use koro.

---

#### Common Issues

| Problem | Solution |
|---------|----------|
| "OAuth client was deleted" | Consent screen publish korcho kina check koro |
| Android login fail, "invalid_client" | SHA-1 ar package name match korche kina verify koro |
| iOS login fail | Bundle ID exact match lagbe (case-sensitive) |
| Token `aud` mismatch | App je Client ID diye login korche, sheta `.env`-e ache kina check koro |
| Release build fail but debug works | Release SHA-1 add korcho kina check koro |

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
| `nonce`       | Apple: **Yes** · Google: Recommended | string | Replay attack prevention — min 32 chars. Mandatory for Apple; optional for Google (Flutter plugin limitation). |
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

| Status | When                                                                 |
| ------ | -------------------------------------------------------------------- |
| `400`  | Invalid body / nonce < 32 chars / Apple login without nonce / new Apple user missing email |
| `401`  | Invalid/expired token / nonce mismatch / Google email not verified   |
| `403`  | Account deleted or restricted                                        |
| `409`  | Email already in use by another account (sign in first and link)     |
| `429`  | Too many requests — rate-limited (10/min per IP)                     |

### 4. Google Client IDs (App Developer-ke dite hobe)

| Platform | Client ID env var | Where to Use in Flutter |
|----------|-------------------|-------------------------|
| iOS | `GOOGLE_CLIENT_ID_IOS` value | `google_sign_in` package: `GoogleSignIn(clientId: '...', serverClientId: '...')` |
| Android | `GOOGLE_CLIENT_ID_ANDROID` value | `google_sign_in` package (Android auto-picks via SHA-1) |

### 5. Apple Bundle ID

App developer already janbe — eta app-eroi Bundle ID. Flutter `sign_in_with_apple` package iOS-e native, Android-e web flow use kore.

---

## Part 3: Flutter App Developer er Step-by-Step Guide

> **Stack:** ei project-er mobile app **Flutter/Dart** — tai ei section-e shudhu Flutter code ar packages dewa hoyeche. Native Swift/Kotlin reference na lage.

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

### `idToken` ar `nonce` — Kothay Theke Ashe?

Ei dui ta field API-te pathate hoy. Duita completely alada jinish — confusion na hoye kintu:

#### 🔑 `idToken` — SDK Auto-Generate Kore

User "Sign in with Google/Apple" button tap korle **Flutter plugin** login complete korar por tomake `idToken` return kore. **Tumi ei token banao na**, plugin-i deye.

| Provider | Flutter Plugin | pubspec.yaml | Code Path |
|----------|---------------|--------------|-----------|
| **Google** | [`google_sign_in`](https://pub.dev/packages/google_sign_in) | `google_sign_in: ^6.2.1` | `GoogleSignIn().signIn()` -> `account.authentication` -> **`auth.idToken`** |
| **Apple** | [`sign_in_with_apple`](https://pub.dev/packages/sign_in_with_apple) | `sign_in_with_apple: ^6.1.0` | `SignInWithApple.getAppleIDCredential(...)` -> **`credential.identityToken`** |

**Under the hood** (jodi kotohono janaar ichcha hoy):
- **`google_sign_in` plugin** internally iOS-e [GoogleSignIn SDK (iOS)](https://developers.google.com/identity/sign-in/ios) use kore, Android-e [Google Identity Services](https://developers.google.com/identity) use kore — native code-e call dey
- **`sign_in_with_apple` plugin** iOS-e native [AuthenticationServices framework](https://developer.apple.com/documentation/authenticationservices) (Apple-er built-in) use kore, Android-e web OAuth flow use kore (karon Apple native Android SDK dey na)

> `idToken` ekta **cryptographically signed JWT** — Google/Apple-er private key diye sign kora. Server-er kache public key ache, sheta diye verify kore. Tumi ei token change korle server fail dibe.

#### 🎲 `nonce` — App-e Nije Generate Koro

Prottek login request-e **notun random string**. Replay attack prevent kore — ekbar use hoye geshe token attacker jodi churi kore, aboar use korte parbe na karon nonce different.

**Flutter code:**
```dart
import 'dart:math';
String rawNonce = List.generate(
  32,
  (_) => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._'
      [Random.secure().nextInt(64)],
).join();
```

**Google vs Apple (important):**

| Provider | Nonce Format SDK-e pathano | Nonce Format Server-e pathano |
|----------|----------------------------|--------------------------------|
| **Google** | `rawNonce` directly | `rawNonce` (raw) |
| **Apple** | `sha256(rawNonce)` — hash | `rawNonce` (raw) — server hash kore compare |

**Mane:** Apple-ke hash-kora nonce dao, but server-e **always raw nonce** pathao. Server nije hash kore match korbe.

---

### Flutter (Dart) Implementation

#### Dependencies (`pubspec.yaml`)

```yaml
dependencies:
  google_sign_in: ^6.2.1        # Google login (iOS + Android)
  sign_in_with_apple: ^6.1.0    # Apple login (iOS native + Android web fallback)
  crypto: ^3.0.3                # SHA-256 for Apple nonce hashing
  http: ^1.2.0                  # API call
  firebase_messaging: ^15.0.0   # FCM device token (optional)
```

```bash
flutter pub get
```

> Apple gets strict nonce protection via `sign_in_with_apple`. Google uses
> the token's signature + audience + `email_verified` checks; nonce is
> skipped on server side because `google_sign_in` can't pass it. If you
> need strict Google nonce, see **"Optional: Strict Google Nonce"** at the
> bottom of this section.

#### Platform-Specific Setup

**iOS** (`ios/Runner/Info.plist`) — Google Sign In-er jonne URL scheme add koro:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <!-- Reversed iOS Client ID -->
      <!-- Original: 247970361242-r52rrf6f0o467dkm0gs48eidlb6b6u2h.apps.googleusercontent.com -->
      <!-- Reversed: com.googleusercontent.apps.247970361242-r52rrf6f0o467dkm0gs48eidlb6b6u2h -->
      <string>com.googleusercontent.apps.247970361242-r52rrf6f0o467dkm0gs48eidlb6b6u2h</string>
    </array>
  </dict>
</array>
```

**Apple Sign In-er jonne** `ios/Runner/Runner.entitlements`:
```xml
<key>com.apple.developer.applesignin</key>
<array>
  <string>Default</string>
</array>
```
Xcode-e **Signing & Capabilities** tab theke **"Sign in with Apple"** add korle auto-generate hoy.

**Android** — `google_sign_in` auto kaj kore, shudhu Google Cloud Console-e SHA-1 + package name registered thaka lagbe (already done). Alada config lagbe na.

#### Nonce Helper (`lib/utils/nonce_helper.dart`)

```dart
import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';

String generateNonce([int length = 32]) {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._';
  final random = Random.secure();
  return List.generate(length, (_) => charset[random.nextInt(charset.length)]).join();
}

String sha256OfString(String input) {
  final bytes = utf8.encode(input);
  return sha256.convert(bytes).toString();
}
```

#### Google Sign In (No Nonce — Pragmatic Default)

```dart
import 'dart:convert';
import 'dart:io' show Platform;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;

Future<void> signInWithGoogle() async {
  final googleSignIn = GoogleSignIn(
    clientId: Platform.isIOS
        ? '247970361242-r52rrf6f0o467dkm0gs48eidlb6b6u2h.apps.googleusercontent.com'
        : null,  // Android auto-picks from google-services.json / Console
    serverClientId: '247970361242-r52rrf6f0o467dkm0gs48eidlb6b6u2h.apps.googleusercontent.com',
  );

  final account = await googleSignIn.signIn();
  if (account == null) return;  // user cancelled

  final auth = await account.authentication;
  final idToken = auth.idToken;
  if (idToken == null) return;

  final fcmToken = await FirebaseMessaging.instance.getToken();

  final response = await http.post(
    Uri.parse('$baseUrl/api/v1/auth/social-login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'provider': 'google',
      'idToken': idToken,
      // 'nonce' omitted — google_sign_in doesn't support it. Server does
      //   signature/audience/email_verified checks instead.
      'deviceToken': fcmToken,
      'platform': Platform.isIOS ? 'ios' : 'android',
    }),
  );

  final data = jsonDecode(response.body);
  // Save data['data']['accessToken'] and data['data']['refreshToken']
}
```

#### Apple Sign In

```dart
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io' show Platform;

Future<void> signInWithApple() async {
  final rawNonce = generateNonce();
  final hashedNonce = sha256OfString(rawNonce);

  final credential = await SignInWithApple.getAppleIDCredential(
    scopes: [
      AppleIDAuthorizationScopes.email,
      AppleIDAuthorizationScopes.fullName,
    ],
    nonce: hashedNonce,  // Apple gets the HASH
    // Android-er jonne webAuthenticationOptions lagbe — iOS-e lagbe na
    webAuthenticationOptions: Platform.isAndroid
        ? WebAuthenticationOptions(
            clientId: 'com.tbsosick.smrtscrub.service',  // Services ID (Android only)
            redirectUri: Uri.parse('https://your-backend.com/api/v1/auth/apple/callback'),
          )
        : null,
  );

  final idToken = credential.identityToken;
  if (idToken == null) return;

  final fcmToken = await FirebaseMessaging.instance.getToken();

  final response = await http.post(
    Uri.parse('${baseUrl}/api/v1/auth/social-login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'provider': 'apple',
      'idToken': idToken,
      'nonce': rawNonce,                               // RAW nonce — server hashes & compares
      'deviceToken': fcmToken,
      'platform': Platform.isIOS ? 'ios' : 'android',
    }),
  );

  final data = jsonDecode(response.body);
  // Save tokens
}
```

> **Android-e Apple Sign In:** Apple native Android SDK dey na — web flow lagbe. Ekta **Services ID** banate hobe Apple Developer Portal-e (Bundle ID chhara alada), ar redirect URI configure korte hobe. iOS-only app hole ei part skip.

#### Optional: Strict Google Nonce (advanced)

Skip this unless your threat model requires defense-in-depth against
long-window token replay beyond what HTTPS + rate limiting already cover.
`google_sign_in` alone won't work — pick one of these:

**Option A — `flutter_appauth` + OIDC discovery (Dart-only)**

Adds a custom OAuth2 flow that can pass `nonce` directly to Google.

```yaml
dependencies:
  flutter_appauth: ^6.0.0
```

```dart
import 'package:flutter_appauth/flutter_appauth.dart';

final rawNonce = generateNonce();
final appAuth = FlutterAppAuth();
final result = await appAuth.authorizeAndExchangeCode(
  AuthorizationTokenRequest(
    '247970361242-r52rrf6f0o467dkm0gs48eidlb6b6u2h.apps.googleusercontent.com',
    'com.googleusercontent.apps.247970361242-r52rrf6f0o467dkm0gs48eidlb6b6u2h:/oauth2redirect',
    discoveryUrl: 'https://accounts.google.com/.well-known/openid-configuration',
    scopes: ['openid', 'email', 'profile'],
    additionalParameters: {'nonce': rawNonce},
  ),
);

// result.idToken now contains the nonce claim; send rawNonce to server
```

Tradeoff: lose the native Google sign-in sheet UX; you get a browser-based
OAuth2 redirect flow instead.

**Option B — Platform channels to native SDKs**

Write a MethodChannel bridge:
- iOS: `GIDSignIn.sharedInstance.signIn(withPresenting:, nonce:)`
- Android: `GetSignInWithGoogleOption.Builder(clientId).setNonce(rawNonce).build()` via Credential Manager

Tradeoff: ~100 lines of platform code on each side; keeps native UX.

Either way, send the raw nonce in the `nonce` field of the `/social-login`
request — the server already verifies it when present.

---

#### Common Flutter Issues

| Problem | Solution |
|---------|----------|
| iOS-e "GIDSignIn not configured" | `Info.plist`-e reversed client ID URL scheme add korcho kina check koro |
| Android-e Google login fail silently | Google Cloud Console-e SHA-1 + package name register korcho kina verify koro |
| Apple Sign In button dekhay na | Platform check lagbe: `Platform.isIOS` (ba `SignInWithApple.isAvailable()`) |
| iOS build fail: "missing entitlement" | Xcode-e "Sign in with Apple" capability add koro |
| `idToken` null ashe | User cancel korle null ashe — handle koro |

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

### Nonce Policy (Apple Strict, Google Pragmatic)

**Apple — nonce REQUIRED:**
- Client MUST generate rawNonce (min 32 chars), pass `sha256(rawNonce)` to `sign_in_with_apple` SDK, and send the raw nonce to the server
- Server rejects with 400 if missing, 401 if hash mismatch
- Apple officially mandates nonce-based replay protection

**Google — nonce OPTIONAL (Flutter plugin limitation):**
- Mainstream `google_sign_in` Flutter plugin doesn't expose a nonce parameter, so the server doesn't force it
- If the client *does* send nonce (via `flutter_appauth`, platform channels, or a custom flow), the server validates it — mismatched nonce still returns 401
- Without nonce, Google login still has: signature verification, audience check, short expiration, email_verified check, HTTPS, rate limiting — same posture Firebase Auth and Auth0 ship with by default
- Teams that want strict Google nonce should use `flutter_appauth` with OIDC discovery (see "Optional: Strict Google Nonce" below in this guide)

### Account Linking Policy

- Social login with a Google/Apple account whose email matches an existing
  **password-based** account returns **409 Conflict**
- App must instruct the user: "Sign in with your password first, then link
  your Google/Apple account from account settings"
- Prevents attacker who controls a provider account with the same email
  from hijacking local accounts (OWASP account-linking guidance)
- Once a user manually links the provider from within an authenticated
  session, subsequent social logins find the linked provider ID and sign
  them straight in

### Rate Limiting

- `/social-login`, `/login`: **10 requests / minute / IP**
- `/forgot-password`, `/verify-otp`, `/reset-password`: **5 requests / minute / IP**
- 429 response when exceeded — app should surface a friendly retry message

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
