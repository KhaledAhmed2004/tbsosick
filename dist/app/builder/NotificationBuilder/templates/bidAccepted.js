"use strict";
/**
 * Bid Accepted Notification Template
 *
 * Sent when a bid is accepted by the task poster.
 *
 * @variables
 * - taskTitle: Title of the task
 * - taskId: Task database ID
 * - bidAmount: Accepted bid amount (formatted)
 * - posterName: Name of the task poster
 * - bidId: Bid database ID
 * - startDate: Task start date (optional)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bidAccepted = void 0;
exports.bidAccepted = {
    name: 'bidAccepted',
    push: {
        title: '🎉 Bid Accepted!',
        body: 'Your bid of {{bidAmount}} on "{{taskTitle}}" was accepted!',
        data: {
            type: 'BID_ACCEPTED',
            taskId: '{{taskId}}',
            bidId: '{{bidId}}',
            action: 'VIEW_TASK',
        },
    },
    socket: {
        event: 'BID_UPDATE',
        data: {
            type: 'BID_ACCEPTED',
            taskId: '{{taskId}}',
            bidId: '{{bidId}}',
            bidAmount: '{{bidAmount}}',
            posterName: '{{posterName}}',
        },
    },
    email: {
        template: 'bidAccepted',
        subject: '🎉 Your Bid Was Accepted - {{taskTitle}}',
    },
    database: {
        type: 'BID_ACCEPTED',
        title: 'Bid Accepted',
        text: 'Your bid of {{bidAmount}} on "{{taskTitle}}" was accepted by {{posterName}}!',
    },
};
exports.default = exports.bidAccepted;
