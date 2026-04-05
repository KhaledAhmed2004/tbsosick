import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import { USER_STATUS } from '../../../enums/user';
import { JwtPayload } from 'jsonwebtoken';

const createUser = catchAsync(async (req: Request, res: Response) => {
  const { ...userData } = req.body;
  const result = await UserService.createUserToDB(userData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'User created successfully',
    data: result,
  });
});

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getUserProfileFromDB(user as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  // All files + text data are in req.body
  const payload = { ...req.body };

  const result = await UserService.updateProfileToDB(
    user as JwtPayload,
    payload,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: USER_STATUS };

  const result = await UserService.updateUserStatus(id, status);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `User status updated to ${status}`,
    data: result,
  });
});

const adminUpdateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = { ...req.body };
  const result = await UserService.updateUserByAdmin(id, payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User updated successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteUserPermanently(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User permanently deleted',
    data: result,
  });
});

const getAllUserRoles = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUserRoles(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User roles retrieved successfully',
    pagination: result.pagination,
    data: result.data,
  });
});

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.updateUserStatus(id, USER_STATUS.RESTRICTED);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User blocked successfully',
    data: result,
  });
});

const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.updateUserStatus(id, USER_STATUS.ACTIVE);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User unblocked successfully',
    data: result,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await UserService.getUserById(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User data retrieved successfully',
    data: result,
  });
});

const getUserDetailsById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await UserService.getUserDetailsById(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User details retrieved successfully',
    data: result,
  });
});

export const UserController = {
  createUser,
  getUserProfile,
  updateProfile,
  getAllUserRoles,
  updateUserStatus,
  adminUpdateUser,
  deleteUser,
  blockUser,
  unblockUser,
  getUserById,
  getUserDetailsById,
};
