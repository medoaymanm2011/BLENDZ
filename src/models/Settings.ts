import { Schema, model, models } from 'mongoose';

export interface IShippingMethod {
  code: string; // e.g. 'standard', 'express'
  name: string;
  price: number; // flat price
  enabled: boolean;
}

export interface ISettings {
  key?: string; // singleton key
  storeName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  currencies?: string[]; // e.g. ['EGP','USD']
  defaultCurrency?: string; // e.g. 'EGP'
  payments?: {
    cod?: boolean;
    stripeEnabled?: boolean;
  };
  shippingMethods?: IShippingMethod[];
  updatedAt?: Date;
  createdAt?: Date;
}

const ShippingMethodSchema = new Schema<IShippingMethod>({
  code: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  enabled: { type: Boolean, default: true },
}, { _id: false });

const SettingsSchema = new Schema<ISettings>({
  key: { type: String, index: true, unique: true },
  storeName: { type: String },
  contactEmail: { type: String },
  phone: { type: String },
  address: { type: String },
  currencies: { type: [String], default: ['EGP'] },
  defaultCurrency: { type: String, default: 'EGP' },
  payments: {
    cod: { type: Boolean, default: true },
    stripeEnabled: { type: Boolean, default: false },
  },
  shippingMethods: { type: [ShippingMethodSchema], default: [] },
}, { timestamps: true });

export const Settings = models.Settings || model<ISettings>('Settings', SettingsSchema);
