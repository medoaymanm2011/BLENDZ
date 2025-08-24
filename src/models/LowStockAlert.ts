import mongoose, { Schema, model, models } from 'mongoose';

export interface ILowStockAlert {
  productId?: string;
  slug?: string;
  stock?: number;
  at?: Date;
}

const LowStockAlertSchema = new Schema<ILowStockAlert>({
  productId: { type: String },
  slug: { type: String },
  stock: { type: Number },
  at: { type: Date, default: () => new Date() },
}, { timestamps: false, versionKey: false, collection: 'low_stock_alerts' });

export const LowStockAlert = models.LowStockAlert || model<ILowStockAlert>('LowStockAlert', LowStockAlertSchema);
