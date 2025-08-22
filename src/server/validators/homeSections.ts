import { z } from 'zod';

export const sectionTypeEnum = z.enum([
  'featured',
  'sale',
  'new',
  'bestseller',
  'recommended',
  'custom_query',
]);

export const sortEnum = z.enum(['newest', 'topSelling', 'priceAsc', 'priceDesc', 'custom']);
export const localeModeEnum = z.enum(['all', 'ar', 'en']);

export const createHomeSectionSchema = z.object({
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9\-]+$/),
  type: sectionTypeEnum,
  filters: z.record(z.string(), z.any()).optional(),
  sort: sortEnum.optional(),
  limit: z.number().int().min(1).max(60).optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  localeMode: localeModeEnum.optional(),
});

export const updateHomeSectionSchema = createHomeSectionSchema.partial();
