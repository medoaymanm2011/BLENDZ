import { Category } from '@/models/Category';
import { z } from 'zod';
import { createCategorySchema, updateCategorySchema } from '@/server/validators/categories';

export async function listCategories() {
  return Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function createCategory(input: z.infer<typeof createCategorySchema>) {
  const data = createCategorySchema.parse(input);
  return Category.create(data);
}

export async function updateCategory(id: string, input: z.infer<typeof updateCategorySchema>) {
  const data = updateCategorySchema.parse(input);
  return Category.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteCategory(id: string) {
  return Category.findByIdAndDelete(id);
}
