import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
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

  // The sign_in_with_apple package expects the redirect to follow this pattern:
  // intent://callback?code=${code}&id_token=${id_token}&state=${state}&user=${user}#Intent;package=${android_package_name};scheme=signinwithapple;end;

  const androidPackageName = 'com.tbsosick.smrtscrub';

  const redirectUrl = `intent://callback?code=${code}&id_token=${id_token}&state=${state}${
    user ? `&user=${encodeURIComponent(user)}` : ''
  }#Intent;package=${androidPackageName};scheme=signinwithapple;end;`;

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Redirecting to App...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f4f4f7; color: #333; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #000; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h1 { font-size: 1.2rem; margin: 0; }
          p { color: #666; font-size: 0.9rem; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <h1>Authenticating...</h1>
        <p>Returning you to the SMRTSCRUB app</p>
        <script>
          // Small delay to ensure the UI is visible before redirecting
          setTimeout(() => {
            window.location.href = "${redirectUrl}";
          }, 500);
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
