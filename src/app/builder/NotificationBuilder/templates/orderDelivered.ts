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

import { INotificationTemplate } from '../NotificationBuilder';

export const orderDelivered: INotificationTemplate = {
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

export default orderDelivered;
