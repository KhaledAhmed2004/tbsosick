import { Schema, model } from 'mongoose';
import { Supply } from './supplies.interface';

const SupplySchema = new Schema<Supply>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
  },
  { timestamps: true },
);

export const SupplyModel = model<Supply>('Supply', SupplySchema);