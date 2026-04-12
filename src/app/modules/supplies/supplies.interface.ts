import { Types } from 'mongoose';

export type Supply = {
  _id?: Types.ObjectId;
  name: string;
  category?: string;
  unit?: string;
  manufacturer?: string;
  isActive: boolean;
  createdBy?: Types.ObjectId;
};
