import { Types } from 'mongoose';

export type SurgeonInfo = {
  fullName: string;
  handPreference: string;
  specialty: string;
  contactNumber: string;
  musicPreference: string;
};

export type SupplyItem = {
  name: Types.ObjectId;
  quantity: number;
};

export type SutureItem = {
  name: Types.ObjectId;
  quantity: number;
};

export type PreferenceCard = {
  createdBy: string;
  cardTitle: string;
  surgeon: SurgeonInfo;
  medication: string;
  supplies: SupplyItem[];
  sutures: SutureItem[];
  instruments: string;
  positioningEquipment: string;
  prepping: string;
  workflow: string;
  keyNotes: string;
  photoLibrary: string[];
  downloadCount: number;
  published: boolean;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
};
