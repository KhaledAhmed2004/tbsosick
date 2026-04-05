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
exports.LegalService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const legal_model_1 = require("./legal.model");
exports.LegalService = {
    createLegalPageInDB: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return yield legal_model_1.LegalPageModel.create(data);
    }),
    updateLegalPageInDB: (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield legal_model_1.LegalPageModel.findById(id);
        if (!doc)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Legal page not found');
        if (payload.title !== undefined)
            doc.title = payload.title;
        if (payload.content !== undefined)
            doc.content = payload.content;
        yield doc.save();
        return doc;
    }),
    deleteLegalPageFromDB: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield legal_model_1.LegalPageModel.findById(id);
        if (!doc)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Legal page not found');
        yield legal_model_1.LegalPageModel.findByIdAndDelete(id);
        return { deleted: true };
    }),
    listLegalPagesFromDB: () => __awaiter(void 0, void 0, void 0, function* () {
        return yield legal_model_1.LegalPageModel.find({}, { title: 1 })
            .sort({ createdAt: -1 });
    }),
    getLegalPageByIdFromDB: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield legal_model_1.LegalPageModel.findById(id);
        if (!doc)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Legal page not found');
        return doc;
    }),
};
