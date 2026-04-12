import { Schema, model } from 'mongoose';
import { FavoriteModel, IFavorite } from './favorite.interface';

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'PreferenceCard',
      required: true,
      index: true,
    },
  },
  // Favorites are never "updated" — they exist or they're deleted. No
  // need to carry an `updatedAt` field that will always equal `createdAt`.
  { timestamps: { createdAt: true, updatedAt: false } },
);

// One favorite per (user, card) pair — idempotent favorite action.
FavoriteSchema.index({ userId: 1, cardId: 1 }, { unique: true });

export const Favorite = model<IFavorite, FavoriteModel>('Favorite', FavoriteSchema);
