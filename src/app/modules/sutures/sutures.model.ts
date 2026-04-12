import { Schema, model } from 'mongoose';
import { Suture } from './sutures.interface';

const SutureSchema = new Schema<Suture>(
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

export const SutureModel = model<Suture>('Suture', SutureSchema);
