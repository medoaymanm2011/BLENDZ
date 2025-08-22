import { z } from 'zod';

export const createSlideSchema = z.object({
  imageUrl: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaType: z.enum(['none', 'scroll', 'link']).default('none').optional(),
  ctaTarget: z.string().nullable().optional(),
  order: z.number().int().min(0).default(0).optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateSlideSchema = createSlideSchema.partial();
