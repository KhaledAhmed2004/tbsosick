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
exports.LegalController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const legal_service_1 = require("./legal.service");
exports.LegalController = {
    createLegalPage: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield legal_service_1.LegalService.createLegalPageInDB(req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            message: 'Legal page created',
            data: result,
        });
    })),
    updateLegalPage: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield legal_service_1.LegalService.updateLegalPageInDB(req.params.id, req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Legal page updated',
            data: result,
        });
    })),
    deleteLegalPage: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield legal_service_1.LegalService.deleteLegalPageFromDB(req.params.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Legal page deleted',
            data: result,
        });
    })),
    listLegalPages: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield legal_service_1.LegalService.listLegalPagesFromDB();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Legal pages fetched',
            data: result,
        });
    })),
    getLegalPageById: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield legal_service_1.LegalService.getLegalPageByIdFromDB(req.params.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Legal page fetched',
            data: result,
        });
    })),
};
