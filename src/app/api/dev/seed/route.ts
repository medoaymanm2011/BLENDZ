import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { requireAdmin } from '@/server/middleware/auth';
import { brands as staticBrands } from '@/data/brands';
import { categories as staticCategories } from '@/data/categories';
import { Brand } from '@/models/Brand';
import { Category } from '@/models/Category';

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    await connectToDB();

    // Seed Brands (upsert by slug)
    const brandResults: string[] = [];
    for (const b of staticBrands) {
      const existing = await Brand.findOne({ slug: b.slug });
      if (existing) {
        brandResults.push(`exists:${b.slug}`);
        continue;
      }
      await Brand.create({ name: b.name, slug: b.slug, image: b.image, color: b.color });
      brandResults.push(`created:${b.slug}`);
    }

    // Seed Categories (upsert by slug) — using English name as single name field
    const categoryResults: string[] = [];
    for (const c of staticCategories) {
      const existing = await Category.findOne({ slug: c.slug });
      if (existing) {
        categoryResults.push(`exists:${c.slug}`);
        continue;
      }
      await Category.create({ name: c.name.en, slug: c.slug, image: c.image });
      categoryResults.push(`created:${c.slug}`);
    }

    return NextResponse.json({ ok: true, brands: brandResults, categories: categoryResults });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Seed error' }, { status: 400 });
  }
}
