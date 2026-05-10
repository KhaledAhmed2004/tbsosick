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
exports.SpecialtyService = void 0;
const specialty_model_1 = require("./specialty.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const builder_1 = require("../../builder");
const createSpecialtyToDB = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield specialty_model_1.SpecialtyModel.create(data);
});
const listSpecialtiesFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const qb = new builder_1.QueryBuilder(specialty_model_1.SpecialtyModel.find({ isActive: true }), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const data = yield qb.modelQuery;
    const meta = yield qb.getPaginationInfo();
    return { data, meta };
});
const updateSpecialtyInDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield specialty_model_1.SpecialtyModel.findById(id);
    if (!doc)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Specialty not found');
    if (payload.name !== undefined)
        doc.name = payload.name;
    if (payload.isActive !== undefined)
        doc.isActive = payload.isActive;
    yield doc.save();
    return doc;
});
const deleteSpecialtyFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const doc = yield specialty_model_1.SpecialtyModel.findById(id);
    if (!doc)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Specialty not found');
    yield specialty_model_1.SpecialtyModel.findByIdAndDelete(id);
    return { deleted: true };
});
exports.SpecialtyService = {
    createSpecialtyToDB,
    listSpecialtiesFromDB,
    updateSpecialtyInDB,
    deleteSpecialtyFromDB,
};
