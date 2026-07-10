import { EmailBuilder } from '../app/builder/EmailBuilder/EmailBuilder';
import config from '../config';
import path from 'path';

type ICreateAccount = {
  name: string;
  email: string;
  otp: string;
};

type IResetPassword = {
  email: string;
  otp: string;
};

const createAccount = (values: ICreateAccount) => {
  const builder = new EmailBuilder();

  builder
    .setSubject(`Verify your ${config.app.name} account`)
    .addComponent('header', {
      title: `Welcome to ${config.app.name}, ${values.name}!`,
      subtitle: `Thank you for joining ${config.app.name}!`
    })
    .addText('To complete your account setup, please use the verification code below:')
    .addComponent('otp', { code: values.otp, expiresIn: '3 minutes' })
    .addDivider()
    .addText(`This is an automated security notification from ${config.app.name}. If you did not create an account with us, you can safely ignore this email.`, { fontSize: '12px', color: '#6B7280' });

  const { html, subject, attachments } = builder.build();

  return {
    to: values.email,
    subject,
    html,
    attachments
  };
};

const resetPassword = (values: IResetPassword) => {
  const builder = new EmailBuilder();

  builder
    .setSubject(`Reset your ${config.app.name} password`)
    .addComponent('header', {
      title: 'Password Reset Request',
      subtitle: 'We received a request to reset your password'
    })
    .addText('Use the following code to reset your password:')
    .addComponent('otp', { code: values.otp, expiresIn: '3 minutes' })
    .addComponent('card', {
      title: 'Didn\'t request this?',
      content: 'If you didn\'t request a password reset, you can safely ignore this email. Your password will remain unchanged.',
      variant: 'warning'
    })
    .addDivider();

  const { html, subject, attachments } = builder.build();

  return {
    to: values.email,
    subject,
    html,
    attachments
  };
};

export const emailTemplate = {
  createAccount,
  resetPassword,
};
