import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
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
  IVerifyEmail,
} from '../../../types/auth';
import cryptoToken from '../../../util/cryptoToken';
import generateOTP from '../../../util/generateOTP';
import { ResetToken } from './resetToken/resetToken.model';
import { User } from '../user/user.model';
import { USER_STATUS } from '../../../enums/user';
import { OTP_TTL_MS, RESET_TOKEN_TTL_MS } from '../../../config/auth.constants';

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

  if (isExistUser.status === USER_STATUS.DELETE) {
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
      id: isExistUser._id,
      role: isExistUser.role,
      email: isExistUser.email,
      tokenVersion: isExistUser.tokenVersion,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  // JWT: refresh token
  const refreshToken = jwtHelper.createToken(
    {
      id: isExistUser._id,
      role: isExistUser.role,
      email: isExistUser.email,
      tokenVersion: isExistUser.tokenVersion,
    },
    config.jwt.jwt_refresh_secret as Secret,
    config.jwt.jwt_refresh_expire_in as string
  );

  if (isExistUser.isFirstLogin) {
    await User.findByIdAndUpdate(isExistUser._id, { isFirstLogin: false });
  }

  // ✅ save device token
  if (deviceToken) {
    await User.addDeviceToken(isExistUser._id.toString(), deviceToken);
  }

  return { tokens: { accessToken, refreshToken } };
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
    { email, status: { $ne: USER_STATUS.DELETE } },
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
    status: { $ne: USER_STATUS.DELETE },
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
        id: isExistUser._id,
        role: isExistUser.role,
        email: isExistUser.email,
        tokenVersion: isExistUser.tokenVersion,
      },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string
    );

    const refreshToken = jwtHelper.createToken(
      {
        id: isExistUser._id,
        role: isExistUser.role,
        email: isExistUser.email,
        tokenVersion: isExistUser.tokenVersion,
      },
      config.jwt.jwt_refresh_secret as Secret,
      config.jwt.jwt_refresh_expire_in as string
    );

    tokens = { accessToken, refreshToken };
    message = 'Email verify successfully';
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
    status: { $ne: USER_STATUS.DELETE },
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

  await User.findOneAndUpdate(
    { _id: user.id },
    { password: hashPassword },
    { new: true }
  );
};

const resendVerifyEmailToDB = async (email: string) => {
  return sendVerificationOTP(email);
};

// Google OAuth login
const googleLoginToDB = async (user: any) => {
  // Check if user exists and is active
  if (!user) {
    console.error('❌ No user provided to googleLoginToDB');
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Google authentication failed!'
    );
  }

  // Check user status
  if (user.status === USER_STATUS.DELETE) {
    console.error('❌ User account is deleted');
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Your account has been deactivated. Contact support.'
    );
  }

  // Create JWT token
  const createToken = jwtHelper.createToken(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  console.log('✅ JWT token created successfully');

  return { createToken };
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

  if (user.status === USER_STATUS.DELETE) {
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
      id: updatedUser._id,
      role: updatedUser.role,
      email: updatedUser.email,
      tokenVersion: updatedUser.tokenVersion,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  const newRefreshToken = jwtHelper.createToken(
    {
      id: updatedUser._id,
      role: updatedUser.role,
      email: updatedUser.email,
      tokenVersion: updatedUser.tokenVersion,
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
  googleLoginToDB,
  refreshTokenToDB,
};
