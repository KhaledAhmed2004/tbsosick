import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SuturesService } from './sutures.service';

export const SuturesController = {
  createSuture: catchAsync(async (req: Request, res: Response) => {
    const result = await SuturesService.createSutureInDB(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Suture created',
      data: result,
    });
  }),

  updateSuture: catchAsync(async (req: Request, res: Response) => {
    const result = await SuturesService.updateSutureInDB(
      req.params.id,
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Suture updated',
      data: result,
    });
  }),

  deleteSuture: catchAsync(async (req: Request, res: Response) => {
    const result = await SuturesService.deleteSutureFromDB(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Suture deleted',
      data: result,
    });
  }),

  bulkCreate: catchAsync(async (req: Request, res: Response) => {
    const { items } = req.body as { items: Array<{ name: string }> };
    const result = await SuturesService.bulkCreateInDB(items);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Sutures created',
      data: result,
    });
  }),
  listSutures: catchAsync(async (req: Request, res: Response) => {
    const result = await SuturesService.listSuturesFromDB(req.query);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Sutures fetched',
      pagination: result.pagination,
      data: result.data,
    });
  }),
};
