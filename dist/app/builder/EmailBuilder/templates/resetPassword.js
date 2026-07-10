"use strict";
/**
 * Password Reset Email Template - Toothlens Branded
 *
 * Sent when a user requests to reset their password.
 *
 * @variables
 * - otp: OTP code
 *
 * @example
 * ```typescript
 * const html = new EmailBuilder()
 *   .useTemplate('resetPassword', {
 *     otp: '123456'
 *   })
 *   .build();
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = void 0;
exports.resetPassword = {
    subject: 'Reset your password',
    render: (variables) => {
        const { otp } = variables;
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9f9f9;">
    <tr>
      <td align="center" style="padding: 50px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 20px;">
              <div style="text-align: center;">
                <img src="https://i.postimg.cc/6pgNvKhD/logo.png" alt="Toothlens Logo" style="display: block; margin: 0 auto 20px; width: 150px;" />
                <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your single use code is:</p>
                <div style="background-color: #277E16; width: 80px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${otp}</div>
                <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This code is valid for 3 minutes.</p>
                <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px; text-align: left;">If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
    },
};
exports.default = exports.resetPassword;
