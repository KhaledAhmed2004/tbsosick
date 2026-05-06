import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { sendVerificationOTP } from '../../../helpers/authHelpers';
import { emailHelper } from '../../../helpers/emailHelper';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import {
  IAuthResetPassword,
  IChangePassword,
  ILoginData,
  ISocialLogin,
  IVerifyEmail,
} from '../../../types/auth';
import cryptoToken from '../../../util/cryptoToken';
import generateOTP from '../../../util/generateOTP';
import { ResetToken } from './resetToken/resetToken.model';
import { User } from '../user/user.model';
import { USER_STATUS } from '../../../enums/user';
import { OTP_TTL_MS, RESET_TOKEN_TTL_MS } from '../../../config/auth.constants';

const googleClient = new OAuth2Client();

// All valid Google client IDs — iOS, Android, Web each get a separate one.
// verifyIdToken accepts an array; token is valid if aud matches ANY of them.
const googleAudience = [
  config.google.clientIdIos,
  config.google.clientIdAndroid,
  config.google.clientIdWeb,
].filter(Boolean);

const loginUserFromDB = async (
  payload: ILoginData & { deviceToken?: string }
) => {
  const { email, password, deviceToken } = payload;
  // `tokenVersion` is `select: false` on the schema — pull it explicitly
  // here so the issued JWT carries the current rotation counter.
  const isExistUser = await User.findOne({ email }).select('+password +tokenVersion');
  if (!isExistUser) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  if (isExistUser.status === USER_STATUS.DELETED) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Your account has been deleted. Contact support.'
    );
  }

  if (isExistUser.status === USER_STATUS.RESTRICTED) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Your account is restricted. Contact support.'
    );
  }

  if (isExistUser.status === USER_STATUS.INACTIVE) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Your account is inactive. Please activate it or contact support.'
    );
  }

  if (!isExistUser.verified) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Please verify your account, then try to login again'
    );
  }

  if (!password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is required!');
  }

  if (!(await User.isMatchPassword(password, isExistUser.password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  // JWT: access token
  const accessToken = jwtHelper.createToken(
    {
      id: isExistUser._id.toString(),
      role: isExistUser.role,
      email: isExistUser.email,
      tokenVersion: isExistUser.tokenVersion ?? 0,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  // JWT: refresh token
  const refreshToken = jwtHelper.createToken(
    {
      id: isExistUser._id.toString(),
      role: isExistUser.role,
      email: isExistUser.email,
      tokenVersion: isExistUser.tokenVersion ?? 0,
    },
    config.jwt.jwt_refresh_secret as Secret,
    config.jwt.jwt_refresh_expire_in as string
  );

  const isOnboardingCompleted = isExistUser.isOnboardingCompleted;

  // ✅ save device token
  if (deviceToken) {
    await User.addDeviceToken(isExistUser._id.toString(), deviceToken);
  }

  return { tokens: { accessToken, refreshToken }, isOnboardingCompleted };
};

// logout
const logoutUserFromDB = async (user: JwtPayload, deviceToken: string) => {
  if (!deviceToken) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Device token is required');
  }

  await User.removeDeviceToken(user.id, deviceToken);
};

//forget password
const forgetPasswordToDB = async (email: string) => {
  const isExistUser = await User.findOne({ email });

  // Silent success: if user doesn't exist, don't throw error
  if (!isExistUser) {
    return;
  }

  // Clear any existing reset tokens for this user (invalidate old requests)
  await ResetToken.deleteMany({ user: isExistUser._id });

  //send mail
  const otp = generateOTP();
  const value = {
    otp,
    email: isExistUser.email,
  };
  console.log('Sending email to:', isExistUser.email, 'with OTP:', otp);
  const forgetPassword = emailTemplate.resetPassword(value);
  emailHelper.sendEmail(forgetPassword);

  //save to DB (atomic update for OTP)
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + OTP_TTL_MS),
  };
  await User.findOneAndUpdate(
    { email, status: { $ne: USER_STATUS.DELETED } },
    { $set: { authentication } }
  );
};

//verify email
const verifyEmailToDB = async (payload: IVerifyEmail) => {
  const { email, otp } = payload;

  if (!otp) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP is required');
  }

  // Atomic find and update to prevent race conditions (double-submit)
  // We use current time in query to ensure the OTP is still valid
  const filter = {
    email,
    'authentication.oneTimeCode': otp,
    'authentication.expireAt': { $gt: new Date() },
    status: { $ne: USER_STATUS.DELETED },
  };

  const isExistUser = await User.findOne(filter).select('+authentication +tokenVersion');

  if (!isExistUser) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid or expired verification code'
    );
  }

  let message;
  let data;
  let tokens;

  if (!isExistUser.verified) {
    // Mark as verified and clear OTP
    const isOnboardingCompleted = isExistUser.isOnboardingCompleted;
    await User.findOneAndUpdate(
      { _id: isExistUser._id },
      {
        $set: {
          verified: true,
          'authentication.oneTimeCode': null,
          'authentication.expireAt': null,
        },
      }
    );

    // Auto-login for new users after verification
    const accessToken = jwtHelper.createToken(
      {
        id: isExistUser._id.toString(),
        role: isExistUser.role,
        email: isExistUser.email,
        tokenVersion: isExistUser.tokenVersion ?? 0,
      },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string
    );

    const refreshToken = jwtHelper.createToken(
      {
        id: isExistUser._id.toString(),
        role: isExistUser.role,
        email: isExistUser.email,
        tokenVersion: isExistUser.tokenVersion ?? 0,
      },
      config.jwt.jwt_refresh_secret as Secret,
      config.jwt.jwt_refresh_expire_in as string
    );

    tokens = { accessToken, refreshToken };
    message = 'Email verify successfully';
    return { data: { ...tokens, isOnboardingCompleted }, message, tokens };
  } else {
    // For password reset flow
    await User.findOneAndUpdate(
      { _id: isExistUser._id },
      {
        $set: {
          'authentication.isResetPassword': true,
          'authentication.oneTimeCode': null,
          'authentication.expireAt': null,
        },
      }
    );

    //create token ;
    const createToken = cryptoToken();
    await ResetToken.create({
      user: isExistUser._id,
      token: createToken,
      expireAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    message =
      'Verification Successful: Please securely store and utilize this code for reset password';
    data = { resetToken: createToken };
  }
  return { data, message, tokens };
};

//reset password
const resetPasswordToDB = async (
  token: string,
  payload: IAuthResetPassword
) => {
  const { newPassword } = payload;

  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Reset token is required');
  }

  // Use a transaction or atomic approach:
  // Find valid token and its user in one go
  const isExistToken = await ResetToken.findOne({
    token,
    expireAt: { $gt: new Date() },
  });

  if (!isExistToken) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Invalid or expired reset token'
    );
  }

  // Check user permission (one-time flag)
  const isExistUser = await User.findOne({
    _id: isExistToken.user,
    'authentication.isResetPassword': true,
    status: { $ne: USER_STATUS.DELETED },
  }).select('+authentication');

  if (!isExistUser) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Invalid request or session. Please click 'Forgot Password' again."
    );
  }

  // Hash new password
  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  // Update user AND increment tokenVersion to invalidate all existing sessions
  // Also clear the reset flag atomically
  await User.findOneAndUpdate(
    { _id: isExistUser._id },
    {
      $set: {
        password: hashPassword,
        'authentication.isResetPassword': false,
      },
      $inc: { tokenVersion: 1 },
    }
  );

  // Delete the used token immediately
  await ResetToken.deleteOne({ _id: isExistToken._id });

  // Optional: Invalidate all other reset tokens for this user
  await ResetToken.deleteMany({ user: isExistUser._id });
};

