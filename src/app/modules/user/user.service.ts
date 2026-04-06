import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_STATUS, USER_ROLES } from '../../../enums/user';
import { Types } from 'mongoose';
import { PreferenceCardModel } from '../preference-card/preference-card.model';
import { Subscription as SubscriptionModel } from '../subscription/subscription.model';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { User } from './user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { IUser } from './user.interface';

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  const createUser = await User.create({ ...payload, verified: true });
  if (!createUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  return createUser;
};

const getUserProfileFromDB = async (
  user: JwtPayload,
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>,
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // //unlink file here
  // if (payload.image) {
  //   unlinkFile(isExistUser.image);
  // }

  //unlink file here
  if (payload.profilePicture) {
    unlinkFile(isExistUser.profilePicture);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find(), query)
    .search(['name', 'email'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const users = await userQuery.modelQuery;
  const paginationInfo = await userQuery.getPaginationInfo();

  return {
    pagination: paginationInfo,
    data: users,
  };
};

const getAllUserRoles = async (query: Record<string, unknown>) => {
  const qb = new QueryBuilder(User.find({ role: USER_ROLES.USER }), query)
    .filter()
    .sort()
    .paginate();

  // Select core fields needed for listing
  const docs = (await qb.modelQuery
    .select('_id name email profilePicture status specialty hospital role')
    .lean()) as Array<any>;

  const paginationInfo = await qb.getPaginationInfo();

  // Build id arrays for lookups
  const idStrings = docs.map(d => (d._id ? d._id.toString() : null)).filter(Boolean) as string[];

  // Cards count per user (PreferenceCard.createdBy stores string userId)
  const cardCountsAgg = await PreferenceCardModel.aggregate([
    { $match: { createdBy: { $in: idStrings } } },
    { $group: { _id: '$createdBy', count: { $sum: 1 } } },
  ]);
  const cardCountsMap = new Map<string, number>();
  for (const item of cardCountsAgg) {
    cardCountsMap.set(item._id, item.count);
  }

  // Subscription per user
  const objectIds = idStrings.map(id => new Types.ObjectId(id));
  const subs = await SubscriptionModel.find({ userId: { $in: objectIds } })
    .select('userId plan status currentPeriodEnd')
    .lean();
  const subsMap = new Map<string, any>();
  for (const s of subs) {
    subsMap.set((s.userId as Types.ObjectId).toString(), {
      plan: s.plan,
      status: s.status,
      currentPeriodEnd: s.currentPeriodEnd ?? null,
    });
  }

  // Compose final response objects
  const data = docs.map(d => {
    const id = d._id?.toString() as string | undefined;
    return {
      _id: d._id,
      name: d.name,
      email: d.email,
      profilePicture: d.profilePicture,
      role: d.role,
      specialty: d.specialty ?? null,
      hospital: d.hospital ?? null,
      status: d.status,
      cards: id ? cardCountsMap.get(id) ?? 0 : 0,
      subscription: id ? subsMap.get(id) ?? null : null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  });

  return {
    pagination: paginationInfo,
    data,
  };
};

const updateUserStatus = async (id: string, status: USER_STATUS) => {
  const user = await User.isExistUserById(id);
  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  );

  return updatedUser;
};

const deleteUserPermanently = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const deletedUser = await User.findByIdAndDelete(id)
    .select('-password -authentication');
  return deletedUser;
};

const updateUserByAdmin = async (id: string, payload: Partial<IUser>) => {
  const user = await User.findById(id).select('+password');
  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // Whitelist fields admin can update (excluding password/auth info)
  if (payload.name !== undefined) (user as any).name = payload.name;
  if (payload.email !== undefined) (user as any).email = payload.email;
  if (payload.phone !== undefined) (user as any).phone = payload.phone;
  if (payload.country !== undefined) (user as any).country = payload.country;
  if (payload.specialty !== undefined) (user as any).specialty = payload.specialty;
  if (payload.hospital !== undefined) (user as any).hospital = payload.hospital;
  if (payload.location !== undefined) (user as any).location = payload.location;
  if (payload.gender !== undefined) (user as any).gender = payload.gender;
  if (payload.dateOfBirth !== undefined) (user as any).dateOfBirth = payload.dateOfBirth;
  if (payload.profilePicture !== undefined) (user as any).profilePicture = payload.profilePicture;
  if (payload.status !== undefined) (user as any).status = payload.status;
  if (payload.role !== undefined) (user as any).role = payload.role;

  await user.save();
  const plain = user.toObject();
  delete (plain as any).password;
  delete (plain as any).authentication;
  return plain as IUser;
};

const getUserById = async (id: string) => {
  // Only return user info; remove task/bid side data
  const user = await User.findById(id).select('-password -authentication');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }
  return { user };
};

const getUserDetailsById = async (id: string) => {
  const user = await User.findById(id).select('-password -authentication');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }
  return user;
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  getAllUsers,
  getAllUserRoles,
  updateUserStatus,
  updateUserByAdmin,
  deleteUserPermanently,
  getUserById,
  getUserDetailsById,
};
