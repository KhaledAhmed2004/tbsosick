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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotifications = void 0;
const notification_model_1 = require("./notification.model");
const user_model_1 = require("../user/user.model");
const pushNotificationHelper_1 = require("./pushNotificationHelper");
const sendNotifications = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Set default expiry to 30 days if not provided
    if (!data.expiresAt) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        data.expiresAt = expiryDate;
    }
    const result = yield notification_model_1.Notification.create(data);
    const user = yield user_model_1.User.findById(data === null || data === void 0 ? void 0 : data.userId);
    // Check if user has device tokens and the array is not empty
    if ((user === null || user === void 0 ? void 0 : user.deviceTokens) &&
        Array.isArray(user.deviceTokens) &&
        user.deviceTokens.length > 0) {
        const message = {
            notification: {
                title: (data === null || data === void 0 ? void 0 : data.title) || 'TBSosick Notification',
                body: (data === null || data === void 0 ? void 0 : data.subtitle) || (data === null || data === void 0 ? void 0 : data.title) || '',
            },
            tokens: user.deviceTokens,
        };
        try {
            yield pushNotificationHelper_1.pushNotificationHelper.sendPushNotifications(message);
        }
        catch (error) {
            console.error('Failed to send push notification:', error);
        }
    }
    //@ts-ignore
    const socketIo = global.io;
    if (socketIo) {
        socketIo.emit(`get-notification::${data === null || data === void 0 ? void 0 : data.userId}`, result);
    }
    return result;
});
exports.sendNotifications = sendNotifications;
