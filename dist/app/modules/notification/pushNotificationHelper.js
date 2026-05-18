"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotificationHelper = void 0;
const logger_1 = require("../../../shared/logger");
const config_1 = __importDefault(require("../../../config"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
/**
 * Lazily initialises Firebase Admin SDK on first use.
 * Guards against double-initialisation (e.g. hot reload / test suites).
 * Throws a descriptive error if the key is missing or malformed so the
 * server startup log is actionable rather than cryptic.
 */
const getFirebaseApp = () => {
    if (firebase_admin_1.default.apps.length > 0) {
        return firebase_admin_1.default.app();
    }
    const raw = config_1.default.firebase_api_key_base64;
    if (!raw) {
        throw new Error('[pushNotificationHelper] firebase_api_key_base64 is not set in config. Push notifications are disabled.');
    }
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    }
    catch (_a) {
        throw new Error('[pushNotificationHelper] firebase_api_key_base64 is not valid Base64-encoded JSON.');
    }
    return firebase_admin_1.default.initializeApp({ credential: firebase_admin_1.default.credential.cert(serviceAccount) });
};
// Multiple users — multicast
const sendPushNotifications = (values) => __awaiter(void 0, void 0, void 0, function* () {
    const app = getFirebaseApp();
    const res = yield firebase_admin_1.default.messaging(app).sendEachForMulticast(values);
    logger_1.logger.info(`[Firebase] Push multicast completed: Success=${res.successCount}, Failure=${res.failureCount}`);
    if (res.failureCount > 0) {
        res.responses.forEach((resp, idx) => {
            var _a, _b;
            if (!resp.success) {
                logger_1.logger.error(`[Firebase] Token at index ${idx} failed to send: ${(_a = resp.error) === null || _a === void 0 ? void 0 : _a.message} (Code: ${(_b = resp.error) === null || _b === void 0 ? void 0 : _b.code})`);
            }
        });
    }
    return res;
});
// Single user
const sendPushNotification = (values) => __awaiter(void 0, void 0, void 0, function* () {
    const app = getFirebaseApp();
    const res = yield firebase_admin_1.default.messaging(app).send(values);
    logger_1.logger.info('Push notification sent', { messageId: res });
});
exports.pushNotificationHelper = {
    sendPushNotifications,
    sendPushNotification,
};
