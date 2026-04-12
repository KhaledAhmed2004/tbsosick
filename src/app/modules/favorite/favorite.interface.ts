import { Model, Types } from 'mongoose';

export type IFavorite = {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  cardId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export type FavoriteModel = Model<IFavorite>;
