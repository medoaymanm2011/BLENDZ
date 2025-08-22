import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  color: z.string().optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateBrandSchema = createBrandSchema.partial();
