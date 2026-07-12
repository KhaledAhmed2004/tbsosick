import admin from 'firebase-admin';
import config from '../../config';

/**
 * Lazily initialises Firebase Admin SDK on first use.
 * Guards against double-initialisation (e.g. hot reload / test suites).
 * Throws a descriptive error if the key is missing or malformed so the
 * server startup log is actionable rather than cryptic.
 */
export const getFirebaseApp = (): admin.app.App => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const raw = config.firebase_api_key_base64;
  if (!raw) {
    throw new Error(
      '[firebase] firebase_api_key_base64 is not set in config. Firebase services are disabled.',
    );
  }

  let serviceAccount: admin.ServiceAccount;
  try {
    serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    throw new Error(
      '[firebase] firebase_api_key_base64 is not valid Base64-encoded JSON.',
    );
  }

  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
};
