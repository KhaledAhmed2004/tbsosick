import { Types } from 'mongoose';

export type Suture = {
  _id?: Types.ObjectId;
  name: string;
  category?: string;
  unit?: string;
  manufacturer?: string;
  isActive: boolean;
  createdBy?: Types.ObjectId;
};
