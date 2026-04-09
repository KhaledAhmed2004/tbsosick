import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import { USER_STATUS } from '../../../enums/user';
import { JwtPayload } from 'jsonwebtoken';
import { PreferenceCardService } from '../preference-card/preference-card.service';

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

const getFavoriteCards = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  
  const result = await PreferenceCardService.listFavoritePreferenceCardsForUserFromDB(
    (user as any).id,
    req.query,
  );

  const favoriteCardIds = await PreferenceCardService.getFavoriteCardIdsForUser((user as any).id);
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
    message: result.data.length > 0 ? 'Favorite preference cards retrieved successfully' : 'No favorite cards found.',
    meta: result.meta,
    data: summarized,
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
  const { userId } = req.params;
  const { status } = req.body as { status: USER_STATUS };

  const result = await UserService.updateUserStatus(userId, status);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User status updated',
    data: result,
  });
});

const adminUpdateUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const payload = { ...req.body };
  const result = await UserService.updateUserByAdmin(userId, payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User updated',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await UserService.deleteUserPermanently(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User deleted',
    data: result,
  });
});

const getAllUserRoles = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUserRoles(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User list fetched',
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await UserService.getUserById(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User data retrieved',
    data: result,
  });
});

const getUserDetailsById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await UserService.getUserDetailsById(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User details retrieved successfully',
    data: result,
  });
});

const getUsersStats = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUsersStats();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User statistics retrieved',
    data: result,
  });
});

export const UserController = {
  createUser,
  getUserProfile,
  getFavoriteCards,
  updateProfile,
  getAllUserRoles,
  updateUserStatus,
  adminUpdateUser,
  deleteUser,
  getUserById,
  getUserDetailsById,
  getUsersStats,
};
