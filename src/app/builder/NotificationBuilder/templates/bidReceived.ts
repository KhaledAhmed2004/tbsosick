/**
 * Bid Received Notification Template
 *
 * Sent when someone places a bid on a task.
 *
 * @variables
 * - taskTitle: Title of the task
 * - taskId: Task database ID
 * - bidAmount: Bid amount (formatted)
 * - bidderName: Name of the bidder
 * - bidderRating: Bidder's rating (optional)
 * - bidMessage: Bid message preview (optional)
 * - bidId: Bid database ID
 */

import { INotificationTemplate } from '../NotificationBuilder';

export const bidReceived: INotificationTemplate = {
  name: 'bidReceived',

  push: {
    title: '🎯 New Bid Received!',
    body: '{{bidderName}} bid {{bidAmount}} on "{{taskTitle}}"',
    data: {
      type: 'BID_RECEIVED',
      taskId: '{{taskId}}',
      bidId: '{{bidId}}',
      action: 'VIEW_BID',
    },
  },

  socket: {
    event: 'BID_UPDATE',
    data: {
      type: 'BID_RECEIVED',
      taskId: '{{taskId}}',
      bidId: '{{bidId}}',
      bidderName: '{{bidderName}}',
      bidAmount: '{{bidAmount}}',
    },
  },

  // No email for bids (too frequent)
  email: undefined,

  database: {
    type: 'BID',
    title: 'New Bid Received',
    text: '{{bidderName}} bid {{bidAmount}} on "{{taskTitle}}"',
  },
};

export default bidReceived;
