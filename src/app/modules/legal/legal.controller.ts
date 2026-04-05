import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { LegalService } from './legal.service';

export const LegalController = {
  createLegalPage: catchAsync(async (req: Request, res: Response) => {
    const result = await LegalService.createLegalPageInDB(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Legal page created',
      data: result,
    });
  }),

  updateLegalPage: catchAsync(async (req: Request, res: Response) => {
    const result = await LegalService.updateLegalPageInDB(
      req.params.id,
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Legal page updated',
      data: result,
    });
  }),

  deleteLegalPage: catchAsync(async (req: Request, res: Response) => {
    const result = await LegalService.deleteLegalPageFromDB(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Legal page deleted',
      data: result,
    });
  }),

  listLegalPages: catchAsync(async (req: Request, res: Response) => {
    const result = await LegalService.listLegalPagesFromDB();
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Legal pages fetched',
      data: result,
    });
  }),

  getLegalPageById: catchAsync(async (req: Request, res: Response) => {
    const result = await LegalService.getLegalPageByIdFromDB(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Legal page fetched',
      data: result,
    });
  }),
};

