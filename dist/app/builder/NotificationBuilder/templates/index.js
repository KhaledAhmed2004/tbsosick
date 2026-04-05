"use strict";
/**
 * Notification Template Exports
 *
 * All notification templates are exported from here.
 * To add a new template:
 * 1. Create a new file (e.g., myTemplate.ts)
 * 2. Export it here
 * 3. It will automatically be available in NotificationBuilder
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartAbandoned = exports.systemAlert = exports.welcome = exports.taskCompleted = exports.bidAccepted = exports.bidReceived = exports.paymentFailed = exports.paymentReceived = exports.orderDelivered = exports.orderShipped = exports.orderPlaced = exports.newMessage = void 0;
var newMessage_1 = require("./newMessage");
Object.defineProperty(exports, "newMessage", { enumerable: true, get: function () { return newMessage_1.newMessage; } });
var orderPlaced_1 = require("./orderPlaced");
Object.defineProperty(exports, "orderPlaced", { enumerable: true, get: function () { return orderPlaced_1.orderPlaced; } });
var orderShipped_1 = require("./orderShipped");
Object.defineProperty(exports, "orderShipped", { enumerable: true, get: function () { return orderShipped_1.orderShipped; } });
var orderDelivered_1 = require("./orderDelivered");
Object.defineProperty(exports, "orderDelivered", { enumerable: true, get: function () { return orderDelivered_1.orderDelivered; } });
var paymentReceived_1 = require("./paymentReceived");
Object.defineProperty(exports, "paymentReceived", { enumerable: true, get: function () { return paymentReceived_1.paymentReceived; } });
var paymentFailed_1 = require("./paymentFailed");
Object.defineProperty(exports, "paymentFailed", { enumerable: true, get: function () { return paymentFailed_1.paymentFailed; } });
var bidReceived_1 = require("./bidReceived");
Object.defineProperty(exports, "bidReceived", { enumerable: true, get: function () { return bidReceived_1.bidReceived; } });
var bidAccepted_1 = require("./bidAccepted");
Object.defineProperty(exports, "bidAccepted", { enumerable: true, get: function () { return bidAccepted_1.bidAccepted; } });
var taskCompleted_1 = require("./taskCompleted");
Object.defineProperty(exports, "taskCompleted", { enumerable: true, get: function () { return taskCompleted_1.taskCompleted; } });
var welcome_1 = require("./welcome");
Object.defineProperty(exports, "welcome", { enumerable: true, get: function () { return welcome_1.welcome; } });
var systemAlert_1 = require("./systemAlert");
Object.defineProperty(exports, "systemAlert", { enumerable: true, get: function () { return systemAlert_1.systemAlert; } });
var cartAbandoned_1 = require("./cartAbandoned");
Object.defineProperty(exports, "cartAbandoned", { enumerable: true, get: function () { return cartAbandoned_1.cartAbandoned; } });
