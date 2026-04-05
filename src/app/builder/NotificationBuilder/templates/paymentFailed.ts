/**
 * Payment Failed Notification Template
 *
 * Sent when a payment fails.
 *
 * @variables
 * - amount: Payment amount (formatted)
 * - orderId: Related order ID
 * - orderNumber: Order number
 * - reason: Failure reason
 * - retryUrl: URL to retry payment
 */

import { INotificationTemplate } from '../NotificationBuilder';

export const paymentFailed: INotificationTemplate = {
  name: 'paymentFailed',

  push: {
    title: '❌ Payment Failed',
    body: 'Your payment of {{amount}} for order {{orderNumber}} failed.',
    data: {
      type: 'PAYMENT_FAILED',
      orderId: '{{orderId}}',
      action: 'RETRY_PAYMENT',
    },
  },

  // No socket for payment failures (sensitive)
  socket: undefined,

  email: {
    template: 'paymentFailed',
    subject: '❌ Payment Failed - Order {{orderNumber}}',
  },

  database: {
    type: 'PAYMENT_PENDING',
    title: 'Payment Failed',
    text: 'Payment of {{amount}} for order {{orderNumber}} failed. Reason: {{reason}}',
  },
};

export default paymentFailed;
