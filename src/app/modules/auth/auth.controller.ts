import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiError';
import { AuthService } from './auth.service';
import { JwtPayload } from 'jsonwebtoken';

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { ...verifyData } = req.body;
  const result = await AuthService.verifyEmailToDB(verifyData);

  // Set refresh token in httpOnly cookie for better security
  if (result?.tokens?.refreshToken) {
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.node_env === 'production',
      sameSite: 'lax' as const,
      path: '/',
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await AuthService.loginUserFromDB(loginData);

  // Set refresh token in httpOnly cookie for better security
  if (result?.tokens?.refreshToken) {
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.node_env === 'production',
      sameSite: 'lax' as const,
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logged in successfully.',
    data: {
      ...result.tokens,
      isOnboardingCompleted: result.isOnboardingCompleted,
    },
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const { deviceToken } = req.body;
  console.log('deviceToken', deviceToken);
  const user = req.user as JwtPayload;

  await AuthService.logoutUserFromDB(user, deviceToken);

  // Clear refresh token cookie on logout
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.node_env === 'production',
    sameSite: 'lax' as const,
    path: '/',
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logged out successfully.',
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const email = req.body.email;
  const result = await AuthService.forgetPasswordToDB(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message:
      'Please check your email. We have sent you a one-time passcode (OTP).',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Reset token is required');
  }

  // Handle both raw token and Bearer token formats
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : authHeader;

  const { ...resetData } = req.body;
  const result = await AuthService.resetPasswordToDB(token, resetData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully reset.',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { ...passwordData } = req.body;
  await AuthService.changePasswordToDB(user, passwordData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully changed',
  });
});

const resendVerifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.resendVerifyEmailToDB(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Verification code has been resent to your email.',
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  // Prefer reading refresh token from cookie; fallback to body if present
  const cookieToken = req.cookies?.refreshToken as string | undefined;
  const bodyToken = (req.body as { refreshToken?: string })?.refreshToken;
  const token = cookieToken || bodyToken || '';

  const result = await AuthService.refreshTokenToDB(token);

  // Rotate refresh token in httpOnly cookie
  if (result?.tokens?.refreshToken) {
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.node_env === 'production',
      sameSite: 'lax' as const,
      path: '/',
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Token refreshed successfully.',
    data: result.tokens,
  });
});

const socialLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.socialLoginToDB(req.body);

  // Set refresh token in httpOnly cookie
  if (result?.tokens?.refreshToken) {
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.node_env === 'production',
      sameSite: 'lax' as const,
      path: '/',
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logged in successfully.',
    data: {
      ...result.tokens,
      isOnboardingCompleted: result.isOnboardingCompleted,
    },
  });
});

/**
 * Apple Sign In Callback for Android fallback (Web OAuth flow)
 *
 * This endpoint receives a POST request from Apple after a user completes
 * the sign-in flow in the browser (on Android). It must return an HTML
 * page that performs a redirect back to the app using an Intent.
 *
 * @see https://pub.dev/packages/sign_in_with_apple#android
 */
const appleCallback = catchAsync(async (req: Request, res: Response) => {
  // Apple sends data in req.body via POST. Manual testing might use req.query via GET.
  const { code, id_token, state, user } = { ...req.query, ...req.body } as any;

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
  const androidPackageName = config.googlePlay.packageName;
  
  if (!androidPackageName) {
    console.warn('⚠️ WARNING: GOOGLE_PLAY_PACKAGE_NAME is not set in .env! Intent redirect may fail.');
  }

  // The state is REQUIRED by the Flutter sign_in_with_apple package.
  // If it's missing from Apple, we have a problem.
  const finalState = state || '';

  const redirectUrl = `intent://callback?code=${code || ''}&id_token=${id_token || ''}&state=${finalState}${
    user ? `&user=${encodeURIComponent(user)}` : ''
  }#Intent;package=${androidPackageName || 'com.tbsosick.smrtscrub'};scheme=signinwithapple;end;`;

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
});

export const AuthController = {
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
