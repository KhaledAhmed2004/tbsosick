"use strict";
/**
 * Order Shipped Notification Template
 *
 * Sent when an order is shipped.
 *
 * @variables
 * - orderNumber: Order number/ID
 * - orderId: Order database ID
 * - trackingUrl: Tracking URL
 * - trackingNumber: Tracking number (optional)
 * - estimatedDelivery: Estimated delivery date
 * - carrierName: Shipping carrier name (optional)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderShipped = void 0;
exports.orderShipped = {
    name: 'orderShipped',
    push: {
        title: '📦 Order Shipped!',
        body: 'Your order {{orderNumber}} is on its way!',
        data: {
            type: 'ORDER_SHIPPED',
            orderId: '{{orderId}}',
            trackingUrl: '{{trackingUrl}}',
            action: 'TRACK_ORDER',
        },
    },
    socket: {
        event: 'ORDER_UPDATE',
        data: {
            type: 'ORDER_SHIPPED',
            status: 'SHIPPED',
            orderId: '{{orderId}}',
            orderNumber: '{{orderNumber}}',
            trackingUrl: '{{trackingUrl}}',
            estimatedDelivery: '{{estimatedDelivery}}',
        },
    },
    email: {
        template: 'orderShipped',
        subject: '📦 Your Order {{orderNumber}} Has Shipped!',
    },
    database: {
        type: 'ORDER',
        title: 'Order Shipped',
        text: 'Your order {{orderNumber}} has been shipped. Track: {{trackingUrl}}',
    },
};
exports.default = exports.orderShipped;
