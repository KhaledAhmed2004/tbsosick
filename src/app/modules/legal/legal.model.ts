import { Schema, model } from 'mongoose';
import { LegalPage } from './legal.interface';

const LegalPageSchema = new Schema<LegalPage>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const LegalPageModel = model<LegalPage>('LegalPage', LegalPageSchema);
