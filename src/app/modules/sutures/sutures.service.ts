import { SutureModel } from './sutures.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Suture } from './sutures.interface';
import { QueryBuilder } from '../../builder';

const createSutureToDB = async (data: Suture) => {
  return await SutureModel.create(data);
};

const updateSutureInDB = async (id: string, payload: Partial<Suture>) => {
  const doc = await SutureModel.findById(id);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Suture not found');

  if (payload.name !== undefined) doc.name = payload.name;
  await doc.save();
  return doc;
};

const deleteSutureFromDB = async (id: string) => {
  const doc = await SutureModel.findById(id);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Suture not found');

  await SutureModel.findByIdAndDelete(id);
  return { deleted: true };
};

const bulkCreateSuturesToDB = async (items: Suture[]) => {
  const normalized = items
    .map(i => ({ name: i.name.trim(), isActive: true }))
    .filter(i => i.name.length > 0);

  const names = normalized.map(i => i.name);

  const existingDocs = await SutureModel.find({
    name: { $in: names },
  }).select('name').lean();
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
};

const listSuturesFromDB = async (query?: Record<string, any>) => {
  const qb = new QueryBuilder(SutureModel.find({}), query || {})
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const docs = await qb.modelQuery.lean();
  const paginationInfo = await qb.getPaginationInfo();

  return {
    meta: paginationInfo,
    data: docs,
  };
};

export const SuturesService = {
  createSutureToDB,
  updateSutureInDB,
  deleteSutureFromDB,
  bulkCreateSuturesToDB,
  listSuturesFromDB,
};
