"use strict";
/**
 * Payment Received Notification Template
 *
 * Sent when a payment is successfully received.
 *
 * @variables
 * - amount: Payment amount (formatted)
 * - orderId: Related order ID
 * - orderNumber: Order number
 * - paymentId: Payment ID
 * - paymentMethod: Payment method used
 * - buyerName: Name of the buyer (for seller notification)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentReceived = void 0;
exports.paymentReceived = {
    name: 'paymentReceived',
    push: {
        title: '💰 Payment Received!',
        body: 'You received {{amount}} for order {{orderNumber}}',
        data: {
            type: 'PAYMENT_RECEIVED',
            paymentId: '{{paymentId}}',
            orderId: '{{orderId}}',
            action: 'VIEW_PAYMENT',
        },
    },
    socket: {
        event: 'PAYMENT_UPDATE',
        data: {
            type: 'PAYMENT_RECEIVED',
            status: 'COMPLETED',
            paymentId: '{{paymentId}}',
            orderId: '{{orderId}}',
            amount: '{{amount}}',
        },
    },
    email: {
        template: 'paymentReceived',
        subject: '💰 Payment Received - {{amount}}',
    },
    database: {
        type: 'PAYMENT_PENDING',
        title: 'Payment Received',
        text: 'You received {{amount}} for order {{orderNumber}}',
    },
};
exports.default = exports.paymentReceived;
