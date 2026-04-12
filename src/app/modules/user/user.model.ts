import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES, USER_STATUS } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { IDeviceToken, IUser, UserModal } from './user.interface';

const DeviceTokenSchema = new Schema<IDeviceToken>(
  {
    token: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android', 'web'] },
    appVersion: { type: String },
    lastSeenAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (this: IUser) {
        // Password is not required for OAuth users (users with googleId)
        return !this.googleId;
      },
      minlength: 8,
      select: false, // hide password by default
    },
    location: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    dateOfBirth: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    specialty: {
      type: String,
      trim: true,
    },
    hospital: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
      default: 'https://i.ibb.co/z5YHLV9/profile.png',
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    deviceTokens: {
      type: [DeviceTokenSchema],
      default: [],
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    about: {
      type: String,
    },
    googleId: {
      type: String,
      sparse: true, // allows multiple null values but unique non-null values
    },
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: String,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
      },
      select: false, // hide auth info by default
    },
  },
  { timestamps: true },
);

//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email });
  return isExist;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//check user
userSchema.pre('save', async function (next) {
  //check user - exclude current user from email uniqueness check
  const isExist = await User.findOne({
    email: this.email,
    _id: { $ne: this._id }, // exclude current user
  });
  if (isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already exist!');
  }

  //password hash - only hash if password is provided (not for OAuth users)
  if (this.password) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcrypt_salt_rounds),
    );
  }
  next();
});

// ✅ add device token (upsert: refresh lastSeenAt / metadata if token already exists)
userSchema.statics.addDeviceToken = async (
  userId: string,
  token: string,
  platform?: 'ios' | 'android' | 'web',
  appVersion?: string,
) => {
  // Try to refresh metadata on an existing token first
  const updated = await User.findOneAndUpdate(
    { _id: userId, 'deviceTokens.token': token },
    {
      $set: {
        'deviceTokens.$.lastSeenAt': new Date(),
        ...(platform ? { 'deviceTokens.$.platform': platform } : {}),
        ...(appVersion ? { 'deviceTokens.$.appVersion': appVersion } : {}),
      },
    },
    { new: true },
  );
  if (updated) return updated;

  // Not present — push a new sub-document
  return await User.findByIdAndUpdate(
    userId,
    {
      $push: {
        deviceTokens: {
          token,
          platform,
          appVersion,
          lastSeenAt: new Date(),
        },
      },
    },
    { new: true },
  );
};

// ✅ remove device token (match the token field inside the sub-document)
userSchema.statics.removeDeviceToken = async (
  userId: string,
  token: string,
) => {
  return await User.findByIdAndUpdate(
    userId,
    { $pull: { deviceTokens: { token } } },
    { new: true },
  );
};

export const User = model<IUser, UserModal>('User', userSchema);
