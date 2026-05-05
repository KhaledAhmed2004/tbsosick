import { Document, Types } from 'mongoose';

export enum EVENT_TYPE {
  SURGERY = 'SURGERY',
  MEETING = 'MEETING',
  CONSULTATION = 'CONSULTATION',
  OTHER = 'OTHER',
}

export interface IPersonnel {
  leadSurgeon: string;
  surgicalTeamMembers: string[];
}

export interface IEvent extends Document {
  userId: Types.ObjectId;
  title: string;
  startsAt: Date;
  endsAt: Date;
  durationInHours: number;
  eventType: EVENT_TYPE;
  location?: string;
  preferenceCard?: Types.ObjectId;
  keyNotes?: string;
  personnel?: IPersonnel;
}
