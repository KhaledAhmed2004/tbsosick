import { PipelineStage, Types } from 'mongoose';
import { User } from '../user/user.model';
import { PreferenceCardModel } from '../preference-card/preference-card.model';
import { Subscription } from '../subscription/subscription.model';
import { IUser, USER_ROLES, USER_STATUS } from '../user/user.interface';
import { paginationHelper } from '../../../helpers/paginationHelper';

type SearchParams = {
  search?: string;
  email?: string;
  specialty?: string;
  status?: USER_STATUS;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export const DoctorService = {
  async createDoctor(payload: Partial<IUser>) {
    const docPayload: Partial<IUser> = {
      name: payload.name!,
      email: payload.email!,
      password: payload.password!,
      phone: payload.phone,
      specialty: payload.specialty,
      hospital: payload.hospital,
      location: payload.location,
      gender: payload.gender as any,
      dateOfBirth: payload.dateOfBirth as any,
      profilePicture: payload.profilePicture,
      role: USER_ROLES.USER,
    } as any;

    const user = await User.create(docPayload as any);
    const plain = user.toObject();
    delete (plain as any).password;
    return plain as IUser;
  },
  async searchDoctors(params: SearchParams) {
    const { search, email, specialty, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const { page, limit, skip } = paginationHelper.calculatePagination({
      page: params.page,
      limit: params.limit,
      sortBy,
      sortOrder,
    });

    const match: Record<string, any> = {};
    if (status) match.status = status;
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
          from: Subscription.collection.name,
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
          specialties: 1,
          cardsCount: 1,
          subscriptionStatus: 1,
          subscriptionPlan: 1,
          createdAt: 1,
        },
      },
    ];

    const sortStage: PipelineStage = {
      $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
    };

    const paginatedPipeline: PipelineStage[] = [
      ...basePipeline,
      sortStage,
      { $skip: skip },
      { $limit: limit },
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
      data,
      pagination: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
    };
  },

  async blockDoctor(id: string) {
    return User.findByIdAndUpdate(id, { status: USER_STATUS.RESTRICTED }, { new: true });
  },

  async unblockDoctor(id: string) {
    return User.findByIdAndUpdate(id, { status: USER_STATUS.ACTIVE }, { new: true });
  },

  async deleteDoctor(id: string) {
    // Optionally, cascade delete their preference cards (commented to keep minimal)
    // await PreferenceCardModel.deleteMany({ createdBy: id });
    return User.findByIdAndDelete(id);
  },

  async updateDoctorProfile(id: string, payload: Partial<Pick<IUser, 'name' | 'email' | 'phone' | 'specialty' | 'hospital' | 'location'>>) {
    const user = await User.findById(id).select('+password'); // ensure hooks run properly
    if (!user) return null;
    // Ensure target is a doctor
    // In SUPER_ADMIN-only system, allow update for existing users

    // Whitelist allowed fields
    if (payload.name !== undefined) (user as any).name = payload.name;
    if (payload.email !== undefined) (user as any).email = payload.email;
    if (payload.phone !== undefined) (user as any).phone = payload.phone;
    if (payload.specialty !== undefined) (user as any).specialty = payload.specialty;
    if (payload.hospital !== undefined) (user as any).hospital = payload.hospital;
    if (payload.location !== undefined) (user as any).location = payload.location;

    // Do NOT change password here
    await user.save();
    // Return without password field
    const plain = user.toObject();
    delete (plain as any).password;
    return plain as IUser;
  },
};