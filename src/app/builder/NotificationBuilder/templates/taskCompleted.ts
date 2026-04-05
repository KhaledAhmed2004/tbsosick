/**
 * Task Completed Notification Template
 *
 * Sent when a task is marked as completed.
 *
 * @variables
 * - taskTitle: Title of the task
 * - taskId: Task database ID
 * - completedBy: Name of who completed it
 * - completedAt: Completion timestamp
 * - reviewUrl: URL to leave a review (optional)
 */

import { INotificationTemplate } from '../NotificationBuilder';

export const taskCompleted: INotificationTemplate = {
  name: 'taskCompleted',

  push: {
    title: '✅ Task Completed!',
    body: '"{{taskTitle}}" has been marked as completed.',
    data: {
      type: 'TASK_COMPLETED',
      taskId: '{{taskId}}',
      action: 'VIEW_TASK',
    },
  },

  socket: {
    event: 'TASK_UPDATE',
    data: {
      type: 'TASK_COMPLETED',
      status: 'COMPLETED',
      taskId: '{{taskId}}',
      taskTitle: '{{taskTitle}}',
      completedBy: '{{completedBy}}',
    },
  },

  email: {
    template: 'taskCompleted',
    subject: '✅ Task Completed - {{taskTitle}}',
  },

  database: {
    type: 'TASK',
    title: 'Task Completed',
    text: '"{{taskTitle}}" has been marked as completed by {{completedBy}}.',
  },
};

export default taskCompleted;
