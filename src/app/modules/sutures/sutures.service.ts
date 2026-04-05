import { SutureModel } from './sutures.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Suture } from './sutures.interface';
import { QueryBuilder } from '../../builder';

export const SuturesService = {
  createSutureInDB: async (data: Suture) => {
    return await SutureModel.create(data);
  },

  updateSutureInDB: async (id: string, payload: Partial<Suture>) => {
    const doc = await SutureModel.findById(id);
    if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Suture not found');

    if (payload.name !== undefined) doc.name = payload.name;
    await doc.save();
    return doc;
  },

  deleteSutureFromDB: async (id: string) => {
    const doc = await SutureModel.findById(id);
    if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Suture not found');

    await SutureModel.findByIdAndDelete(id);
    return { deleted: true };
  },

  bulkCreateInDB: async (items: Suture[]) => {
    const normalized = items
      .map(i => ({ name: i.name.trim() }))
      .filter(i => i.name.length > 0);

    const names = normalized.map(i => i.name);

    const existingDocs = await SutureModel.find({
      name: { $in: names },
    }).select('name');
    const existingSet = new Set(existingDocs.map(d => d.name));

    const toInsert = normalized.filter(i => !existingSet.has(i.name));
    const duplicates = normalized
      .filter(i => existingSet.has(i.name))
      .map(i => i.name);

    const created =
      toInsert.length > 0
        ? await SutureModel.insertMany(toInsert, { ordered: true })
        : [];

    return {
      createdCount: created.length,
      created,
      duplicates,
    };
  },

  listSuturesFromDB: async (query?: Record<string, any>) => {
    const qb = new QueryBuilder(SutureModel.find({}), query || {})
      .search(['name'])
      .filter()
      .sort()
      .paginate()
      .fields();

    const docs = await qb.modelQuery;
    const paginationInfo = await qb.getPaginationInfo();

    return {
      pagination: paginationInfo,
      data: docs,
    };
  },
};
