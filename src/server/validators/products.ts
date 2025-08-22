import { z } from 'zod';

export const productImageSchema = z.object({ url: z.string().url(), alt: z.string().optional() });

export const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  brandId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  price: z.number().min(0),
  salePrice: z.number().nullable().optional(),
  stock: z.number().int().min(0),
  description: z.string().optional(),
  isFeatured: z.boolean().optional(),
  images: z.array(productImageSchema).optional(),
  sectionTypes: z.array(z.enum(['featured', 'sale', 'new', 'bestseller', 'recommended'])).optional(),
  sectionSlugs: z.array(z.string().min(1)).optional(),
});

export const updateProductSchema = createProductSchema.partial();
