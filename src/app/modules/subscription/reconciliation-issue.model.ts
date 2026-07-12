import { Schema, model, Document, Model, Types } from 'mongoose';

export enum ReconciliationStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

export enum ReconciliationCode {
  RECONCILIATION_AUTO_REPAIRED = 'RECONCILIATION_AUTO_REPAIRED',
  RECONCILIATION_NO_CANDIDATE = 'RECONCILIATION_NO_CANDIDATE',
  RECONCILIATION_MULTIPLE_CANDIDATES = 'RECONCILIATION_MULTIPLE_CANDIDATES',
  RECONCILIATION_OWNERSHIP_CONFLICT = 'RECONCILIATION_OWNERSHIP_CONFLICT',
  RECONCILIATION_ENVIRONMENT_CONFLICT = 'RECONCILIATION_ENVIRONMENT_CONFLICT',
  RECONCILIATION_CANONICAL_IDENTITY_CONFLICT = 'RECONCILIATION_CANONICAL_IDENTITY_CONFLICT',
  RECONCILIATION_MANUAL_REVIEW_REQUIRED = 'RECONCILIATION_MANUAL_REVIEW_REQUIRED',
}

export type IReconciliationIssue = {
  _id?: Types.ObjectId;
  reconciliationCode: ReconciliationCode;
  evidence: Record<string, any>;
  status: ReconciliationStatus;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReconciliationIssueModel = Model<IReconciliationIssue>;

const reconciliationIssueSchema = new Schema<IReconciliationIssue>(
  {
    reconciliationCode: {
      type: String,
      enum: Object.values(ReconciliationCode),
      required: true,
    },
    evidence: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ReconciliationStatus),
      required: true,
      default: ReconciliationStatus.OPEN,
    },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const ReconciliationIssue = model<IReconciliationIssue, ReconciliationIssueModel>(
  'ReconciliationIssue',
  reconciliationIssueSchema
);
