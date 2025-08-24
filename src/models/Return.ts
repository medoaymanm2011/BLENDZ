import { Schema, model, models } from 'mongoose';

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'refunded';

export interface IReturnItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface IReturnHistoryEvent {
  ts: Date;
  status: ReturnStatus | string;
  note?: string;
}

export interface IReturn {
  _id?: string;
  orderId: string;
  userId?: string | null;
  reason?: string | null;
  notes?: string | null;
  attachments?: string[]; // URLs
  items?: IReturnItem[]; // optional subset; default all order items
  refundAmount?: number | null;
  status: ReturnStatus;
  history?: IReturnHistoryEvent[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ReturnItemSchema = new Schema<IReturnItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  image: { type: String },
}, { _id: false });

const ReturnHistorySchema = new Schema<IReturnHistoryEvent>({
  ts: { type: Date, required: true },
  status: { type: String, required: true },
  note: { type: String },
}, { _id: false });

const ReturnSchema = new Schema<IReturn>({
  orderId: { type: String, required: true },
  userId: { type: String, default: null },
  reason: { type: String, default: null },
  notes: { type: String, default: null },
  attachments: { type: [String], default: [] },
  items: { type: [ReturnItemSchema], default: undefined },
  refundAmount: { type: Number, default: null },
  status: { type: String, required: true, default: 'requested' },
  history: { type: [ReturnHistorySchema], default: [] },
}, { timestamps: true });

export const ReturnModel = models.Return || model<IReturn>('Return', ReturnSchema);