const changePasswordToDB = async (
  user: JwtPayload,
  payload: IChangePassword
) => {
  const { currentPassword, newPassword } = payload;
  const isExistUser = await User.findById(user.id).select('+password');
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //current password match
  if (
    currentPassword &&
    !(await User.isMatchPassword(currentPassword, isExistUser.password))
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect');
  }

  //newPassword and current password
  if (currentPassword === newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please give different password from current password'
    );
  }

  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  // Update user AND increment tokenVersion to invalidate all existing sessions
  // Also clear the reset flag atomically
  await User.findOneAndUpdate(
    { _id: user.id },
    {
      $set: { password: hashPassword },
      $inc: { tokenVersion: 1 },
    },
    { new: true }
  );
};

const resendVerifyEmailToDB = async (email: string) => {
  return sendVerificationOTP(email);
};

// Social login (Google / Apple ID token verification)
const socialLoginToDB = async (payload: ISocialLogin) => {
  const { provider, idToken, nonce, deviceToken, platform, appVersion } = payload;

  let email: string | undefined;
  let name: string | undefined;
  let providerId: string;

  if (provider === 'google') {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleAudience,
    });
    const tokenPayload = ticket.getPayload();
    if (!tokenPayload || !tokenPayload.email) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Invalid Google ID token'
      );
    }

    // Reject tokens where Google has not verified the email. Prevents an
    // attacker from minting tokens for arbitrary unverified addresses.
    if (!tokenPayload.email_verified) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Google account email is not verified',
      );
    }

    // Nonce replay protection: Google echoes the raw nonce in the token
    // when the client passes it to the SDK. Flutter's google_sign_in
    // plugin doesn't expose nonce, so we only enforce the check if the
    // client actually sent one.
    if (nonce && tokenPayload.nonce !== nonce) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Nonce mismatch');
    }

    email = tokenPayload.email;
    name = tokenPayload.name || email.split('@')[0];
    providerId = tokenPayload.sub;
  } else {
    // Apple — nonce is mandatory (Apple best practice + plugin supports it)
    if (!nonce) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Nonce is required for Apple sign-in',
      );
    }

    const applePayload = await appleSignin.verifyIdToken(idToken, {
      audience: config.apple_client_id,
      ignoreExpiration: false,
    });
    if (!applePayload.sub) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Invalid Apple ID token'
      );
    }

    // Apple puts SHA256(nonce) in the token — hash the client-provided
    // raw nonce and compare.
    const expectedHash = crypto
      .createHash('sha256')
      .update(nonce)
      .digest('hex');
    if (applePayload.nonce !== expectedHash) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Nonce mismatch');
    }

    email = applePayload.email;
    providerId = applePayload.sub;
    name = email ? email.split('@')[0] : 'Apple User';
  }

  // Find user strictly by provider ID. Matching on email here would let an
  // attacker who controls a provider account with the same email address
  // hijack a local/password account — see OWASP "Account Linking" guidance.
  const providerField = provider === 'google' ? 'googleId' : 'appleId';
  let user = await User.findOne({ [providerField]: providerId }).select(
    '+tokenVersion'
  );

  if (user) {
    // Status checks
    if (user.status === USER_STATUS.DELETED) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Your account has been deleted. Contact support.'
      );
    }
    if (user.status === USER_STATUS.RESTRICTED) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Your account is restricted. Contact support.'
      );
    }
  } else {
    // No user linked to this provider identity. If the email already
    // belongs to another account, refuse to auto-link — the user must
    // authenticate with that account first and link the provider
    // explicitly from a settings flow.
    if (email) {
      const existingByEmail = await User.findOne({ email });
      if (existingByEmail) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          'An account with this email already exists. Please sign in with your password and link your social account from settings.',
        );
      }
    }
    // Create new user
    if (!email) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Email is required to create an account. Please allow email sharing.'
      );
    }

    user = await User.create({
      name,
      email,
      verified: true,
      [providerField]: providerId,
    });

    // Re-fetch with tokenVersion
    user = await User.findById(user._id).select('+tokenVersion');
    if (!user) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create user');
    }
  }

  const isOnboardingCompleted = user.isOnboardingCompleted;

  // Register device token
  if (deviceToken) {
    await User.addDeviceToken(
      user._id.toString(),
      deviceToken,
      platform,
      appVersion,
    );
  }

  // Issue tokens
  const accessToken = jwtHelper.createToken(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion ?? 0,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  const refreshToken = jwtHelper.createToken(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion ?? 0,
    },
    config.jwt.jwt_refresh_secret as Secret,
    config.jwt.jwt_refresh_expire_in as string
  );

  return { tokens: { accessToken, refreshToken }, isOnboardingCompleted };
};

