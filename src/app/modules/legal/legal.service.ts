import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { LegalPageModel } from './legal.model';
import { LegalPage } from './legal.interface';

export const LegalService = {
  createLegalPageInDB: async (data: LegalPage) => {
    return await LegalPageModel.create(data);
  },

  updateLegalPageInDB: async (id: string, payload: Partial<LegalPage>) => {
    const doc = await LegalPageModel.findById(id);
    if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Legal page not found');

    if (payload.title !== undefined) doc.title = payload.title;
    if (payload.content !== undefined) doc.content = payload.content;
    await doc.save();
    return doc;
  },

  deleteLegalPageFromDB: async (id: string) => {
    const doc = await LegalPageModel.findById(id);
    if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Legal page not found');

    await LegalPageModel.findByIdAndDelete(id);
    return { deleted: true };
  },

  listLegalPagesFromDB: async () => {
    return await LegalPageModel.find({}, { title: 1 })
      .sort({ createdAt: -1 });
  },

  getLegalPageByIdFromDB: async (id: string) => {
    const doc = await LegalPageModel.findById(id);
    if (!doc) throw new ApiError(StatusCodes.NOT_FOUND, 'Legal page not found');
    return doc;
  },
};
