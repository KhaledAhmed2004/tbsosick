import { Model } from 'mongoose';

export enum USER_ROLES {
  SUPER_ADMIN = 'SUPER_ADMIN',
  USER = 'USER',
}

export enum USER_STATUS {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  RESTRICTED = 'RESTRICTED',
  // Key renamed to `DELETED` (past-participle). Stored value stays
  // `'DELETE'` for DB backwards compatibility.
  DELETED = 'DELETE',
}

export type DevicePlatform = 'ios' | 'android' | 'web';

export type IDeviceToken = {
  token: string;
  platform?: DevicePlatform;
  appVersion?: string;
  lastSeenAt?: Date;
};

export type IUser = {
  name: string;
  role: USER_ROLES;
  email: string;
  password: string;
  location?: string;
  country: string;
  gender?: 'male' | 'female';
  dateOfBirth?: string;
  phone: string;
  specialty?: string;
  hospital?: string;
  profilePicture?: string;
  status: USER_STATUS;
  verified: boolean;
  isFirstLogin?: boolean;
  deviceTokens?: IDeviceToken[];
  about?: string;
  googleId?: string;
  appleId?: string;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: string;
    expireAt: Date;
  };
  tokenVersion?: number;
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;

  addDeviceToken(
    userId: string,
    token: string,
    platform?: DevicePlatform,
    appVersion?: string,
  ): Promise<IUser | null>;
  removeDeviceToken(userId: string, token: string): Promise<IUser | null>;
} & Model<IUser>;
