import { Document, Types } from 'mongoose';

export enum EVENT_TYPE {
  SURGERY = 'SURGERY',
  MEETING = 'MEETING',
  CONSULTATION = 'CONSULTATION',
  OTHER = 'OTHER',
}

export interface IPersonnel {
  leadSurgeon: string;
  surgicalTeam: string[];
}

export interface IEvent extends Document {
  userId: Types.ObjectId;
  title: string;
  startsAt: Date;
  endsAt: Date;
  eventType: EVENT_TYPE;
  location?: string;
  preferenceCard?: Types.ObjectId;
  notes?: string;
  personnel?: IPersonnel;
}
