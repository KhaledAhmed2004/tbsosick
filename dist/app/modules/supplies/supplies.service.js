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
exports.SuppliesService = void 0;
const supplies_model_1 = require("./supplies.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const builder_1 = require("../../builder");
exports.SuppliesService = {
    createSupplyInDB: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return yield supplies_model_1.SupplyModel.create(data);
    }),
    updateSupplyInDB: (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield supplies_model_1.SupplyModel.findById(id);
        if (!doc)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Supply not found');
        if (payload.name !== undefined)
            doc.name = payload.name;
        yield doc.save();
        return doc;
    }),
    deleteSupplyFromDB: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield supplies_model_1.SupplyModel.findById(id);
        if (!doc)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Supply not found');
        yield supplies_model_1.SupplyModel.findByIdAndDelete(id);
        return { deleted: true };
    }),
    bulkCreateInDB: (items) => __awaiter(void 0, void 0, void 0, function* () {
        // Normalize names and remove empty
        const normalized = items
            .map(i => ({ name: i.name.trim() }))
            .filter(i => i.name.length > 0);
        const names = normalized.map(i => i.name);
        // Find existing to avoid duplicates
        const existingDocs = yield supplies_model_1.SupplyModel.find({
            name: { $in: names },
        }).select('name');
        const existingSet = new Set(existingDocs.map(d => d.name));
        const toInsert = normalized.filter(i => !existingSet.has(i.name));
        const duplicates = normalized
            .filter(i => existingSet.has(i.name))
            .map(i => i.name);
        const created = toInsert.length > 0
            ? yield supplies_model_1.SupplyModel.insertMany(toInsert, { ordered: true })
            : [];
        return {
            createdCount: created.length,
            created,
            duplicates,
        };
    }),
    listSuppliesFromDB: (query) => __awaiter(void 0, void 0, void 0, function* () {
        const qb = new builder_1.QueryBuilder(supplies_model_1.SupplyModel.find({}), query || {})
            .search(['name'])
            .filter()
            .sort()
            .paginate()
            .fields();
        const docs = yield qb.modelQuery;
        const paginationInfo = yield qb.getPaginationInfo();
        return {
            pagination: paginationInfo,
            data: docs,
        };
    }),
};
