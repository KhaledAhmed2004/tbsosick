import { Schema, model } from 'mongoose';
import { ISpecialty } from './specialty.interface';

const SpecialtySchema = new Schema<ISpecialty>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const SpecialtyModel = model<ISpecialty>('Specialty', SpecialtySchema);
