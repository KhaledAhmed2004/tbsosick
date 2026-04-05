import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DoctorService } from './doctor.service';

export const DoctorController = {
  createDoctor: catchAsync(async (req: Request, res: Response) => {
    const created = await DoctorService.createDoctor(req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Doctor created',
      data: created,
    });
  }),

  getDoctors: catchAsync(async (req: Request, res: Response) => {
    const result = await DoctorService.searchDoctors({
      search: (req.query.search as string) || undefined,
      email: (req.query.email as string) || undefined,
      specialty: (req.query.specialty as string) || undefined,
      status: (req.query.status as any) || undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: (req.query.sortBy as string) || undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Doctor list fetched',
      pagination: result.pagination,
      data: result.data,
    });
  }),

  blockDoctor: catchAsync(async (req: Request, res: Response) => {
    const updated = await DoctorService.blockDoctor(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Doctor blocked',
      data: updated,
    });
  }),

  unblockDoctor: catchAsync(async (req: Request, res: Response) => {
    const updated = await DoctorService.unblockDoctor(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Doctor unblocked',
      data: updated,
    });
  }),

  deleteDoctor: catchAsync(async (req: Request, res: Response) => {
    const deleted = await DoctorService.deleteDoctor(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Doctor deleted',
      data: deleted,
    });
  }),

  updateDoctor: catchAsync(async (req: Request, res: Response) => {
    const updated = await DoctorService.updateDoctorProfile(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Doctor updated',
      data: updated,
    });
  }),
};