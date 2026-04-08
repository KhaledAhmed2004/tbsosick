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
exports.AdminController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const admin_service_1 = require("./admin.service");
exports.AdminController = {
    getDashboardStats: (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield (0, admin_service_1.getAdminDashboardStats)();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Admin dashboard metrics',
            data: result,
        });
    })),
    getPreferenceCardMonthly: (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield (0, admin_service_1.getPreferenceCardMonthlyTrend)();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Preference card monthly trend',
            data: result,
        });
    })),
    getActiveSubscriptionMonthly: (0, catchAsync_1.default)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield (0, admin_service_1.getActiveSubscriptionMonthlyTrend)();
        const currentYear = new Date().getFullYear();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: `Monthly analytics for ${currentYear} retrieved successfully.`,
            data: result,
        });
    })),
};
