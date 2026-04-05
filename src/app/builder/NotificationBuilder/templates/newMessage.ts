/**
 * New Message Notification Template
 *
 * Sent when a user receives a new chat message.
 *
 * @variables
 * - senderName: Name of the message sender
 * - senderAvatar: Avatar URL of sender (optional)
 * - preview: Message preview text
 * - chatId: Chat/conversation ID
 * - messageId: Message ID
 */

import { INotificationTemplate } from '../NotificationBuilder';

export const newMessage: INotificationTemplate = {
  name: 'newMessage',

  push: {
    title: '💬 {{senderName}}',
    body: '{{preview}}',
    data: {
      type: 'NEW_MESSAGE',
      chatId: '{{chatId}}',
      messageId: '{{messageId}}',
      action: 'OPEN_CHAT',
    },
  },

  socket: {
    event: 'NEW_MESSAGE',
    data: {
      type: 'NEW_MESSAGE',
      chatId: '{{chatId}}',
      messageId: '{{messageId}}',
      senderName: '{{senderName}}',
      preview: '{{preview}}',
    },
  },

  // No email for chat messages (too frequent)
  email: undefined,

  database: {
    type: 'MESSAGE',
    title: 'New message from {{senderName}}',
    text: '{{preview}}',
  },
};

export default newMessage;
