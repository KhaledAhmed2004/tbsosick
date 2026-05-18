"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const auth_service_1 = require("./auth.service");
const verifyEmail = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const verifyData = __rest(req.body, []);
    const result = yield auth_service_1.AuthService.verifyEmailToDB(verifyData);
    // Set refresh token in httpOnly cookie for better security
    if ((_a = result === null || result === void 0 ? void 0 : result.tokens) === null || _a === void 0 ? void 0 : _a.refreshToken) {
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: config_1.default.node_env === 'production',
            sameSite: 'lax',
            path: '/',
        });
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
}));
const loginUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const loginData = __rest(req.body, []);
    const result = yield auth_service_1.AuthService.loginUserFromDB(loginData);
    // Set refresh token in httpOnly cookie for better security
    if ((_a = result === null || result === void 0 ? void 0 : result.tokens) === null || _a === void 0 ? void 0 : _a.refreshToken) {
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: config_1.default.node_env === 'production',
            sameSite: 'lax',
        });
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User logged in successfully.',
        data: Object.assign(Object.assign({}, result.tokens), { isOnboardingCompleted: result.isOnboardingCompleted }),
    });
}));
const logoutUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deviceToken } = req.body;
    console.log('deviceToken', deviceToken);
    const user = req.user;
    yield auth_service_1.AuthService.logoutUserFromDB(user, deviceToken);
    // Clear refresh token cookie on logout
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: config_1.default.node_env === 'production',
        sameSite: 'lax',
        path: '/',
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User logged out successfully.',
    });
}));
const forgetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const email = req.body.email;
    const result = yield auth_service_1.AuthService.forgetPasswordToDB(email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Please check your email. We have sent you a one-time passcode (OTP).',
        data: result,
    });
}));
const resetPassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Reset token is required');
    }
    // Handle both raw token and Bearer token formats
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;
    const resetData = __rest(req.body, []);
    const result = yield auth_service_1.AuthService.resetPasswordToDB(token, resetData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Your password has been successfully reset.',
        data: result,
    });
}));
const changePassword = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const passwordData = __rest(req.body, []);
    yield auth_service_1.AuthService.changePasswordToDB(user, passwordData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Your password has been successfully changed',
    });
}));
const resendVerifyEmail = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const result = yield auth_service_1.AuthService.resendVerifyEmailToDB(email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Verification code has been resent to your email.',
        data: result,
    });
}));
const refreshToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Prefer reading refresh token from cookie; fallback to body if present
    const cookieToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
    const bodyToken = (_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken;
    const token = cookieToken || bodyToken || '';
    const result = yield auth_service_1.AuthService.refreshTokenToDB(token);
    // Rotate refresh token in httpOnly cookie
    if ((_c = result === null || result === void 0 ? void 0 : result.tokens) === null || _c === void 0 ? void 0 : _c.refreshToken) {
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: config_1.default.node_env === 'production',
            sameSite: 'lax',
            path: '/',
        });
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Token refreshed successfully.',
        data: result.tokens,
    });
}));
const socialLogin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield auth_service_1.AuthService.socialLoginToDB(req.body);
    // Set refresh token in httpOnly cookie
    if ((_a = result === null || result === void 0 ? void 0 : result.tokens) === null || _a === void 0 ? void 0 : _a.refreshToken) {
        res.cookie('refreshToken', result.tokens.refreshToken, {
            httpOnly: true,
            secure: config_1.default.node_env === 'production',
            sameSite: 'lax',
            path: '/',
        });
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User logged in successfully.',
        data: Object.assign(Object.assign({}, result.tokens), { isOnboardingCompleted: result.isOnboardingCompleted }),
    });
}));
/**
 * Apple Sign In Callback for Android fallback (Web OAuth flow)
 *
 * This endpoint receives a POST request from Apple after a user completes
 * the sign-in flow in the browser (on Android). It must return an HTML
 * page that performs a redirect back to the app using an Intent.
 *
 * @see https://pub.dev/packages/sign_in_with_apple#android
 */
