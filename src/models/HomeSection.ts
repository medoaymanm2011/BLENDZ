import mongoose, { Schema, Document, Model } from 'mongoose';

export type SectionType =
  | 'featured'
  | 'sale'
  | 'new'
  | 'bestseller'
  | 'recommended'
  | 'custom_query';

export interface IHomeSection extends Document {
  titleAr: string;
  titleEn: string;
  slug: string; // unique key
  type: SectionType;
  filters?: Record<string, any>; // optional flexible filters (brandIds, categoryIds, priceRange, tags...)
  sort?: 'newest' | 'topSelling' | 'priceAsc' | 'priceDesc' | 'custom';
  limit: number;
  enabled: boolean;
  order: number; // sort order on homepage
  localeMode: 'all' | 'ar' | 'en';
  createdAt: Date;
  updatedAt: Date;
}

const HomeSectionSchema = new Schema<IHomeSection>(
  {
    titleAr: { type: String, required: true, trim: true },
    titleEn: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: ['featured', 'sale', 'new', 'bestseller', 'recommended', 'custom_query'],
      required: true,
    },
    filters: { type: Schema.Types.Mixed, default: {} },
    sort: { type: String, enum: ['newest', 'topSelling', 'priceAsc', 'priceDesc', 'custom'], default: 'newest' },
    limit: { type: Number, default: 12, min: 1, max: 60 },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 100 },
    localeMode: { type: String, enum: ['all', 'ar', 'en'], default: 'all' },
  },
  { timestamps: true }
);

export const HomeSection: Model<IHomeSection> =
  mongoose.models.HomeSection || mongoose.model<IHomeSection>('HomeSection', HomeSectionSchema);
