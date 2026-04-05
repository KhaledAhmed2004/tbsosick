"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskCompleted = void 0;
exports.taskCompleted = {
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
exports.default = exports.taskCompleted;
