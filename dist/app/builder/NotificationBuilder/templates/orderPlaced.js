"use strict";
/**
 * Order Placed Notification Template
 *
 * Sent when a new order is placed.
 *
 * @variables
 * - orderNumber: Order number/ID
 * - orderId: Order database ID
 * - totalAmount: Order total amount
 * - itemCount: Number of items
 * - estimatedDelivery: Estimated delivery date (optional)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderPlaced = void 0;
exports.orderPlaced = {
    name: 'orderPlaced',
    push: {
        title: '🛒 Order Confirmed!',
        body: 'Your order {{orderNumber}} has been placed successfully.',
        data: {
            type: 'ORDER_PLACED',
            orderId: '{{orderId}}',
            action: 'VIEW_ORDER',
        },
    },
    socket: {
        event: 'ORDER_UPDATE',
        data: {
            type: 'ORDER_PLACED',
            status: 'PLACED',
            orderId: '{{orderId}}',
            orderNumber: '{{orderNumber}}',
            totalAmount: '{{totalAmount}}',
        },
    },
    email: {
        template: 'orderPlaced',
        subject: '🛒 Order Confirmed - {{orderNumber}}',
    },
    database: {
        type: 'ORDER',
        title: 'Order Confirmed',
        text: 'Your order {{orderNumber}} has been placed. Total: {{totalAmount}}',
    },
};
exports.default = exports.orderPlaced;
