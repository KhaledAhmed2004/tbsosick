export type IVerifyEmail = {
  email: string;
  otp: string;
};

export type ILoginData = {
  email: string;
  password: string;
};

export type IAuthResetPassword = {
  newPassword: string;
};

export type IChangePassword = {
  currentPassword: string;
  newPassword: string;
};
