import { HomeSection, IHomeSection } from '@/models/HomeSection';
import { z } from 'zod';
import { createHomeSectionSchema, updateHomeSectionSchema } from '@/server/validators/homeSections';

export async function listHomeSections(params?: { includeDisabled?: boolean; locale?: 'ar' | 'en' }) {
  const q: any = {};
  if (!params?.includeDisabled) q.enabled = true;
  if (params?.locale) {
    q.$or = [{ localeMode: 'all' }, { localeMode: params.locale }];
  }
  const sections = await HomeSection.find(q).sort({ order: 1, createdAt: -1 }).lean();
  return sections;
}

export async function createHomeSection(input: z.infer<typeof createHomeSectionSchema>) {
  const data = createHomeSectionSchema.parse(input);
  const exists = await HomeSection.findOne({ slug: data.slug });
  if (exists) throw new Error('Slug already exists');
  const section = await HomeSection.create(data);
  return section;
}

export async function updateHomeSection(id: string, input: z.infer<typeof updateHomeSectionSchema>) {
  const data = updateHomeSectionSchema.parse(input);
  if (data.slug) {
    const exists = await HomeSection.findOne({ slug: data.slug, _id: { $ne: id } });
    if (exists) throw new Error('Slug already exists');
  }
  const section = await HomeSection.findByIdAndUpdate(id, data, { new: true });
  return section;
}

export async function deleteHomeSection(id: string) {
  await HomeSection.findByIdAndDelete(id);
  return { ok: true };
}
