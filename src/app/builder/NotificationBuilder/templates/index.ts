/**
 * Notification Template Exports
 *
 * All notification templates are exported from here.
 * To add a new template:
 * 1. Create a new file (e.g., myTemplate.ts)
 * 2. Export it here
 * 3. It will automatically be available in NotificationBuilder
 */

export { newMessage } from './newMessage';
export { orderPlaced } from './orderPlaced';
export { orderShipped } from './orderShipped';
export { orderDelivered } from './orderDelivered';
export { paymentReceived } from './paymentReceived';
export { paymentFailed } from './paymentFailed';
export { bidReceived } from './bidReceived';
export { bidAccepted } from './bidAccepted';
export { taskCompleted } from './taskCompleted';
export { welcome } from './welcome';
export { systemAlert } from './systemAlert';
export { cartAbandoned } from './cartAbandoned';

// Export template type for custom templates
export type { INotificationTemplate } from '../NotificationBuilder';
