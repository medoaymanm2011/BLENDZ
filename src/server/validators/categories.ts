import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  parentId: z.string().nullable().optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0).optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
