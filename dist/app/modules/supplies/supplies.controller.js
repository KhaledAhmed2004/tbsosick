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
exports.SuppliesController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const supplies_service_1 = require("./supplies.service");
exports.SuppliesController = {
    createSupply: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield supplies_service_1.SuppliesService.createSupplyInDB(req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.CREATED,
            message: 'Supply created',
            data: result,
        });
    })),
    updateSupply: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield supplies_service_1.SuppliesService.updateSupplyInDB(req.params.id, req.body);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Supply updated',
            data: result,
        });
    })),
    deleteSupply: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield supplies_service_1.SuppliesService.deleteSupplyFromDB(req.params.id);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Supply deleted',
            data: result,
        });
    })),
    bulkCreate: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { items } = req.body;
        const result = yield supplies_service_1.SuppliesService.bulkCreateInDB(items);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Supplies created',
            data: result,
        });
    })),
    listSupplies: (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = yield supplies_service_1.SuppliesService.listSuppliesFromDB(req.query);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_codes_1.StatusCodes.OK,
            message: 'Supplies fetched',
            pagination: result.pagination,
            data: result.data,
        });
    })),
};
