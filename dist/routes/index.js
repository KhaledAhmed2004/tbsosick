"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = require("../app/modules/auth/auth.route");
const user_route_1 = require("../app/modules/user/user.route");
const notification_routes_1 = require("../app/modules/notification/notification.routes");
const subscription_route_1 = require("../app/modules/subscription/subscription.route");
const event_route_1 = require("../app/modules/event/event.route");
const preference_card_route_1 = require("../app/modules/preference-card/preference-card.route");
const admin_route_1 = require("../app/modules/admin/admin.route");
const doctor_route_1 = require("../app/modules/doctor/doctor.route");
const supplies_route_1 = require("../app/modules/supplies/supplies.route");
const sutures_route_1 = require("../app/modules/sutures/sutures.route");
const legal_route_1 = require("../app/modules/legal/legal.route");
const router = express_1.default.Router();
const apiRoutes = [
    {
        path: '/user',
        route: user_route_1.UserRoutes,
    },
    {
        path: '/auth',
        route: auth_route_1.AuthRoutes,
    },
    {
        path: '/notifications',
        route: notification_routes_1.NotificationRoutes,
    },
    {
        path: '/subscription',
        route: subscription_route_1.SubscriptionRoutes,
    },
    {
        path: '/events',
        route: event_route_1.EventRoutes,
    },
    {
        path: '/preference-card',
        route: preference_card_route_1.PreferenceCardRoutes,
    },
    {
        path: '/dashboard',
        route: admin_route_1.AdminRoutes,
    },
    {
        path: '/doctors',
        route: doctor_route_1.DoctorRoutes,
    },
    {
        path: '/supplies',
        route: supplies_route_1.SuppliesRoutes,
    },
    {
        path: '/sutures',
        route: sutures_route_1.SuturesRoutes,
    },
    {
        path: '/legal',
        route: legal_route_1.LegalRoutes,
    },
];
apiRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
