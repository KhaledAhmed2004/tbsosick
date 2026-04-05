import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PreferenceCardService } from './preference-card.service';
import { JwtPayload } from 'jsonwebtoken';

export const PreferenceCardController = {
  createCard: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await PreferenceCardService.createPreferenceCardInDB(
      (user as any).id,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Preference card created',
      data: result,
    });
  }),

  listMyCards: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await PreferenceCardService.listPreferenceCardsForUserFromDB(
      (user as any).id,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Preference cards fetched',
      data: result,
    });
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await PreferenceCardService.getPreferenceCardByIdFromDB(
      req.params.id,
      (user as any).id,
      (user as any).role,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Preference card details fetched',
      data: result,
    });
  }),

  updateCard: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await PreferenceCardService.updatePreferenceCardInDB(
      req.params.id,
      (user as any).id,
      (user as any).role,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Preference card updated',
      data: result,
    });
  }),

  deleteCard: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await PreferenceCardService.deletePreferenceCardFromDB(
      req.params.id,
      (user as any).id,
      (user as any).role,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Preference card deleted',
      data: result,
    });
  }),

  incrementDownloadCount: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await PreferenceCardService.incrementDownloadCountInDB(
      req.params.id,
      (user as any).id,
      (user as any).role,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Download count incremented',
      data: result,
    });
  }),

  favoriteCard: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await PreferenceCardService.favoritePreferenceCardInDB(
      req.params.id,
      (user as any).id,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Preference card favorited',
      data: result,
    });
  }),

  unfavoriteCard: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await PreferenceCardService.unfavoritePreferenceCardInDB(
      req.params.id,
      (user as any).id,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Preference card unfavorited',
      data: result,
    });
  }),

  listPublicCards: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const [cards, favoriteCardIds] = await Promise.all([
      PreferenceCardService.listPublicPreferenceCardsFromDB(req.query),
      PreferenceCardService.getFavoriteCardIdsForUser((user as any).id),
    ]);
    const favoriteSet = new Set(
      (favoriteCardIds as string[]).map(id => id.toString()),
    );
    const summarized = (cards.data as any[]).map((doc: any) => ({
      _id: doc._id,
      cardTitle: doc.cardTitle,
      surgeonName: doc.surgeon?.fullName,
      surgeonSpecialty: doc.surgeon?.specialty,
      isVerified: doc.verificationStatus === 'VERIFIED',
      isFavorite: favoriteSet.has(doc._id.toString()),
      totalDownloads: doc.downloadCount || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Public cards fetched successfully',
      pagination: cards.pagination,
      data: summarized,
    });
  }),
  listPrivateCards: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const [cards, favoriteCardIds] =
      await Promise.all([
        PreferenceCardService.listPrivatePreferenceCardsForUserFromDB(
          (user as any).id,
          req.query,
        ),
        PreferenceCardService.getFavoriteCardIdsForUser((user as any).id),
      ]);

    const favoriteSet = new Set(
      (favoriteCardIds as string[]).map(id => id.toString()),
    );

    const summarized = (cards.data as any[]).map((doc: any) => ({
      _id: doc._id,
      cardTitle: doc.cardTitle,
      surgeonName: doc.surgeon?.fullName,
      surgeonSpecialty: doc.surgeon?.specialty,
      isVerified: doc.verificationStatus === 'VERIFIED',
      isFavorite: favoriteSet.has(doc._id.toString()),
      totalDownloads: doc.downloadCount || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Private cards fetched successfully',
      pagination: cards.pagination,
      data: summarized,
    });
  }),
  listFavoriteCards: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const [cards, favoriteCardIds] =
      await Promise.all([
        PreferenceCardService.listFavoritePreferenceCardsForUserFromDB(
          (user as any).id,
          req.query,
        ),
        PreferenceCardService.getFavoriteCardIdsForUser((user as any).id),
      ]);

    const favoriteSet = new Set(
      (favoriteCardIds as string[]).map(id => id.toString()),
    );

    const summarized = (cards.data as any[]).map((doc: any) => ({
      _id: doc._id,
      cardTitle: doc.cardTitle,
      surgeonName: doc.surgeon?.fullName,
      surgeonSpecialty: doc.surgeon?.specialty,
      isVerified: doc.verificationStatus === 'VERIFIED',
      isFavorite: favoriteSet.has(doc._id.toString()),
      totalDownloads: doc.downloadCount || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Favorite cards fetched successfully',
      pagination: cards.pagination,
      data: summarized,
    });
  }),
  countCards: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await PreferenceCardService.getCountsForCards(
      (user as any).id,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Card counts fetched successfully',
      data: result,
    });
  }),
  approveCard: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await PreferenceCardService.updateVerificationStatusInDB(
      req.params.id,
      (user as any).role,
      'VERIFIED',
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Preference card approved',
      data: result,
    });
  }),

  rejectCard: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await PreferenceCardService.updateVerificationStatusInDB(
      req.params.id,
      (user as any).role,
      'UNVERIFIED',
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Preference card rejected',
      data: result,
    });
  }),
};
