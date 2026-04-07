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

  // Unified list/search method (Step 4 & 7)
  getCards: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const { visibility } = req.query;

    let result;
    if (visibility === 'private') {
      result = await PreferenceCardService.listPrivatePreferenceCardsForUserFromDB(
        (user as any).id,
        req.query,
      );
    } else {
      // Default to public
      result = await PreferenceCardService.listPublicPreferenceCardsFromDB(req.query);
    }

    const [favoriteCardIds] = await Promise.all([
      PreferenceCardService.getFavoriteCardIdsForUser((user as any).id),
    ]);
    
    const favoriteSet = new Set(
      (favoriteCardIds as string[]).map(id => id.toString()),
    );

    const summarized = (result.data as any[]).map((doc: any) => ({
      id: doc.id || doc._id,
      cardTitle: doc.cardTitle,
      surgeon: {
        name: doc.surgeon?.fullName,
        specialty: doc.surgeon?.specialty,
      },
      verificationStatus: doc.verificationStatus,
      isFavorited: favoriteSet.has((doc.id || doc._id).toString()),
      downloadCount: doc.downloadCount || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `${visibility === 'private' ? 'Private' : 'Public'} preference cards fetched successfully`,
      meta: result.meta,
      data: summarized,
    });
  }),

  listPrivateCards: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await PreferenceCardService.listPrivatePreferenceCardsForUserFromDB(
      (user as any).id,
      req.query,
    );

    const [favoriteCardIds] = await Promise.all([
      PreferenceCardService.getFavoriteCardIdsForUser((user as any).id),
    ]);

    const favoriteSet = new Set(
      (favoriteCardIds as string[]).map(id => id.toString()),
    );

    const summarized = (result.data as any[]).map((doc: any) => ({
      id: doc.id || doc._id,
      cardTitle: doc.cardTitle,
      surgeon: {
        name: doc.surgeon?.fullName,
        specialty: doc.surgeon?.specialty,
      },
      verificationStatus: doc.verificationStatus,
      isFavorited: favoriteSet.has((doc.id || doc._id).toString()),
      downloadCount: doc.downloadCount || 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Private preference cards fetched successfully',
      meta: result.meta,
      data: summarized,
    });
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await PreferenceCardService.getPreferenceCardByIdFromDB(
      req.params.cardId,
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
      req.params.cardId,
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
      req.params.cardId,
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
      req.params.cardId,
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
      req.params.cardId,
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
      req.params.cardId,
      (user as any).id,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Preference card unfavorited',
      data: result,
    });
  }),

  getStats: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    // BOLA Mitigation: derive userId from token, not query params
    const result = await PreferenceCardService.getCountsForCards((user as any).id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Card statistics retrieved successfully',
      data: {
        publicCards: result.AllCardsCount,
        myCards: result.myCardsCount,
      },
    });
  }),

  getSpecialties: catchAsync(async (req: Request, res: Response) => {
    const result = await PreferenceCardService.getDistinctSpecialtiesFromDB();

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Specialties retrieved successfully',
      data: result,
    });
  }),

  approveCard: catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await PreferenceCardService.updateVerificationStatusInDB(
      req.params.cardId,
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
      req.params.cardId,
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
