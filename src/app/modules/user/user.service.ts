import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_STATUS, USER_ROLES } from '../../../enums/user';
import { PipelineStage, Types } from 'mongoose';
import { PreferenceCardModel } from '../preference-card/preference-card.model';
import { Subscription as SubscriptionModel } from '../subscription/subscription.model';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { User } from './user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import AggregationBuilder from '../../builder/AggregationBuilder';
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
    meta: paginationInfo,
    data: users,
  };
};

const getUsersStats = async () => {
  const aggregationBuilder = new AggregationBuilder(User);
  
  // Overall user growth
  const totalStats = await aggregationBuilder.calculateGrowth({ period: 'month' });
  
  // Status based growth
  aggregationBuilder.reset();
  const activeStats = await aggregationBuilder.calculateGrowth({ 
    filter: { status: USER_STATUS.ACTIVE }, 
    period: 'month' 
  });
  
  aggregationBuilder.reset();
  const inactiveStats = await aggregationBuilder.calculateGrowth({ 
    filter: { status: USER_STATUS.INACTIVE }, 
    period: 'month' 
  });
  
  aggregationBuilder.reset();
  const blockedStats = await aggregationBuilder.calculateGrowth({ 
    filter: { status: USER_STATUS.RESTRICTED }, 
    period: 'month' 
  });

  const formatMetric = (stat: any) => ({
    value: stat.total,
    changePct: stat.growth,
    direction: stat.growthType === 'increase' ? 'up' : stat.growthType === 'decrease' ? 'down' : 'neutral',
  });

  return {
    meta: {
      comparisonPeriod: 'month',
    },
    totalUsers: formatMetric(totalStats),
    activeUsers: formatMetric(activeStats),
    inactiveUsers: formatMetric(inactiveStats),
    blockedUsers: formatMetric(blockedStats),
  };
};

const getAllUserRoles = async (query: Record<string, unknown>) => {
  const { search, email, role = USER_ROLES.USER, status, specialty, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
  
  const skip = (Number(page) - 1) * Number(limit);

  const match: Record<string, any> = {};
  if (status) match.status = status;
  if (role) match.role = role;
  if (email) match.email = { $regex: email, $options: 'i' };
  if (search) {
    match.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const basePipeline: PipelineStage[] = [
    { $match: match },
    // Lookup preference cards created by this user
    {
      $lookup: {
        from: PreferenceCardModel.collection.name,
        let: { userIdStr: { $toString: '$_id' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$createdBy', '$$userIdStr'] } } },
        ],
        as: 'cards',
      },
    },
    // Compute specialties and cards count
    {
      $addFields: {
        cardsCount: { $size: '$cards' },
        specialties: {
          $setDifference: [
            {
              $setUnion: [
                {
                  $map: {
                    input: '$cards',
                    as: 'c',
                    in: { $ifNull: ['$$c.surgeon.specialty', null] },
                  },
                },
                [],
              ],
            },
            [null],
          ],
        },
      },
    },
    // Optional specialty filter
    ...(specialty
      ? ([
          {
            $match: {
              specialties: { $elemMatch: { $regex: specialty, $options: 'i' } },
            },
          },
        ] as PipelineStage[])
      : []),
    // Lookup subscription status
    {
      $lookup: {
        from: SubscriptionModel.collection.name,
        localField: '_id',
        foreignField: 'userId',
        as: 'subscription',
      },
    },
    {
      $addFields: {
        subscriptionStatus: {
          $ifNull: [{ $arrayElemAt: ['$subscription.status', 0] }, 'inactive'],
        },
        subscriptionPlan: {
          $ifNull: [{ $arrayElemAt: ['$subscription.plan', 0] }, 'FREE'],
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        specialty: 1,
        hospital: 1,
        status: 1,
        verified: 1,
        role: 1,
        profilePicture: 1,
        specialties: 1,
        cardsCount: 1,
        subscriptionStatus: 1,
        subscriptionPlan: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const sortStage: PipelineStage = {
    $sort: { [sortBy as string]: sortOrder === 'desc' ? -1 : 1 },
  };

  const paginatedPipeline: PipelineStage[] = [
    ...basePipeline,
    sortStage,
    { $skip: skip },
    { $limit: Number(limit) },
  ];

  const countPipeline: PipelineStage[] = [
    ...basePipeline,
    { $count: 'total' },
  ];

  const [data, countResult] = await Promise.all([
    User.aggregate(paginatedPipeline),
    User.aggregate(countPipeline),
  ]);

  const total = countResult[0]?.total || 0;
  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage: Math.ceil(total / Number(limit)),
    },
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
  getUsersStats,
};
