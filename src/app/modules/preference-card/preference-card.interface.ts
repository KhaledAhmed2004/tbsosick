import { Types } from 'mongoose';

export type SurgeonInfo = {
  fullName: string;
  handPreference: string;
  specialty: string;
  contactNumber: string;
  musicPreference: string;
};

export type SupplyItem = {
  supply: Types.ObjectId;
  quantity: number;
};

export type SutureItem = {
  suture: Types.ObjectId;
  quantity: number;
};

export type PreferenceCard = {
  createdBy: Types.ObjectId;
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
  visibility: 'PUBLIC' | 'PRIVATE';
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  isDeleted?: boolean;
};

export type PreferenceCardDownload = {
  userId: Types.ObjectId;
  cardId: Types.ObjectId;
  downloadDate: string; // YYYY-MM-DD
};
