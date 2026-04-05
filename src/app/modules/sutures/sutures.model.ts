import { Schema, model } from 'mongoose';
import { Suture } from './sutures.interface';

const SutureSchema = new Schema<Suture>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
  },
  { timestamps: true },
);

export const SutureModel = model<Suture>('Suture', SutureSchema);