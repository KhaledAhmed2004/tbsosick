import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SuppliesService } from './supplies.service';

const createSupply = catchAsync(async (req: Request, res: Response) => {
  const result = await SuppliesService.createSupplyToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Supply created',
    data: result,
  });
});

const updateSupply = catchAsync(async (req: Request, res: Response) => {
  const result = await SuppliesService.updateSupplyInDB(
    req.params.supplyId,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Supply updated',
    data: result,
  });
});

const deleteSupply = catchAsync(async (req: Request, res: Response) => {
  const result = await SuppliesService.deleteSupplyFromDB(req.params.supplyId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Supply deleted',
    data: result,
  });
});

const bulkCreate = catchAsync(async (req: Request, res: Response) => {
  const { items } = req.body as { items: Array<{ name: string }> };
  const result = await SuppliesService.bulkCreateSuppliesToDB(items);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Supplies created',
    data: result,
  });
});

const listSupplies = catchAsync(async (req: Request, res: Response) => {
  const result = await SuppliesService.listSuppliesFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Supplies fetched',
    meta: result.meta,
    data: result.data,
  });
});

export const SuppliesController = {
  createSupply,
  updateSupply,
  deleteSupply,
  bulkCreate,
  listSupplies,
};
