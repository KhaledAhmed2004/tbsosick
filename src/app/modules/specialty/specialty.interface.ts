import { Types } from 'mongoose';

export type ISpecialty = {
  _id?: Types.ObjectId;
  name: string;
  isActive: boolean;
};
