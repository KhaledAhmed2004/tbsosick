"use strict";
/**
 * Push Channel - Firebase Cloud Messaging
 *
 * Sends push notifications via Firebase FCM to user devices.
 * Uses the existing pushNotificationHelper internally.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPush = void 0;
const pushNotificationHelper_1 = require("../../../modules/notification/pushNotificationHelper");
const logger_1 = require("../../../../shared/logger");
const user_model_1 = require("../../../modules/user/user.model");
/**
 * Send push notifications to users via Firebase FCM
 */
const sendPush = (users, content) => __awaiter(void 0, void 0, void 0, function* () {
    const result = { sent: 0, failed: [] };
    // Collect all valid device tokens
    const tokensWithUsers = [];
    for (const user of users) {
        if (user.deviceTokens && Array.isArray(user.deviceTokens) && user.deviceTokens.length > 0) {
            for (const entry of user.deviceTokens) {
                // `deviceTokens` is now an array of sub-documents; pull the raw
                // token string out of each entry.
                if (entry === null || entry === void 0 ? void 0 : entry.token) {
                    tokensWithUsers.push({ token: entry.token, userId: user._id.toString() });
                }
            }
        }
    }
    if (tokensWithUsers.length === 0) {
        logger_1.logger.warn(`[Push Channel] Skipping push dispatch: None of the ${users.length} target users have any registered device tokens in the database.`);
        return { sent: users.length, failed: [] };
    }
    // Build FCM message
    const tokens = tokensWithUsers.map(t => t.token);
    const message = {
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
        const fcmRes = yield pushNotificationHelper_1.pushNotificationHelper.sendPushNotifications(message);
        logger_1.logger.info(`[Push Channel] Successfully sent push message to ${tokens.length} device tokens.`);
        // Automatically clean up dead/unregistered tokens from the database
        if (fcmRes && fcmRes.failureCount > 0) {
            const deadTokensByUser = {};
            fcmRes.responses.forEach((resp, idx) => {
                var _a;
                if (!resp.success) {
                    const errorCode = (_a = resp.error) === null || _a === void 0 ? void 0 : _a.code;
                    if (errorCode === 'messaging/registration-token-not-registered' ||
                        errorCode === 'messaging/invalid-registration-token') {
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
            const cleanupPromises = Object.entries(deadTokensByUser).map((_a) => __awaiter(void 0, [_a], void 0, function* ([uId, deadTokens]) {
                try {
                    yield user_model_1.User.findByIdAndUpdate(uId, {
                        $pull: { deviceTokens: { token: { $in: deadTokens } } }
                    });
                    logger_1.logger.warn(`[Push Channel] Garbage Collection: Cleaned up ${deadTokens.length} dead/unregistered tokens for User ${uId} from database.`);
                }
                catch (cleanupErr) {
                    logger_1.logger.error(`[Push Channel] Garbage Collection Failed for User ${uId}:`, cleanupErr);
                }
            }));
            yield Promise.all(cleanupPromises);
        }
        // Count unique users with tokens as sent
        const usersWithTokens = new Set(tokensWithUsers.map(t => t.userId));
        result.sent = usersWithTokens.size;
        // Users without tokens are also considered "sent" (nothing to send)
        const usersWithoutTokens = users.filter(u => !u.deviceTokens || u.deviceTokens.length === 0);
        result.sent += usersWithoutTokens.length;
    }
    catch (error) {
        logger_1.logger.error('Push notification error:', { error });
        // Mark users with tokens as failed
        const usersWithTokens = new Set(tokensWithUsers.map(t => t.userId));
        result.failed = Array.from(usersWithTokens);
        // Users without tokens are still "sent"
        const usersWithoutTokens = users.filter(u => !u.deviceTokens || u.deviceTokens.length === 0);
        result.sent = usersWithoutTokens.length;
    }
    return result;
});
exports.sendPush = sendPush;
exports.default = exports.sendPush;
