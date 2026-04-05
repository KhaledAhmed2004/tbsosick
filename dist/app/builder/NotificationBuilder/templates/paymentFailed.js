"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentFailed = void 0;
exports.paymentFailed = {
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
exports.default = exports.paymentFailed;
