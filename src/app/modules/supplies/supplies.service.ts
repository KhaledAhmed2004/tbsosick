import { SupplyModel } from './supplies.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Supply } from './supplies.interface';
import { QueryBuilder } from '../../builder';

const createSupplyToDB = async (data: Supply) => {
  return await SupplyModel.create(data);
};

const updateSupplyInDB = async (id: string, payload: Partial<Supply>) => {
  const doc = await SupplyModel.findById(id);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Supply not found');

  if (payload.name !== undefined) doc.name = payload.name;
  await doc.save();
  return doc;
};

const deleteSupplyFromDB = async (id: string) => {
  const doc = await SupplyModel.findById(id);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Supply not found');

  await SupplyModel.findByIdAndDelete(id);
  return { deleted: true };
};

const bulkCreateSuppliesToDB = async (items: Supply[]) => {
  // Normalize names and remove empty
  const normalized = items
    .map(i => ({ name: i.name.trim() }))
    .filter(i => i.name.length > 0);

  const names = normalized.map(i => i.name);

  // Find existing to avoid duplicates
  const existingDocs = await SupplyModel.find({
    name: { $in: names },
  }).select('name').lean();
  const existingSet = new Set(existingDocs.map(d => d.name));

  const toInsert = normalized.filter(i => !existingSet.has(i.name));
  const duplicates = normalized
    .filter(i => existingSet.has(i.name))
    .map(i => i.name);

  const created =
    toInsert.length > 0
      ? await SupplyModel.insertMany(toInsert, { ordered: true })
      : [];

  return {
    createdCount: created.length,
    created,
    duplicates,
  };
};

const listSuppliesFromDB = async (query?: Record<string, any>) => {
  const qb = new QueryBuilder(SupplyModel.find({}), query || {})
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

export const SuppliesService = {
  createSupplyToDB,
  updateSupplyInDB,
  deleteSupplyFromDB,
  bulkCreateSuppliesToDB,
  listSuppliesFromDB,
};
