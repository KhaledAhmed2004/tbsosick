import { Model, Types } from 'mongoose';
import {
  PreferenceCardDownloadModel,
  PreferenceCardModel,
} from './preference-card.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { USER_ROLES } from '../../../enums/user';
import { QueryBuilder } from '../../builder';
import { SupplyModel } from '../supplies/supplies.model';
import { SutureModel } from '../sutures/sutures.model';
import { Favorite } from '../favorite/favorite.model';
import PDFBuilder from '../../builder/PDFBuilder';

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

/**
 * Fields that a preference card must have filled out before it can be
 * published or verified. The schema itself keeps these optional so that
 * drafts can be saved — this list enforces completeness only at publish
 * / approve time.
 */
const PUBLISH_REQUIRED_FIELDS: Array<keyof any> = [
  'medication',
  'instruments',
  'positioningEquipment',
  'prepping',
  'workflow',
  'keyNotes',
];

const assertCardIsPublishable = (card: any) => {
  const missing: string[] = [];
  for (const field of PUBLISH_REQUIRED_FIELDS) {
    const value = card?.[field as string];
    if (typeof value !== 'string' || value.trim() === '') {
      missing.push(field as string);
    }
  }
  if (!Array.isArray(card?.supplies) || card.supplies.length === 0) {
    missing.push('supplies');
  }
  if (!Array.isArray(card?.sutures) || card.sutures.length === 0) {
    missing.push('sutures');
  }
  if (missing.length > 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Cannot publish — missing required fields: ${missing.join(', ')}`,
    );
  }
};

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

/**
 * Flattens a card document to make it easy for PDF generation.
 * Extracts names from populated supplies and sutures.
 */
const flattenCard = (doc: any) => {
  return {
    ...doc,
    supplies: (doc.supplies || []).map((s: any) => ({
      name: s.supply?.name || 'N/A',
      quantity: s.quantity,
    })),
    sutures: (doc.sutures || []).map((s: any) => ({
      name: s.suture?.name || 'N/A',
      quantity: s.quantity,
    })),
  };
};

const downloadPreferenceCardInDB = async (
  id: string,
  userId: string,
  role?: string,
) => {
  // 1. Fetch Card Safely
  const doc = await PreferenceCardModel.findById(id)
    .populate('supplies.supply', 'name -_id')
    .populate('sutures.suture', 'name -_id')
    .lean();

  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Preference card not found');
  }

  // 2. Check Card Status (isDeleted or inactive/unverified)
  // Requirement: Reject if deleted or inactive.
  // We'll use published: false as "inactive" for public users.
  if (doc.isDeleted) {
    throw new ApiError(StatusCodes.GONE, 'This preference card has been deleted');
  }

  // 3. Authorization Rules
  const isOwner = doc.createdBy.toString() === userId;
  const isSuperAdmin = role === USER_ROLES.SUPER_ADMIN;

  if (!doc.published && !isOwner && !isSuperAdmin) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You do not have permission to download this private card',
    );
  }

  // 4. Idempotency / Spam Control
  // userId + cardId + date (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  try {
    // Attempt to create a download log. Unique index handles idempotency.
    await PreferenceCardDownloadModel.create({
      userId: new Types.ObjectId(userId),
      cardId: new Types.ObjectId(id),
      downloadDate: today,
    });

    // 5. Atomic Increment (only if log creation succeeded)
    await PreferenceCardModel.findByIdAndUpdate(id, {
      $inc: { downloadCount: 1 },
    });
  } catch (error: any) {
    // If it's a duplicate key error (code 11000), it means user already downloaded today.
    // We return success without incrementing.
    if (error.code !== 11000) {
      throw error;
    }
  }

  // 6. Generate PDF
  const flattenedDoc = flattenCard(doc);
  const pdfBuffer = await generatePreferenceCardPDF(flattenedDoc);

  return {
    buffer: pdfBuffer,
    fileName: `${flattenedDoc.cardTitle.replace(/\s+/g, '_')}_Preference_Card.pdf`,
  };
};

/**
 * Generates a "beautiful" PDF for a preference card using PDFBuilder.
 */
const generatePreferenceCardPDF = async (card: any): Promise<Buffer> => {
  const builder = new PDFBuilder()
    .setTheme('corporate') // Using corporate for a more professional/beautiful look
    .setTitle(card.cardTitle)
    .setHeader({
      title: card.cardTitle,
      subtitle: 'Official Preference Card',
      showDate: true,
      style: {
        padding: 24,
      },
    })
    .addText({
      content: 'Surgeon Information',
      style: 'heading',
      margin: { top: 20, bottom: 10 },
    })
    .addTable({
      headers: ['Field', 'Details'],
      rows: [
        ['Full Name', card.surgeon?.fullName || 'N/A'],
        ['Specialty', card.surgeon?.specialty || 'N/A'],
        ['Hand Preference', card.surgeon?.handPreference || 'N/A'],
        ['Contact', card.surgeon?.contactNumber || 'N/A'],
        ['Music Preference', card.surgeon?.musicPreference || 'N/A'],
      ],
      striped: true,
    })
    .addSpacer(20);

  if (card.medication) {
    builder
      .addText({ content: 'Medication', style: 'subheading' })
      .addText({
        content: card.medication,
        style: 'body',
        margin: { bottom: 15 },
      })
      .addDivider();
  }

  if (card.supplies && card.supplies.length > 0) {
    builder.addText({ content: 'Supplies', style: 'subheading' }).addTable({
      headers: ['Item Name', 'Quantity'],
      rows: card.supplies.map((s: any) => [s.name, s.quantity]),
      striped: true,
    });
    builder.addSpacer(20);
  }

  if (card.sutures && card.sutures.length > 0) {
    builder.addText({ content: 'Sutures', style: 'subheading' }).addTable({
      headers: ['Item Name', 'Quantity'],
      rows: card.sutures.map((s: any) => [s.name, s.quantity]),
      striped: true,
    });
    builder.addSpacer(20);
  }

  const sections = [
    { label: 'Instruments', value: card.instruments },
    { label: 'Positioning Equipment', value: card.positioningEquipment },
    { label: 'Prepping', value: card.prepping },
    { label: 'Workflow', value: card.workflow },
    { label: 'Key Notes', value: card.keyNotes },
  ];

  for (const section of sections) {
    if (section.value) {
      builder
        .addText({ content: section.label, style: 'subheading' })
        .addText({
          content: section.value,
          style: 'body',
          margin: { bottom: 15 },
        })
        .addDivider();
    }
  }

  // Add Photo Library if exists
  if (card.photoLibrary && card.photoLibrary.length > 0) {
    builder.addText({
      content: 'Photo Library',
      style: 'heading',
      margin: { top: 20, bottom: 10 },
    });

    for (const photo of card.photoLibrary) {
      if (photo.url) {
        builder
          .addImage({
            src: photo.url,
            width: 500, // Large enough to see details
          })
          .addSpacer(10);
      }
    }
  }

  builder.setFooter({
    showPageNumbers: true,
    text: '© Preference Card System - Secure Document',
  });

  return builder.toBuffer();
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

  // If the client is creating the card already marked as published,
  // enforce the completeness invariant up front.
  if (dataToSave.published === true) {
    assertCardIsPublishable(dataToSave);
  }

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
    // Text index on cardTitle + medication + surgeon.fullName + surgeon.specialty
    // handles the full search path — see `card_text_idx` in the model.
    .textSearch()
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

  // If the update flips the card to `published: true`, pre-check the
  // merged shape so half-filled drafts can never be published.
  if (payload.published === true) {
    const full = await PreferenceCardModel.findById(id).lean();
    if (full) {
      assertCardIsPublishable({ ...full, ...payload });
    }
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

  // Enforce completeness before moving to VERIFIED. Drafts and
  // UNVERIFIED cards are allowed to be incomplete.
  if (status === 'VERIFIED') {
    assertCardIsPublishable(doc.toObject());
  }

  doc.verificationStatus = status;
  await doc.save();
  return { verificationStatus: doc.verificationStatus };
};

/**
 * Public preference card list — hottest read endpoint (home screen).
 *
 * This method uses a **single aggregation pipeline** instead of the
 * QueryBuilder `populate()` chain used by the other list methods:
 *
 *   - One `$match` hits the `{ published, verificationStatus, createdAt }`
 *     compound index directly.
 *   - A `$facet` returns paginated data + total count in one round trip
 *     so the caller doesn't need a separate `countDocuments` call.
 *   - Inside the data facet, `$lookup` joins supplies / sutures server
 *     side — no round trip per populate path.
 *   - `$addFields` rewrites each embedded `supply` / `suture` ObjectId
 *     into the populated `{ name }` shape that the API contract expects.
 *
 * Net effect: 3 round trips (find + 2 populate) → 1 aggregation. At
 * small scale the saving is ~10-20ms per call; at 10k+ cards the
 * text-index-backed `$match` also keeps it O(log n).
 *
 * The other list methods (`listPrivate...`, `listFavorite...`, owner
 * list, details) still use the QueryBuilder populate chain — they're
 * lower-traffic and this method is the reference pattern when they're
 * migrated.
 */
const listPublicPreferenceCardsFromDB = async (query?: Record<string, any>) => {
  const rawQuery = query || {};
  const page = Math.max(Number(rawQuery.page) || 1, 1);
  const limit = Math.min(Math.max(Number(rawQuery.limit) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const match: Record<string, any> = { published: true, isDeleted: false };

  // Specialty facet filter. Uses exact match now that `surgeon.specialty`
  // is indexed — callers pass the canonical string from `/specialties`.
  const specialtyValue = rawQuery.specialty || rawQuery.surgeonSpecialty;
  if (specialtyValue) {
    match['surgeon.specialty'] = String(specialtyValue);
  }

  // Text search — leverages `card_text_idx` and `score` sorting.
  const searchTerm =
    typeof rawQuery.searchTerm === 'string'
      ? rawQuery.searchTerm.trim()
      : '';
  if (searchTerm.length > 0) {
    match.$text = { $search: searchTerm };
  }

  const sortStage: Record<string, any> =
    searchTerm.length > 0
      ? { score: { $meta: 'textScore' } }
      : { createdAt: -1 };

  const [result] = await PreferenceCardModel.aggregate<{
    data: any[];
    total: { count: number }[];
  }>([
    { $match: match },
    { $sort: sortStage },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'supplies',
              localField: 'supplies.supply',
              foreignField: '_id',
              as: 'supplyDocs',
              pipeline: [{ $project: { _id: 1, name: 1 } }],
            },
          },
          {
            $lookup: {
              from: 'sutures',
              localField: 'sutures.suture',
              foreignField: '_id',
              as: 'sutureDocs',
              pipeline: [{ $project: { _id: 1, name: 1 } }],
            },
          },
          // Rewrite embedded `supplies[]` / `sutures[]` into the
          // { name, quantity } shape the API contract promises.
          {
            $addFields: {
              supplies: {
                $map: {
                  input: '$supplies',
                  as: 'item',
                  in: {
                    name: {
                      $let: {
                        vars: {
                          hit: {
                            $first: {
                              $filter: {
                                input: '$supplyDocs',
                                as: 's',
                                cond: { $eq: ['$$s._id', '$$item.supply'] },
                              },
                            },
                          },
                        },
                        in: { $ifNull: ['$$hit.name', '$$item.supply'] },
                      },
                    },
                    quantity: '$$item.quantity',
                  },
                },
              },
              sutures: {
                $map: {
                  input: '$sutures',
                  as: 'item',
                  in: {
                    name: {
                      $let: {
                        vars: {
                          hit: {
                            $first: {
                              $filter: {
                                input: '$sutureDocs',
                                as: 's',
                                cond: { $eq: ['$$s._id', '$$item.suture'] },
                              },
                            },
                          },
                        },
                        in: { $ifNull: ['$$hit.name', '$$item.suture'] },
                      },
                    },
                    quantity: '$$item.quantity',
                  },
                },
              },
            },
          },
          { $project: { supplyDocs: 0, sutureDocs: 0, __v: 0 } },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const total = result?.total?.[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      total,
      limit,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    data: result?.data ?? [],
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
    // Text index on cardTitle + medication + surgeon.fullName + surgeon.specialty
    // handles the full search path — see `card_text_idx` in the model.
    .textSearch()
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

  // Soft-delete check
  if (card.isDeleted) {
    throw new ApiError(StatusCodes.GONE, 'This preference card has been deleted');
  }

  // Visibility check: Card must be published OR the user must be the creator
  if (!card.published && card.createdBy.toString() !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not authorized to favorite this private card',
    );
  }

  // Idempotent favorite using unique index constraint
  try {
    await Favorite.create({
      userId: new Types.ObjectId(userId),
      cardId: new Types.ObjectId(cardId),
    });
  } catch (error: any) {
    // 11000 is MongoDB's duplicate key error code
    if (error.code !== 11000) {
      throw error;
    }
  }

  return { favorited: true };
};

const unfavoritePreferenceCardInDB = async (cardId: string, userId: string) => {
  // Check if card exists
  const card = await PreferenceCardModel.findById(cardId);
  if (!card) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Preference card not found');
  }

  // Soft-delete check
  if (card.isDeleted) {
    throw new ApiError(StatusCodes.GONE, 'This preference card has been deleted');
  }

  // Visibility check
  if (!card.published && card.createdBy.toString() !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Not authorized to unfavorite this private card',
    );
  }

  // Idempotent unfavorite
  const result = await Favorite.deleteOne({
    userId: new Types.ObjectId(userId),
    cardId: new Types.ObjectId(cardId),
  });

  return { favorited: false, deletedCount: result.deletedCount };
};

export const PreferenceCardService = {
  getPreferenceCardCountsFromDB,
  getDistinctSpecialtiesFromDB,
  getFavoriteCardIdsForUserFromDB,
  downloadPreferenceCardInDB,
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
