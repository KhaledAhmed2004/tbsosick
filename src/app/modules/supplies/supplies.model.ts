import { Schema, model } from 'mongoose';
import { Supply } from './supplies.interface';

const SupplySchema = new Schema<Supply>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    category: { type: String, trim: true, index: true },
    unit: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const SupplyModel = model<Supply>('Supply', SupplySchema);
