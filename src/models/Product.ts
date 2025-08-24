import { Schema, models, model } from 'mongoose';

export interface IProductImage { url: string; alt?: string }
export interface IProduct {
  _id?: string;
  name: string;
  slug: string;
  brandId?: string | null;
  categoryId?: string | null;
  sku?: string | null;
  color?: string | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  description?: string;
  isFeatured?: boolean;
  images?: IProductImage[];
  sectionTypes?: ('featured' | 'sale' | 'new' | 'bestseller' | 'recommended')[];
  sectionSlugs?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  alt: { type: String },
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  brandId: { type: String, default: null },
  categoryId: { type: String, default: null },
  sku: { type: String, default: null },
  color: { type: String, default: null },
  price: { type: Number, required: true },
  salePrice: { type: Number, default: null },
  stock: { type: Number, required: true },
  description: { type: String },
  isFeatured: { type: Boolean, default: false },
  images: { type: [ProductImageSchema], default: [] },
  sectionTypes: { type: [String], enum: ['featured', 'sale', 'new', 'bestseller', 'recommended'], default: [] },
  sectionSlugs: { type: [String], default: [] },
}, { timestamps: true });

// Performance indexes for common filters and sorts
ProductSchema.index({ brandId: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ sectionTypes: 1 });
ProductSchema.index({ sectionSlugs: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ sku: 1 });

// Text index for search (used when query is textual)
ProductSchema.index(
  { name: 'text', slug: 'text', sku: 'text' },
  { weights: { name: 5, slug: 3, sku: 1 }, name: 'product_text_search' }
);

export const Product = models.Product || model<IProduct>('Product', ProductSchema);
