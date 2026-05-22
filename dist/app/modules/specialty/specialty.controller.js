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
exports.SpecialtyController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const specialty_service_1 = require("./specialty.service");
const user_1 = require("../../../enums/user");
const createSpecialty = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield specialty_service_1.SpecialtyService.createSpecialtyToDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: 'Specialty created',
        data: result,
    });
}));
const listSpecialties = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const isAdmin = user && user.role === user_1.USER_ROLES.SUPER_ADMIN;
    const result = yield specialty_service_1.SpecialtyService.listSpecialtiesFromDB(req.query, isAdmin);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Specialties fetched successfully',
        meta: result.meta,
        data: result.data,
    });
}));
const updateSpecialty = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield specialty_service_1.SpecialtyService.updateSpecialtyInDB(req.params.specialtyId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Specialty updated',
        data: result,
    });
}));
const deleteSpecialty = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield specialty_service_1.SpecialtyService.deleteSpecialtyFromDB(req.params.specialtyId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Specialty deleted',
        data: result,
    });
}));
exports.SpecialtyController = {
    createSpecialty,
    listSpecialties,
    updateSpecialty,
    deleteSpecialty,
};
