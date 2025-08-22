import { Schema, model, models, Types } from 'mongoose';

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';

export interface IOrderItem {
  productId: string; // Product._id as string
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface ITrackingEvent {
  ts: Date;
  status: OrderStatus | string;
  note?: string;
}

export interface IOrder {
  _id?: string;
  userId?: string | null;
  customerEmail?: string | null;
  shippingInfo: {
    name: string;
    phone: string;
    city?: string;
    address?: string;
    notes?: string;
  };
  items: IOrderItem[];
  totals: {
    subtotal: number;
    shipping: number;
    total: number;
    currency: string;
  };
  payment: {
    method: string; // e.g. 'cod'
    status: PaymentStatus;
  };
  status: OrderStatus;
  tracking?: {
    number?: string;
    provider?: string;
    history?: ITrackingEvent[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
  image: { type: String },
}, { _id: false });

const TrackingEventSchema = new Schema<ITrackingEvent>({
  ts: { type: Date, required: true },
  status: { type: String, required: true },
  note: { type: String },
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  userId: { type: String, default: null },
  customerEmail: { type: String, default: null },
  shippingInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String },
    address: { type: String },
    notes: { type: String },
  },
  items: { type: [OrderItemSchema], required: true },
  totals: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, required: true, default: 'EGP' },
  },
  payment: {
    method: { type: String, required: true, default: 'cod' },
    status: { type: String, required: true, default: 'pending' },
  },
  status: { type: String, required: true, default: 'processing' },
  tracking: {
    number: { type: String },
    provider: { type: String },
    history: { type: [TrackingEventSchema], default: [] },
  },
}, { timestamps: true });

export const Order = models.Order || model<IOrder>('Order', OrderSchema);
