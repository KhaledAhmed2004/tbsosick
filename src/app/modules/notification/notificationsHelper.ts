import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import { User } from '../user/user.model';
import { pushNotificationHelper } from './pushNotificationHelper';

export const sendNotifications = async (data: Partial<INotification>): Promise<INotification> => {
  // Set default expiry to 30 days if not provided
  if (!data.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    data.expiresAt = expiryDate;
  }

  const result = await Notification.create(data);

  const user = await User.findById(data?.userId);

  // Check if user has device tokens and the array is not empty
  if (
    user?.deviceTokens &&
    Array.isArray(user.deviceTokens) &&
    user.deviceTokens.length > 0
  ) {
    const message = {
      notification: {
        title: data?.title || 'TBSosick Notification',
        body: data?.subtitle || data?.title || '',
      },
      tokens: user.deviceTokens,
    };

    try {
      await pushNotificationHelper.sendPushNotifications(message);
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  //@ts-ignore
  const socketIo = global.io;
  if (socketIo) {
    socketIo.emit(`get-notification::${data?.userId}`, result);
  }

  return result;
};

