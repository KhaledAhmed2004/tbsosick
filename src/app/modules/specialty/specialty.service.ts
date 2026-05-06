import { SpecialtyModel } from './specialty.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { ISpecialty } from './specialty.interface';
import { QueryBuilder } from '../../builder';

const createSpecialtyToDB = async (data: ISpecialty) => {
  return await SpecialtyModel.create(data);
};

const listSpecialtiesFromDB = async (query: Record<string, any>) => {
  const qb = new QueryBuilder(SpecialtyModel.find({ isActive: true }), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await qb.modelQuery;
  const meta = await qb.getPaginationInfo();
  return { data, meta };
};

const updateSpecialtyInDB = async (id: string, payload: Partial<ISpecialty>) => {
  const doc = await SpecialtyModel.findById(id);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Specialty not found');

  if (payload.name !== undefined) doc.name = payload.name;
  if (payload.isActive !== undefined) doc.isActive = payload.isActive;
  
  await doc.save();
  return doc;
};

const deleteSpecialtyFromDB = async (id: string) => {
  const doc = await SpecialtyModel.findById(id);
  if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Specialty not found');

  await SpecialtyModel.findByIdAndDelete(id);
  return { deleted: true };
};

export const SpecialtyService = {
  createSpecialtyToDB,
  listSpecialtiesFromDB,
  updateSpecialtyInDB,
  deleteSpecialtyFromDB,
};
