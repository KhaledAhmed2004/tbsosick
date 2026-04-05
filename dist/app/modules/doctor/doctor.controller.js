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
exports.DoctorController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const doctor_service_1 = require("./doctor.service");
exports.DoctorController = {
    createDoctor: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const created = yield doctor_service_1.DoctorService.createDoctor(req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            message: 'Doctor created',
            data: created,
        });
    })),
    getDoctors: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield doctor_service_1.DoctorService.searchDoctors({
            search: req.query.search || undefined,
            email: req.query.email || undefined,
            specialty: req.query.specialty || undefined,
            status: req.query.status || undefined,
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            sortBy: req.query.sortBy || undefined,
            sortOrder: req.query.sortOrder || undefined,
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Doctor list fetched',
            pagination: result.pagination,
            data: result.data,
        });
    })),
    blockDoctor: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const updated = yield doctor_service_1.DoctorService.blockDoctor(req.params.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Doctor blocked',
            data: updated,
        });
    })),
    unblockDoctor: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const updated = yield doctor_service_1.DoctorService.unblockDoctor(req.params.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Doctor unblocked',
            data: updated,
        });
    })),
    deleteDoctor: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const deleted = yield doctor_service_1.DoctorService.deleteDoctor(req.params.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Doctor deleted',
            data: deleted,
        });
    })),
    updateDoctor: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const updated = yield doctor_service_1.DoctorService.updateDoctorProfile(req.params.id, req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Doctor updated',
            data: updated,
        });
    })),
};
