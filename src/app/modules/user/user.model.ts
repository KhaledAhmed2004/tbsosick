import bcrypt from 'bcrypt';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES, USER_STATUS } from '../../../enums/user';
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
        // Password is not required for OAuth users
        return !this.googleId && !this.appleId;
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
      required: function (this: IUser) {
        return !this.googleId && !this.appleId;
      },
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
      required: function (this: IUser) {
        return !this.googleId && !this.appleId;
      },
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
    isOnboardingCompleted: {
      type: Boolean,
      default: false,
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
      sparse: true, // allows multiple null values
      unique: true, // but each non-null googleId must be unique — one Google account → one user
    },
    appleId: {
      type: String,
      sparse: true,
      unique: true,
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

// Index on the embedded device token field — makes the cross-user
// rebinding guard in `addDeviceToken` cheap even at scale.
userSchema.index({ 'deviceTokens.token': 1 });

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

// Hash password only when it has been set or changed. Email uniqueness
// is enforced by the `{ unique: true }` index on the email field — no
// manual `findOne` check is needed (the DB guarantees atomicity, which
// a "check then write" cannot). Duplicate-key errors are translated in
// the global error handler.
userSchema.pre('save', async function (next) {
  if (this.password && this.isModified('password')) {
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
  // Step 1: Cross-user rebinding guard. Same physical device can get
  // re-used by a different account (User A logs out → User B logs in on
  // the same phone). FCM sends back the same token. If User A still has
  // it, pushes meant for User A land on User B's device. Strip the token
  // from any other user before attaching it here.
  await User.updateMany(
    { _id: { $ne: userId }, 'deviceTokens.token': token },
    { $pull: { deviceTokens: { token } } },
  );

  // Step 2: Try to refresh metadata on an existing token first.
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

  // Step 3: Not present — push a new sub-document.
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
