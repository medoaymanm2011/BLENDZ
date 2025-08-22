import { z } from 'zod';

export const updateUserSchema = z.object({
  role: z.enum(['admin', 'user']).optional(),
  active: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
