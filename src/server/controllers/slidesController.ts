import { Slide } from '@/models/Slide';
import { z } from 'zod';
import { createSlideSchema, updateSlideSchema } from '@/server/validators/slides';

export async function listSlides() {
  const slides = await Slide.find({}).sort({ order: 1, createdAt: -1 }).lean();
  return slides;
}

export async function createSlide(input: z.infer<typeof createSlideSchema>) {
  const data = createSlideSchema.parse(input);
  const slide = await Slide.create(data);
  return slide;
}

export async function updateSlide(id: string, input: z.infer<typeof updateSlideSchema>) {
  const data = updateSlideSchema.parse(input);
  const slide = await Slide.findByIdAndUpdate(id, data, { new: true });
  return slide;
}

export async function deleteSlide(id: string) {
  const res = await Slide.findByIdAndDelete(id);
  return res;
}
