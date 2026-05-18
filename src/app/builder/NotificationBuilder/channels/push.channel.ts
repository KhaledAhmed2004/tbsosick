/**
 * Push Channel - Firebase Cloud Messaging
 *
 * Sends push notifications via Firebase FCM to user devices.
 * Uses the existing pushNotificationHelper internally.
 */

import { pushNotificationHelper } from '../../../modules/notification/pushNotificationHelper';
import { logger } from '../../../../shared/logger';
import { User } from '../../../modules/user/user.model';

interface IDeviceTokenEntry {
  token: string;
  platform?: 'ios' | 'android' | 'web';
  appVersion?: string;
  lastSeenAt?: Date;
}

interface IUser {
  _id: any;
  deviceTokens?: IDeviceTokenEntry[];
}

interface PushContent {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
}

interface PushResult {
  sent: number;
  failed: string[];
}

/**
 * Send push notifications to users via Firebase FCM
 */
export const sendPush = async (
  users: IUser[],
  content: PushContent
): Promise<PushResult> => {
  const result: PushResult = { sent: 0, failed: [] };

  // Collect all valid device tokens
  const tokensWithUsers: { token: string; userId: string }[] = [];

  for (const user of users) {
    if (user.deviceTokens && Array.isArray(user.deviceTokens) && user.deviceTokens.length > 0) {
      for (const entry of user.deviceTokens) {
        // `deviceTokens` is now an array of sub-documents; pull the raw
        // token string out of each entry.
        if (entry?.token) {
          tokensWithUsers.push({ token: entry.token, userId: user._id.toString() });
        }
      }
    }
  }

  if (tokensWithUsers.length === 0) {
    logger.warn(`[Push Channel] Skipping push dispatch: None of the ${users.length} target users have any registered device tokens in the database.`);
    return { sent: users.length, failed: [] };
  }

  // Build FCM message
  const tokens = tokensWithUsers.map(t => t.token);

  const message: any = {
    notification: {
      title: content.title,
      body: content.body,
    },
    tokens,
  };

  // Add optional fields
  if (content.icon) {
    message.notification.icon = content.icon;
  }

  if (content.image) {
    message.notification.image = content.image;
  }

  if (content.data) {
    message.data = content.data;
  }

  try {
    // Use existing helper and get responses
    const fcmRes = await pushNotificationHelper.sendPushNotifications(message);
    logger.info(`[Push Channel] Successfully sent push message to ${tokens.length} device tokens.`);

    // Automatically clean up dead/unregistered tokens from the database
    if (fcmRes && fcmRes.failureCount > 0) {
      const deadTokensByUser: Record<string, string[]> = {};
      fcmRes.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            const entry = tokensWithUsers[idx];
            if (entry) {
              if (!deadTokensByUser[entry.userId]) {
                deadTokensByUser[entry.userId] = [];
              }
              deadTokensByUser[entry.userId].push(entry.token);
            }
          }
        }
      });

      const cleanupPromises = Object.entries(deadTokensByUser).map(async ([uId, deadTokens]) => {
        try {
          await User.findByIdAndUpdate(uId, {
            $pull: { deviceTokens: { token: { $in: deadTokens } } }
          });
          logger.warn(`[Push Channel] Garbage Collection: Cleaned up ${deadTokens.length} dead/unregistered tokens for User ${uId} from database.`);
        } catch (cleanupErr) {
          logger.error(`[Push Channel] Garbage Collection Failed for User ${uId}:`, cleanupErr);
        }
      });
      await Promise.all(cleanupPromises);
    }

    // Count unique users with tokens as sent
    const usersWithTokens = new Set(tokensWithUsers.map(t => t.userId));
    result.sent = usersWithTokens.size;

    // Users without tokens are also considered "sent" (nothing to send)
    const usersWithoutTokens = users.filter(
      u => !u.deviceTokens || u.deviceTokens.length === 0
    );
    result.sent += usersWithoutTokens.length;

  } catch (error) {
    logger.error('Push notification error:', { error });
    // Mark users with tokens as failed
    const usersWithTokens = new Set(tokensWithUsers.map(t => t.userId));
    result.failed = Array.from(usersWithTokens);

    // Users without tokens are still "sent"
    const usersWithoutTokens = users.filter(
      u => !u.deviceTokens || u.deviceTokens.length === 0
    );
    result.sent = usersWithoutTokens.length;
  }

  return result;
};

export default sendPush;
