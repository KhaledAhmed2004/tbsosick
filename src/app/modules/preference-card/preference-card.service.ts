import { Model, Types } from 'mongoose';
import { PreferenceCardModel } from './preference-card.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { USER_ROLES } from '../../../enums/user';
import { QueryBuilder } from '../../builder';
import { SupplyModel } from '../supplies/supplies.model';
import { SutureModel } from '../sutures/sutures.model';
import { Favorite } from '../favorite/favorite.model';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Resolves an array of { supply/suture: idOrName, quantity } items.
 * ObjectId strings are kept as-is. Plain-text names are looked up
 * by name; if not found, created. Returns resolved items with ObjectIds.
 */
const resolveMixedItemsWithQuantity = async (
  items: Array<{ [key: string]: any }>,
  refField: string,
  ItemModel: Model<any>,
): Promise<Array<{ [key: string]: any }>> => {
  const resolved: Array<{ [key: string]: any }> = [];
  const customNameItems: Array<{ index: number; name: string }> = [];

  for (let i = 0; i < items.length; i++) {
    const value = items[i][refField];
    if (OBJECT_ID_REGEX.test(value)) {
      resolved.push({ [refField]: value, quantity: items[i].quantity });
    } else {
      resolved.push({ [refField]: '', quantity: items[i].quantity });
      customNameItems.push({ index: i, name: value.trim() });
    }
  }

  if (customNameItems.length === 0) {
    return resolved;
  }

  const uniqueNames = [...new Set(customNameItems.map(item => item.name))];

  const existingDocs = await ItemModel.find({
    name: { $in: uniqueNames },
  }).select('_id name').lean();

  const nameToIdMap = new Map(
    existingDocs.map((doc: any) => [doc.name, doc._id.toString()]),
  );

  const toCreate = uniqueNames
    .filter(name => !nameToIdMap.has(name))
    .map(name => ({ name }));

  if (toCreate.length > 0) {
    const newDocs = await ItemModel.insertMany(toCreate);
    for (const doc of newDocs) {
      nameToIdMap.set((doc as any).name, doc._id.toString());
    }
  }

  for (const { index, name } of customNameItems) {
    resolved[index][refField] = nameToIdMap.get(name)!;
  }

  return resolved;
};

/**
 * Flattens populated supplies/sutures.
 * After populate, `supply` / `suture` holds the referenced doc `{ name }`.
 * We flatten to `{ name, quantity }` for the API response so clients keep
 * seeing a stable `name` label regardless of internal FK field naming.
 */
const flattenCard = (doc: any) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj.supplies) {
    obj.supplies = obj.supplies.map((item: any) => ({
      name: item.supply?.name || item.supply,
      quantity: item.quantity,
    }));
  }
  if (obj.sutures) {
    obj.sutures = obj.sutures.map((item: any) => ({
      name: item.suture?.name || item.suture,
      quantity: item.quantity,
    }));
  }
  return obj;
};

const flattenCards = (docs: any[]) => docs.map(flattenCard);

const getPreferenceCardCountsFromDB = async (userId: string) => {
  const [AllCardsCount, myCardsCount] = await Promise.all([
    PreferenceCardModel.countDocuments({ published: true }),
    PreferenceCardModel.countDocuments({ createdBy: userId }),
  ]);
  return { AllCardsCount, myCardsCount };
};

const getDistinctSpecialtiesFromDB = async () => {
  const specialties = await PreferenceCardModel.distinct('surgeon.specialty', {
    published: true,
  });
  return specialties.filter(Boolean).sort();
};

const getFavoriteCardIdsForUserFromDB = async (userId: string) => {
  const favorites = await Favorite.find({ userId }).select('cardId -_id').lean();
  return favorites.map(f => f.cardId.toString());
};

const incrementDownloadCountInDB = async (
  id: string,
  userId: string,
  role?: string,
) => {
  const doc = await PreferenceCardModel.findById(id);
  if (!doc)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Preference card not found');

  const isOwner = doc.createdBy.toString() === userId;
  const isSuperAdmin = role === USER_ROLES.SUPER_ADMIN;
  if (!isOwner && !isSuperAdmin && !doc.published) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not authorized to update download count',
    );
  }

  doc.downloadCount = (doc.downloadCount || 0) + 1;
  await doc.save();
  return { downloadCount: doc.downloadCount };
};