// Refresh token: verify and issue new tokens with rotation
const refreshTokenToDB = async (token: string) => {
  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Refresh token is required');
  }

  // Verify the refresh token
  const decoded = jwtHelper.verifyToken(
    token,
    config.jwt.jwt_refresh_secret as Secret
  );

  const userId = decoded.id as string;
  const tokenVersion = decoded.tokenVersion as number;

  // Pull the hidden `tokenVersion` so we can compare against the
  // version baked into the refresh token.
  const user = await User.findById(userId).select('+tokenVersion');
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  if (user.status === USER_STATUS.DELETED) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'User account is deleted');
  }

  // Reuse Detection: If the token version in the JWT doesn't match the DB version,
  // it means the token was already used (rotated) or invalidated.
  if (user.tokenVersion !== tokenVersion) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Refresh token expired or already used. Please login again.'
    );
  }

  // Increment tokenVersion in DB to invalidate ALL currently issued tokens
  // and ensure the new ones are unique.
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { tokenVersion: 1 } },
    { new: true }
  );

  if (!updatedUser) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to rotate token');
  }

  // Issue new tokens with the NEW tokenVersion
  const accessToken = jwtHelper.createToken(
    {
      id: updatedUser._id.toString(),
      role: updatedUser.role,
      email: updatedUser.email,
      tokenVersion: updatedUser.tokenVersion ?? 0,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  const newRefreshToken = jwtHelper.createToken(
    {
      id: updatedUser._id.toString(),
      role: updatedUser.role,
      email: updatedUser.email,
      tokenVersion: updatedUser.tokenVersion ?? 0,
    },
    config.jwt.jwt_refresh_secret as Secret,
    config.jwt.jwt_refresh_expire_in as string
  );

  return { tokens: { accessToken, refreshToken: newRefreshToken } };
};

export const AuthService = {
  verifyEmailToDB,
  loginUserFromDB,
  forgetPasswordToDB,
  resetPasswordToDB,
  changePasswordToDB,
  resendVerifyEmailToDB,
  logoutUserFromDB,
  socialLoginToDB,
  refreshTokenToDB,
};
