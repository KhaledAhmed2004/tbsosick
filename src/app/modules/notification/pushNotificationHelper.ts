import { logger } from '../../../shared/logger';
import config from '../../../config';
import admin from 'firebase-admin';

/**
 * Lazily initialises Firebase Admin SDK on first use.
 * Guards against double-initialisation (e.g. hot reload / test suites).
 * Throws a descriptive error if the key is missing or malformed so the
 * server startup log is actionable rather than cryptic.
 */
const getFirebaseApp = (): admin.app.App => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const raw = config.firebase_api_key_base64;
  if (!raw) {
    throw new Error(
      '[pushNotificationHelper] firebase_api_key_base64 is not set in config. Push notifications are disabled.',
    );
  }

  let serviceAccount: admin.ServiceAccount;
  try {
    serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    throw new Error(
      '[pushNotificationHelper] firebase_api_key_base64 is not valid Base64-encoded JSON.',
    );
  }

  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
};

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
