import { Brand } from '@/models/Brand';
import { z } from 'zod';
import { createBrandSchema, updateBrandSchema } from '@/server/validators/brands';

export async function listBrands() {
  return Brand.find({}).sort({ name: 1 }).lean();
}

export async function createBrand(input: z.infer<typeof createBrandSchema>) {
  const data = createBrandSchema.parse(input);
  return Brand.create(data);
}

export async function updateBrand(id: string, input: z.infer<typeof updateBrandSchema>) {
  const data = updateBrandSchema.parse(input);
  return Brand.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteBrand(id: string) {
  return Brand.findByIdAndDelete(id);
}
