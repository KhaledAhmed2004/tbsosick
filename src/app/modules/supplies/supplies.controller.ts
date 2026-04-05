import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SuppliesService } from './supplies.service';

export const SuppliesController = {
  createSupply: catchAsync(async (req: Request, res: Response) => {
    const result = await SuppliesService.createSupplyInDB(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Supply created',
      data: result,
    });
  }),

  updateSupply: catchAsync(async (req: Request, res: Response) => {
    const result = await SuppliesService.updateSupplyInDB(
      req.params.id,
      req.body,
    );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Supply updated',
      data: result,
    });
  }),

  deleteSupply: catchAsync(async (req: Request, res: Response) => {
    const result = await SuppliesService.deleteSupplyFromDB(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Supply deleted',
      data: result,
    });
  }),

  bulkCreate: catchAsync(async (req: Request, res: Response) => {
    const { items } = req.body as { items: Array<{ name: string }> };
    const result = await SuppliesService.bulkCreateInDB(items);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Supplies created',
      data: result,
    });
  }),

  listSupplies: catchAsync(async (req: Request, res: Response) => {
    const result = await SuppliesService.listSuppliesFromDB(req.query);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Supplies fetched',
      pagination: result.pagination,
      data: result.data,
    });
  }),
};
