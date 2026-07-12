import { Schema, model, Document, Model, Types } from 'mongoose';

export enum IdempotencyStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type IIdempotencyRecord = {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  key: string;
  operation: string;
  status: IdempotencyStatus;
  requestHash: string;
  response?: any;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface IdempotencyRecordModel extends Model<IIdempotencyRecord> {
  createIdempotently(
    payload: Omit<IIdempotencyRecord, 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<{ record: IIdempotencyRecord; isNew: boolean }>;
  markCompleted(
    userId: Types.ObjectId,
    key: string,
    operation: string,
    response?: any
  ): Promise<void>;
  markFailed(
    userId: Types.ObjectId,
    key: string,
    operation: string,
    errorResponse?: any
  ): Promise<void>;
}

const idempotencyRecordSchema = new Schema<IIdempotencyRecord>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    key: { type: String, required: true },
    operation: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(IdempotencyStatus),
      required: true,
      default: IdempotencyStatus.PROCESSING,
    },
    requestHash: { type: String, required: true },
    response: { type: Schema.Types.Mixed },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Amendment 2: Idempotency Record Unique Index
idempotencyRecordSchema.index(
  {
    userId: 1,
    key: 1,
    operation: 1,
  },
  {
    unique: true,
  }
);

// TTL index for expired idempotency records
idempotencyRecordSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

idempotencyRecordSchema.statics.createIdempotently = async function (
  payload: Omit<IIdempotencyRecord, 'createdAt' | 'updatedAt' | 'status'>
): Promise<{ record: IIdempotencyRecord; isNew: boolean }> {
  try {
    const record = await this.create({
      ...payload,
      status: IdempotencyStatus.PROCESSING,
    });
    return { record: record.toObject(), isNew: true };
  } catch (err: any) {
    if (err.code !== 11000) throw err;

    // FAILED হলে atomically reclaim করো, COMPLETED/PROCESSING হলে শুধু read করো
    const reclaimed = await this.findOneAndUpdate(
      {
        userId: payload.userId,
        key: payload.key,
        operation: payload.operation,
        status: IdempotencyStatus.FAILED,
      },
      {
        $set: {
          status: IdempotencyStatus.PROCESSING,
          requestHash: payload.requestHash,
        },
      },
      { new: true }
    );

    if (reclaimed) return { record: reclaimed.toObject(), isNew: true };

    const existing = await this.findOne({
      userId: payload.userId,
      key: payload.key,
      operation: payload.operation,
    });

    if (!existing) {
      throw new Error('Idempotency record duplicate key error, but record not found');
    }

    if (existing.requestHash !== payload.requestHash) {
      const domainError = new Error('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST');
      (domainError as any).code = 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST';
      throw domainError;
    }

    return { record: existing.toObject(), isNew: false };
  }
};

idempotencyRecordSchema.statics.markCompleted = async function (
  userId: Types.ObjectId,
  key: string,
  operation: string,
  response?: any
) {
  await this.updateOne(
    { userId, key, operation },
    { $set: { status: IdempotencyStatus.COMPLETED, response } }
  );
};

idempotencyRecordSchema.statics.markFailed = async function (
  userId: Types.ObjectId,
  key: string,
  operation: string,
  errorResponse?: any
) {
  await this.updateOne(
    { userId, key, operation },
    { $set: { status: IdempotencyStatus.FAILED, response: errorResponse } }
  );
};

export const IdempotencyRecord = model<IIdempotencyRecord, IdempotencyRecordModel>(
  'IdempotencyRecord',
  idempotencyRecordSchema
);
