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
exports.SuturesService = void 0;
const sutures_model_1 = require("./sutures.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const builder_1 = require("../../builder");
exports.SuturesService = {
    createSutureInDB: (data) => __awaiter(void 0, void 0, void 0, function* () {
        return yield sutures_model_1.SutureModel.create(data);
    }),
    updateSutureInDB: (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield sutures_model_1.SutureModel.findById(id);
        if (!doc)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Suture not found');
        if (payload.name !== undefined)
            doc.name = payload.name;
        yield doc.save();
        return doc;
    }),
    deleteSutureFromDB: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const doc = yield sutures_model_1.SutureModel.findById(id);
        if (!doc)
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Suture not found');
        yield sutures_model_1.SutureModel.findByIdAndDelete(id);
        return { deleted: true };
    }),
    bulkCreateInDB: (items) => __awaiter(void 0, void 0, void 0, function* () {
        const normalized = items
            .map(i => ({ name: i.name.trim() }))
            .filter(i => i.name.length > 0);
        const names = normalized.map(i => i.name);
        const existingDocs = yield sutures_model_1.SutureModel.find({
            name: { $in: names },
        }).select('name');
        const existingSet = new Set(existingDocs.map(d => d.name));
        const toInsert = normalized.filter(i => !existingSet.has(i.name));
        const duplicates = normalized
            .filter(i => existingSet.has(i.name))
            .map(i => i.name);
        const created = toInsert.length > 0
            ? yield sutures_model_1.SutureModel.insertMany(toInsert, { ordered: true })
            : [];
        return {
            createdCount: created.length,
            created,
            duplicates,
        };
    }),
    listSuturesFromDB: (query) => __awaiter(void 0, void 0, void 0, function* () {
        const qb = new builder_1.QueryBuilder(sutures_model_1.SutureModel.find({}), query || {})
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
