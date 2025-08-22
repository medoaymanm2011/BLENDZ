import { Schema, models, model } from 'mongoose';

export interface ISlide {
  _id?: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaType?: 'none' | 'scroll' | 'link';
  ctaTarget?: string | null; // e.g., #home-products or /category/all
  order?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const SlideSchema = new Schema<ISlide>(
  {
    imageUrl: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    ctaText: { type: String },
    ctaType: { type: String, enum: ['none', 'scroll', 'link'], default: 'none' },
    ctaTarget: { type: String, default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Slide = models.Slide || model<ISlide>('Slide', SlideSchema);
