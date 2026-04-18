import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SuturesService } from './sutures.service';

const createSuture = catchAsync(async (req: Request, res: Response) => {
  const result = await SuturesService.createSutureToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Suture created',
    data: result,
  });
});

const updateSuture = catchAsync(async (req: Request, res: Response) => {
  const result = await SuturesService.updateSutureInDB(
    req.params.sutureId,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Suture updated',
    data: result,
  });
});

const deleteSuture = catchAsync(async (req: Request, res: Response) => {
  const result = await SuturesService.deleteSutureFromDB(req.params.sutureId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Suture deleted',
    data: result,
  });
});

const bulkCreate = catchAsync(async (req: Request, res: Response) => {
  const { items } = req.body as { items: Array<{ name: string }> };
  const result = await SuturesService.bulkCreateSuturesToDB(items);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Sutures created',
    data: result,
  });
});

const listSutures = catchAsync(async (req: Request, res: Response) => {
  const result = await SuturesService.listSuturesFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Sutures fetched',
    meta: result.meta,
    data: result.data,
  });
});

export const SuturesController = {
  createSuture,
  updateSuture,
  deleteSuture,
  bulkCreate,
  listSutures,
};
