import { Schema, model } from 'mongoose';
import { EVENT_TYPE, IEvent, IPersonnel } from './event.interface';

const PersonnelSchema = new Schema<IPersonnel>(
  {
    leadSurgeon: { type: String, required: true },
    surgicalTeam: { type: [String], required: true },
  },
  { _id: false }, // prevent creating _id for subdocument
);

const EventSchema = new Schema<IEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    durationHours: { type: Number, required: true },
    eventType: {
      type: String,
      enum: Object.values(EVENT_TYPE),
      required: true,
    },
    location: { type: String },
    preferenceCard: { type: Schema.Types.ObjectId, ref: 'PreferenceCard' },
    notes: { type: String },
    personnel: { type: PersonnelSchema },
  },
  {
    timestamps: true,
  },
);

EventSchema.index({ userId: 1, date: -1 });

const EventModel = model<IEvent>('Event', EventSchema);

export default EventModel;
