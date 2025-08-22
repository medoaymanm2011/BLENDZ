import { Product } from '@/models/Product';
import { z } from 'zod';
import { createProductSchema, updateProductSchema } from '@/server/validators/products';

type ListFilters = {
  categoryIds?: string[];
  brandIds?: string[];
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
};

export async function listProducts(filters: ListFilters = {}) {
  const { categoryIds, brandIds, q, minPrice, maxPrice, sort } = filters;
  const query: any = {};
  if (categoryIds && categoryIds.length) query.categoryId = { $in: categoryIds };
  if (brandIds && brandIds.length) query.brandId = { $in: brandIds };
  if (typeof minPrice === 'number') query.price = { ...(query.price || {}), $gte: minPrice };
  if (typeof maxPrice === 'number') query.price = { ...(query.price || {}), $lte: maxPrice };
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    query.$or = [{ name: regex }, { slug: regex }, { sku: regex }];
  }

  let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === 'price_asc') sortObj = { price: 1 };
  else if (sort === 'price_desc') sortObj = { price: -1 };
  else if (sort === 'name_asc') sortObj = { name: 1 };
  else if (sort === 'name_desc') sortObj = { name: -1 };

  return Product.find(query).sort(sortObj).lean();
}

export async function getProductBySlug(slug: string) {
  if (!slug || typeof slug !== 'string') return null;
  return Product.findOne({ slug }).lean();
}

export async function getProductById(id: string) {
  if (!id || typeof id !== 'string') return null;
  try {
    return await Product.findById(id).lean();
  } catch {
    return null;
  }
}

export async function createProduct(input: z.infer<typeof createProductSchema>) {
  const data = createProductSchema.parse(input);
  return Product.create(data);
}

export async function updateProduct(id: string, input: z.infer<typeof updateProductSchema>) {
  const data = updateProductSchema.parse(input);
  return Product.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteProduct(id: string) {
  return Product.findByIdAndDelete(id);
}