/**
 * Accepts client payloads that still use `{ name, quantity }` (backwards
 * compat with the API contract) and normalises them into the schema's
 * `{ supply|suture, quantity }` shape.
 */
const normaliseClientRefField = (
  items: Array<Record<string, any>>,
  targetField: 'supply' | 'suture',
): Array<Record<string, any>> => {
  return items.map(item => {
    if (item && item[targetField] === undefined && item.name !== undefined) {
      const { name, ...rest } = item;
      return { ...rest, [targetField]: name };
    }
    return item;
  });
};

const createPreferenceCardInDB = async (userId: string, data: any) => {
  if (data.supplies && Array.isArray(data.supplies)) {
    const normalised = normaliseClientRefField(data.supplies, 'supply');
    data.supplies = await resolveMixedItemsWithQuantity(
      normalised,
      'supply',
      SupplyModel,
    );
  }
  if (data.sutures && Array.isArray(data.sutures)) {
    const normalised = normaliseClientRefField(data.sutures, 'suture');
    data.sutures = await resolveMixedItemsWithQuantity(
      normalised,
      'suture',
      SutureModel,
    );
  }

  const dataToSave = {
    ...data,
    createdBy: userId,
  };

  const card = await PreferenceCardModel.create(dataToSave);
  return card;
};

const listPreferenceCardsForUserFromDB = async (userId: string) => {
  const docs = await PreferenceCardModel.find({
    createdBy: userId,
  })
    .populate('supplies.supply', 'name -_id')
    .populate('sutures.suture', 'name -_id')
    .sort({
      updatedAt: -1,
    })
    .lean();

  return flattenCards(docs);
};

const listPrivatePreferenceCardsForUserFromDB = async (
  userId: string,
  query?: Record<string, any>,
) => {
  const qb = new QueryBuilder(
    PreferenceCardModel.find({
      createdBy: userId,
      published: false,
    }),
    query || {},
  )
    .search(['cardTitle', 'surgeon.fullName', 'medication'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .populate(['supplies.supply', 'sutures.suture'], {
      'supplies.supply': 'name -_id',
      'sutures.suture': 'name -_id',
    });

  const docs = await qb.modelQuery;
  const meta = await qb.getPaginationInfo();

  return {
    meta,
    data: flattenCards(docs),
  };
};

const getPreferenceCardByIdFromDB = async (
  id: string,
  userId: string,
  role?: string,
) => {
  const doc = await PreferenceCardModel.findById(id)
    .populate('supplies.supply', 'name -_id')
    .populate('sutures.suture', 'name -_id')
    .lean();

  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Preference card not found');
  }

  const isOwner = doc.createdBy.toString() === userId;
  const isSuperAdmin = role === USER_ROLES.SUPER_ADMIN;

  if (!isOwner && !isSuperAdmin && !doc.published) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not authorized to access this card',
    );
  }

  return flattenCard(doc);
};

const updatePreferenceCardInDB = async (
  id: string,
  userId: string,
  role: string | undefined,
  payload: Record<string, any>,
) => {
  // Check if the card exists and get its creator
  const existingCard = await PreferenceCardModel.findById(id)
    .select('createdBy')
    .lean();
  if (!existingCard) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Preference card not found');
  }

  // Authorization check
  if (
    existingCard.createdBy.toString() !== userId &&
    role !== USER_ROLES.SUPER_ADMIN
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not authorized to update this card',
    );
  }

  // Resolve mixed supplies/sutures if present
  if (payload.supplies && Array.isArray(payload.supplies)) {
    const normalised = normaliseClientRefField(payload.supplies, 'supply');
    payload.supplies = await resolveMixedItemsWithQuantity(
      normalised,
      'supply',
      SupplyModel,
    );
  }
  if (payload.sutures && Array.isArray(payload.sutures)) {
    const normalised = normaliseClientRefField(payload.sutures, 'suture');
    payload.sutures = await resolveMixedItemsWithQuantity(
      normalised,
      'suture',
      SutureModel,
    );
  }

  // Update the document in one step
  const updatedCard = await PreferenceCardModel.findOneAndUpdate(
    { _id: id },
    { $set: payload },
    { new: true }, // return the updated doc
  );

  return updatedCard;
};

