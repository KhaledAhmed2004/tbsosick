/**
 * Cart Abandoned Notification Template
 *
 * Sent when user abandons their cart (scheduled notification).
 *
 * @variables
 * - itemCount: Number of items in cart
 * - totalAmount: Cart total (formatted)
 * - cartUrl: URL to view cart
 * - topItemName: Name of top item in cart (optional)
 */

import { INotificationTemplate } from '../NotificationBuilder';

export const cartAbandoned: INotificationTemplate = {
  name: 'cartAbandoned',

  push: {
    title: '🛒 You left something behind!',
    body: 'You have {{itemCount}} items in your cart worth {{totalAmount}}',
    data: {
      type: 'CART_ABANDONED',
      action: 'VIEW_CART',
    },
  },

  // No socket for cart abandoned (scheduled notification)
  socket: undefined,

  email: {
    template: 'cartAbandoned',
    subject: '🛒 Don\'t forget your cart - {{itemCount}} items waiting!',
  },

  // No database entry for marketing notifications
  database: undefined,
};

export default cartAbandoned;
