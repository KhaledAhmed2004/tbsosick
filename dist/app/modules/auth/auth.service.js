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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const authHelpers_1 = require("../../../helpers/authHelpers");
const emailHelper_1 = require("../../../helpers/emailHelper");
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const cryptoToken_1 = __importDefault(require("../../../util/cryptoToken"));
const generateOTP_1 = __importDefault(require("../../../util/generateOTP"));
const resetToken_model_1 = require("./resetToken/resetToken.model");
const user_model_1 = require("../user/user.model");
const user_1 = require("../../../enums/user");
const auth_constants_1 = require("../../../config/auth.constants");
const loginUserFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, deviceToken } = payload;
    const isExistUser = yield user_model_1.User.findOne({ email }).select('+password');
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }
    if (isExistUser.status === user_1.USER_STATUS.DELETE) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Your account has been deleted. Contact support.');
    }
    if (isExistUser.status === user_1.USER_STATUS.RESTRICTED) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Your account is restricted. Contact support.');
    }
    if (isExistUser.status === user_1.USER_STATUS.INACTIVE) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Your account is inactive. Please activate it or contact support.');
    }
    if (!isExistUser.verified) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Please verify your account, then try to login again');
    }
    if (!password) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is required!');
    }
    if (!(yield user_model_1.User.isMatchPassword(password, isExistUser.password))) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }
    // JWT: access token
    const accessToken = jwtHelper_1.jwtHelper.createToken({
        id: isExistUser._id,
        role: isExistUser.role,
        email: isExistUser.email,
        tokenVersion: isExistUser.tokenVersion,
    }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    // JWT: refresh token
    const refreshToken = jwtHelper_1.jwtHelper.createToken({
        id: isExistUser._id,
        role: isExistUser.role,
        email: isExistUser.email,
        tokenVersion: isExistUser.tokenVersion,
    }, config_1.default.jwt.jwt_refresh_secret, config_1.default.jwt.jwt_refresh_expire_in);
    if (isExistUser.isFirstLogin) {
        yield user_model_1.User.findByIdAndUpdate(isExistUser._id, { isFirstLogin: false });
    }
    // ✅ save device token
    if (deviceToken) {
        yield user_model_1.User.addDeviceToken(isExistUser._id.toString(), deviceToken);
    }
    return { tokens: { accessToken, refreshToken } };
});
// logout
const logoutUserFromDB = (user, deviceToken) => __awaiter(void 0, void 0, void 0, function* () {
    if (!deviceToken) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Device token is required');
    }
    yield user_model_1.User.removeDeviceToken(user.id, deviceToken);
});
//forget password
const forgetPasswordToDB = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.findOne({ email });
    // Silent success: if user doesn't exist, don't throw error
    if (!isExistUser) {
        return;
    }
    // Clear any existing reset tokens for this user (invalidate old requests)
    yield resetToken_model_1.ResetToken.deleteMany({ user: isExistUser._id });
    //send mail
    const otp = (0, generateOTP_1.default)();
    const value = {
        otp,
        email: isExistUser.email,
    };
    console.log('Sending email to:', isExistUser.email, 'with OTP:', otp);
    const forgetPassword = emailTemplate_1.emailTemplate.resetPassword(value);
    emailHelper_1.emailHelper.sendEmail(forgetPassword);
    //save to DB (atomic update for OTP)
    const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + auth_constants_1.OTP_TTL_MS),
    };
    yield user_model_1.User.findOneAndUpdate({ email, status: { $ne: user_1.USER_STATUS.DELETE } }, { $set: { authentication } });
});
//verify email
const verifyEmailToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = payload;
    if (!otp) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'OTP is required');
    }
    // Atomic find and update to prevent race conditions (double-submit)
    // We use current time in query to ensure the OTP is still valid
    const filter = {
        email,
        'authentication.oneTimeCode': otp,
        'authentication.expireAt': { $gt: new Date() },
        status: { $ne: user_1.USER_STATUS.DELETE },
    };
    const isExistUser = yield user_model_1.User.findOne(filter).select('+authentication');
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid or expired verification code');
    }
    let message;
    let data;
    let tokens;
    if (!isExistUser.verified) {
        // Mark as verified and clear OTP
        yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, {
            $set: {
                verified: true,
                'authentication.oneTimeCode': null,
                'authentication.expireAt': null,
            },
        });
        // Auto-login for new users after verification
        const accessToken = jwtHelper_1.jwtHelper.createToken({
            id: isExistUser._id,
            role: isExistUser.role,
            email: isExistUser.email,
            tokenVersion: isExistUser.tokenVersion,
        }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
        const refreshToken = jwtHelper_1.jwtHelper.createToken({
            id: isExistUser._id,
            role: isExistUser.role,
            email: isExistUser.email,
            tokenVersion: isExistUser.tokenVersion,
        }, config_1.default.jwt.jwt_refresh_secret, config_1.default.jwt.jwt_refresh_expire_in);
        tokens = { accessToken, refreshToken };
        message = 'Email verify successfully';
    }
    else {
        // For password reset flow
        yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, {
            $set: {
                'authentication.isResetPassword': true,
                'authentication.oneTimeCode': null,
                'authentication.expireAt': null,
            },
        });
        //create token ;
        const createToken = (0, cryptoToken_1.default)();
        yield resetToken_model_1.ResetToken.create({
            user: isExistUser._id,
            token: createToken,
            expireAt: new Date(Date.now() + auth_constants_1.RESET_TOKEN_TTL_MS),
        });
        message =
            'Verification Successful: Please securely store and utilize this code for reset password';
        data = { resetToken: createToken };
    }
    return { data, message, tokens };
});
//reset password
const resetPasswordToDB = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { newPassword } = payload;
    // Use a transaction or atomic approach:
    // Find valid token and its user in one go
    const isExistToken = yield resetToken_model_1.ResetToken.findOne({
        token,
        expireAt: { $gt: new Date() },
    });
    if (!isExistToken) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid or expired reset token');
    }
    // Check user permission (one-time flag)
    const isExistUser = yield user_model_1.User.findOne({
        _id: isExistToken.user,
        'authentication.isResetPassword': true,
        status: { $ne: user_1.USER_STATUS.DELETE },
    }).select('+authentication');
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid request or session. Please click 'Forgot Password' again.");
    }
    // Hash new password
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    // Update user AND increment tokenVersion to invalidate all existing sessions
    // Also clear the reset flag atomically
    yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, {
        $set: {
            password: hashPassword,
            'authentication.isResetPassword': false,
        },
        $inc: { tokenVersion: 1 },
    });
    // Delete the used token immediately
    yield resetToken_model_1.ResetToken.deleteOne({ _id: isExistToken._id });
    // Optional: Invalidate all other reset tokens for this user
    yield resetToken_model_1.ResetToken.deleteMany({ user: isExistUser._id });
});
const changePasswordToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentPassword, newPassword } = payload;
    const isExistUser = yield user_model_1.User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //current password match
    if (currentPassword &&
        !(yield user_model_1.User.isMatchPassword(currentPassword, isExistUser.password))) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }
    //newPassword and current password
    if (currentPassword === newPassword) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please give different password from current password');
    }
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    yield user_model_1.User.findOneAndUpdate({ _id: user.id }, { password: hashPassword }, { new: true });
});
const resendVerifyEmailToDB = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, authHelpers_1.sendVerificationOTP)(email);
});
// Google OAuth login
const googleLoginToDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists and is active
    if (!user) {
        console.error('❌ No user provided to googleLoginToDB');
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Google authentication failed!');
    }
    // Check user status
    if (user.status === user_1.USER_STATUS.DELETE) {
        console.error('❌ User account is deleted');
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Your account has been deactivated. Contact support.');
    }
    // Create JWT token
    const createToken = jwtHelper_1.jwtHelper.createToken({ id: user._id, role: user.role, email: user.email }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    console.log('✅ JWT token created successfully');
    return { createToken };
});
// Refresh token: verify and issue new tokens with rotation
const refreshTokenToDB = (token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Refresh token is required');
    }
    // Verify the refresh token
    const decoded = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_refresh_secret);
    const userId = decoded.id;
    const tokenVersion = decoded.tokenVersion;
    const user = yield user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }
    if (user.status === user_1.USER_STATUS.DELETE) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'User account is deleted');
    }
    // Reuse Detection: If the token version in the JWT doesn't match the DB version,
    // it means the token was already used (rotated) or invalidated.
    if (user.tokenVersion !== tokenVersion) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Refresh token expired or already used. Please login again.');
    }
    // Increment tokenVersion in DB to invalidate ALL currently issued tokens
    // and ensure the new ones are unique.
    const updatedUser = yield user_model_1.User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true });
    if (!updatedUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to rotate token');
    }
    // Issue new tokens with the NEW tokenVersion
    const accessToken = jwtHelper_1.jwtHelper.createToken({
        id: updatedUser._id,
        role: updatedUser.role,
        email: updatedUser.email,
        tokenVersion: updatedUser.tokenVersion,
    }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    const newRefreshToken = jwtHelper_1.jwtHelper.createToken({
        id: updatedUser._id,
        role: updatedUser.role,
        email: updatedUser.email,
        tokenVersion: updatedUser.tokenVersion,
    }, config_1.default.jwt.jwt_refresh_secret, config_1.default.jwt.jwt_refresh_expire_in);
    return { tokens: { accessToken, refreshToken: newRefreshToken } };
});
exports.AuthService = {
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