const deletePreferenceCardFromDB = async (
  id: string,
  userId: string,
  role?: string,
) => {
  const doc = await PreferenceCardModel.findById(id);
  if (!doc)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Preference card not found');
  if (doc.createdBy.toString() !== userId && role !== USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not authorized to delete this card',
    );
  }
  await PreferenceCardModel.findByIdAndDelete(id);
  return { deleted: true };
};

const updateVerificationStatusInDB = async (
  id: string,
  role: string | undefined,
  status: 'VERIFIED' | 'UNVERIFIED',
) => {
  const doc = await PreferenceCardModel.findById(id);
  if (!doc)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Preference card not found');

  if (role !== USER_ROLES.SUPER_ADMIN) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not authorized to verify/reject this card',
    );
  }

  doc.verificationStatus = status;
  await doc.save();
  return { verificationStatus: doc.verificationStatus };
};

const listPublicPreferenceCardsFromDB = async (query?: Record<string, any>) => {
  const rawQuery = query || {};
  const { specialty, surgeonSpecialty, ...rest } = rawQuery;
  const enrichedQuery: Record<string, any> = { ...rest };

  const specialtyValue = specialty || surgeonSpecialty;
  if (specialtyValue) {
    enrichedQuery['surgeon.specialty'] = {
      $regex: String(specialtyValue),
      $options: 'i',
    };
  }

  const qb = new QueryBuilder(
    PreferenceCardModel.find({ published: true }),
    enrichedQuery,
  )
    .search(['cardTitle', 'surgeon.fullName', 'medication'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .populate(['supplies.supply', 'sutures.suture'], {
      'supplies.supply': 'name -_id',
      'sutures.suture': 'name -_id',
    });

  const cards = await qb.modelQuery;
  const meta = await qb.getPaginationInfo();

  return {
    meta,
    data: flattenCards(cards),
  };
};

const listFavoritePreferenceCardsForUserFromDB = async (
  userId: string,
  query?: Record<string, any>,
) => {
  const favorites = await Favorite.find({ userId }).select('cardId -_id').lean();
  const cardIds = favorites.map(f => f.cardId);

  if (cardIds.length === 0) {
    return {
      meta: {
        total: 0,
        limit: Math.min(Number(query?.limit) || 10, 50),
        page: Number(query?.page) || 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      data: [],
    };
  }

  const qb = new QueryBuilder(
    PreferenceCardModel.find({
      _id: { $in: cardIds },
    }),
    query || {},
  )
    .search(['cardTitle', 'surgeon.fullName', 'medication'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .populate(['supplies.supply', 'sutures.suture'], {
      'supplies.supply': 'name -_id',
      'sutures.suture': 'name -_id',
    });

  const docs = await qb.modelQuery;
  const meta = await qb.getPaginationInfo();

  return {
    meta,
    data: flattenCards(docs),
  };
};

const favoritePreferenceCardInDB = async (cardId: string, userId: string) => {
  const card = await PreferenceCardModel.findById(cardId);
  if (!card) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Preference card not found');
  }

  if (!card.published && card.createdBy.toString() !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not authorized to favorite this card',
    );
  }

  // Upsert — idempotent, unique index on { userId, cardId } makes double
  // favorite a no-op.
  await Favorite.updateOne(
    { userId: new Types.ObjectId(userId), cardId: new Types.ObjectId(cardId) },
    { $setOnInsert: { userId, cardId } },
    { upsert: true },
  );

  return { favorited: true };
};

const unfavoritePreferenceCardInDB = async (cardId: string, userId: string) => {
  const card = await PreferenceCardModel.findById(cardId);
  if (!card) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Preference card not found');
  }

  await Favorite.deleteOne({
    userId: new Types.ObjectId(userId),
    cardId: new Types.ObjectId(cardId),
  });

  return { favorited: false };
};

export const PreferenceCardService = {
  getPreferenceCardCountsFromDB,
  getDistinctSpecialtiesFromDB,
  getFavoriteCardIdsForUserFromDB,
  incrementDownloadCountInDB,
  createPreferenceCardInDB,
  listPreferenceCardsForUserFromDB,
  listPrivatePreferenceCardsForUserFromDB,
  getPreferenceCardByIdFromDB,
  updatePreferenceCardInDB,
  deletePreferenceCardFromDB,
  updateVerificationStatusInDB,
  listPublicPreferenceCardsFromDB,
  listFavoritePreferenceCardsForUserFromDB,
  favoritePreferenceCardInDB,
  unfavoritePreferenceCardInDB,
};
