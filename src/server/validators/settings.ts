import { z } from 'zod';

export const shippingMethodSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0),
  enabled: z.boolean().optional(),
});

export const settingsSchema = z.object({
  storeName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  currencies: z.array(z.string().min(1)).min(1).optional(),
  defaultCurrency: z.string().min(1).optional(),
  payments: z.object({
    cod: z.boolean().optional(),
    stripeEnabled: z.boolean().optional(),
  }).optional(),
  shippingMethods: z.array(shippingMethodSchema).optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
