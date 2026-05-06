import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SpecialtyService } from './specialty.service';

const createSpecialty = catchAsync(async (req: Request, res: Response) => {
  const result = await SpecialtyService.createSpecialtyToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Specialty created',
    data: result,
  });
});

const listSpecialties = catchAsync(async (req: Request, res: Response) => {
  const result = await SpecialtyService.listSpecialtiesFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Specialties fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const updateSpecialty = catchAsync(async (req: Request, res: Response) => {
  const result = await SpecialtyService.updateSpecialtyInDB(
    req.params.specialtyId,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Specialty updated',
    data: result,
  });
});

const deleteSpecialty = catchAsync(async (req: Request, res: Response) => {
  const result = await SpecialtyService.deleteSpecialtyFromDB(req.params.specialtyId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Specialty deleted',
    data: result,
  });
});

export const SpecialtyController = {
  createSpecialty,
  listSpecialties,
  updateSpecialty,
  deleteSpecialty,
};
