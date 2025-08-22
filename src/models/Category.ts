import { Schema, models, model } from 'mongoose';

export interface ICategory {
  _id?: string;
  name: string;
  slug: string;
  parentId?: string | null;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parentId: { type: String, default: null },
    image: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = models.Category || model<ICategory>('Category', CategorySchema);