const appleCallback = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Apple sends data in req.body via POST. Manual testing might use req.query via GET.
    const { code, id_token, state, user } = Object.assign(Object.assign({}, req.query), req.body);
    // Comprehensive debug logging
    console.log('🍎 Apple Callback Details:', {
        method: req.method,
        url: req.originalUrl,
        contentType: req.headers['content-type'],
        receivedKeys: Object.keys(req.body || {}),
        hasCode: !!code,
        hasIdToken: !!id_token,
        state: state || 'MISSING',
        hasUser: !!user,
    });
    // Use the package name from config, fallback to a sensible default
    const androidPackageName = config_1.default.googlePlay.packageName;
    if (!androidPackageName) {
        console.warn('⚠️ WARNING: GOOGLE_PLAY_PACKAGE_NAME is not set in .env! Intent redirect may fail.');
    }
    // The state is REQUIRED by the Flutter sign_in_with_apple package.
    // If it's missing from Apple, we have a problem.
    const finalState = state || '';
    const redirectUrl = `intent://callback?code=${code || ''}&id_token=${id_token || ''}&state=${finalState}${user ? `&user=${encodeURIComponent(user)}` : ''}#Intent;package=${androidPackageName || 'com.tbsosick.smrtscrub'};scheme=signinwithapple;end;`;
    console.log('🍎 Redirecting to App with URL:', redirectUrl);
    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authenticating...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #ffffff; padding: 20px; box-sizing: border-box; }
          .container { text-align: center; max-width: 400px; width: 100%; }
          .loader { border: 3px solid #f3f3f3; border-top: 3px solid #000; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; display: inline-block; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .button { margin-top: 20px; padding: 14px 28px; background-color: #000; color: #fff; text-decoration: none; border-radius: 12px; display: none; font-weight: bold; font-size: 16px; border: none; cursor: pointer; }
          h2 { margin: 10px 0; font-size: 22px; }
          p { color: #666; margin-top: 10px; line-height: 1.5; }
          .debug-info { margin-top: 30px; font-size: 12px; color: #ccc; word-break: break-all; text-align: left; background: #f9f9f9; padding: 10px; border-radius: 8px; display: none; }
          .warning { color: #d9534f; font-weight: bold; margin-top: 10px; display: ${!state ? 'block' : 'none'}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loader"></div>
          <h2>Almost there!</h2>
          <p>We're taking you back to the app to complete your login.</p>
          <p id="status-text">Redirecting...</p>
          
          <div class="warning">
            ⚠️ Warning: "state" parameter is missing from Apple. Login might fail.
          </div>

          <a id="manual-link" href="${redirectUrl}" class="button">Open SMRTSCRUB App</a>
          
          <div id="debug-info" class="debug-info">
            <strong>Debug URL:</strong><br>
            ${redirectUrl}<br><br>
            <strong>Package Name:</strong> ${androidPackageName || 'NOT SET'}<br>
            <strong>State:</strong> ${state || 'UNDEFINED'}
          </div>
        </div>
        <script>
          // 1. Try immediate redirect
          const redirectUrl = "${redirectUrl}";
          window.location.href = redirectUrl;
          
          // 2. Fallback logic
          setTimeout(function() {
            document.getElementById('manual-link').style.display = 'inline-block';
            document.querySelector('.loader').style.display = 'none';
            document.getElementById('status-text').innerText = "If the app didn't open automatically, please click the button below.";
            
            // Show debug info after 3 seconds if still here
            setTimeout(function() {
              document.getElementById('debug-info').style.display = 'block';
            }, 1000);
          }, 2000);
        </script>
      </body>
    </html>
  `);
}));
exports.AuthController = {
    verifyEmail,
    logoutUser,
    loginUser,
    forgetPassword,
    resetPassword,
    changePassword,
    resendVerifyEmail,
    socialLogin,
    refreshToken,
    appleCallback,
};
