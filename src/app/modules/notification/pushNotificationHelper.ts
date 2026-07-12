import { logger } from '../../../shared/logger';
import admin from 'firebase-admin';
import { getFirebaseApp } from '../../utils/firebase';

// Multiple users — multicast
const sendPushNotifications = async (values: admin.messaging.MulticastMessage): Promise<admin.messaging.BatchResponse> => {
  const app = getFirebaseApp();
  const res = await admin.messaging(app).sendEachForMulticast(values);
  logger.info(`[Firebase] Push multicast completed: Success=${res.successCount}, Failure=${res.failureCount}`);
  
  if (res.failureCount > 0) {
    res.responses.forEach((resp, idx) => {
      if (!resp.success) {
        logger.error(`[Firebase] Token at index ${idx} failed to send: ${resp.error?.message} (Code: ${resp.error?.code})`);
      }
    });
  }
  return res;
};

// Single user
const sendPushNotification = async (values: admin.messaging.Message): Promise<void> => {
  const app = getFirebaseApp();
  const res = await admin.messaging(app).send(values);
  logger.info('Push notification sent', { messageId: res });
};

export const pushNotificationHelper = {
  sendPushNotifications,
  sendPushNotification,
};
