"use strict";
/**
 * Order Delivered Notification Template
 *
 * Sent when an order is delivered.
 *
 * @variables
 * - orderNumber: Order number/ID
 * - orderId: Order database ID
 * - deliveredAt: Delivery timestamp
 * - reviewUrl: URL to leave a review (optional)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderDelivered = void 0;
exports.orderDelivered = {
    name: 'orderDelivered',
    push: {
        title: '✅ Order Delivered!',
        body: 'Your order {{orderNumber}} has been delivered.',
        data: {
            type: 'ORDER_DELIVERED',
            orderId: '{{orderId}}',
            action: 'VIEW_ORDER',
        },
    },
    socket: {
        event: 'ORDER_UPDATE',
        data: {
            type: 'ORDER_DELIVERED',
            status: 'DELIVERED',
            orderId: '{{orderId}}',
            orderNumber: '{{orderNumber}}',
            deliveredAt: '{{deliveredAt}}',
        },
    },
    email: {
        template: 'orderDelivered',
        subject: '✅ Your Order {{orderNumber}} Has Been Delivered!',
    },
    database: {
        type: 'ORDER',
        title: 'Order Delivered',
        text: 'Your order {{orderNumber}} has been delivered. Enjoy!',
    },
};
exports.default = exports.orderDelivered;
