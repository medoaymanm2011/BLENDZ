import { Schema, models, model } from 'mongoose';

export interface IBrand {
  _id?: string;
  name: string;
  slug: string;
  color?: string;
  image?: string; // logo URL
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    color: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Brand = models.Brand || model<IBrand>('Brand', BrandSchema);
