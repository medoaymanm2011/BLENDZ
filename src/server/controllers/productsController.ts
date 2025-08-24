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
  sectionTypes?: Array<'featured' | 'sale' | 'new' | 'bestseller' | 'recommended'>;
  sectionSlug?: string;
  page?: number;
  pageSize?: number;
  fields?: string[]; // projection
};

export async function listProducts(filters: ListFilters = {}) {
  const { categoryIds, brandIds, q, minPrice, maxPrice, sort, sectionTypes, sectionSlug, page, pageSize, fields } = filters;
  const query: any = {};
  if (categoryIds && categoryIds.length) query.categoryId = { $in: categoryIds };
  if (brandIds && brandIds.length) query.brandId = { $in: brandIds };
  if (sectionTypes && sectionTypes.length) query.sectionTypes = { $in: sectionTypes };
  if (sectionSlug && sectionSlug.trim()) query.sectionSlugs = sectionSlug.trim();
  if (typeof minPrice === 'number') query.price = { ...(query.price || {}), $gte: minPrice };
  if (typeof maxPrice === 'number') query.price = { ...(query.price || {}), $lte: maxPrice };
  let useText = false;
  if (q && q.trim()) {
    const search = q.trim();
    // Prefer text search when possible (fast with index); fallback to regex if too short
    if (search.length >= 2) {
      query.$text = { $search: search };
      useText = true;
    } else {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { slug: regex }, { sku: regex }];
    }
  }

  let sortObj: Record<string, 1 | -1> | undefined = { createdAt: -1 };
  if (sort === 'price_asc') sortObj = { price: 1 };
  else if (sort === 'price_desc') sortObj = { price: -1 };
  else if (sort === 'name_asc') sortObj = { name: 1 };
  else if (sort === 'name_desc') sortObj = { name: -1 };
  // When using text search, prioritize textScore unless explicit sort provided
  if (useText && (!sort || sort === 'newest')) {
    sortObj = { score: -1 as any, createdAt: -1 } as any;
  }
  const projection = fields && fields.length
    ? fields.join(' ')
    : // default compact fields for listing
      'name slug price salePrice stock images sectionTypes sectionSlugs brandId categoryId createdAt';

  const pageNum = Math.max(1, page || 1);
  const limit = Math.min(100, Math.max(1, pageSize || 24));
  const skip = (pageNum - 1) * limit;

  const cursor = Product.find(query)
    .select({ ...(useText ? { score: { $meta: 'textScore' } } : {}), ...Object.fromEntries(projection.split(' ').map(f => [f, 1])) })
    .sort(useText ? { score: { $meta: 'textScore' }, ...(sortObj || {}) } as any : (sortObj || {}))
    .skip(skip)
    .limit(limit)
    .lean();

  const [items, total] = await Promise.all([
    cursor,
    Product.countDocuments(query),
  ]);

  return { items, total, page: pageNum, pageSize: limit };
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
  // Ensure slug is unique by suffixing -2, -3, ... if needed
  if (data.slug) {
    const base = data.slug;
    let candidate = base;
    let i = 1;
    // If slug already ends with -number, start incrementing from that number
    const m = base.match(/^(.*)-(\d+)$/);
    if (m) {
      candidate = m[1];
      i = parseInt(m[2], 10);
      // reset base to the part before numeric suffix
    }
    let finalSlug = base;
    // Try current candidate; if exists, append/increment
    while (await Product.exists({ slug: finalSlug })) {
      i += 1;
      finalSlug = `${candidate || base}-${i}`;
    }
    data.slug = finalSlug;
  }
  return Product.create(data);
}

export async function updateProduct(id: string, input: z.infer<typeof updateProductSchema>) {
  const data = updateProductSchema.parse(input);
  // If slug provided and changed, ensure uniqueness (excluding current doc)
  if (data.slug) {
    const base = data.slug;
    let candidate = base;
    let i = 1;
    const m = base.match(/^(.*)-(\d+)$/);
    if (m) {
      candidate = m[1];
      i = parseInt(m[2], 10);
    }
    let finalSlug = base;
    while (await Product.exists({ slug: finalSlug, _id: { $ne: id } as any })) {
      i += 1;
      finalSlug = `${candidate || base}-${i}`;
    }
    data.slug = finalSlug;
  }
  return Product.findByIdAndUpdate(id, data, { new: true });
}

export async function deleteProduct(id: string) {
  return Product.findByIdAndDelete(id);
}
