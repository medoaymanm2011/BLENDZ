export type Product = {
  id: number;
  slug: string;
  name: { ar: string; en: string };
  brandSlug: string;
  categorySlugs: string[];
  price: number;
  originalPrice?: number;
  images: string[]; // local public paths
  isNew?: boolean;
  discount?: number; // percentage
  tags?: Array<'featured' | 'sale' | 'new' | 'bestseller' | 'recommended'>;
};

// Local image pools from public/
const CASUAL = [
  '/CASUAL/photo-1434389677669-e08b4cac3105.avif',
  '/CASUAL/photo-1594633312681-425c7b97ccd1.avif',
  '/CASUAL/premium_photo-1669703777548-08503c3085a0.avif',
  '/CASUAL/premium_photo-1675186049419-d48f4b28fe7c.avif',
  '/CASUAL/premium_photo-1676031940533-8f1ac6a07268.avif',
];

const SHOES = [
  '/SHOES/istockphoto-1009996074-612x612.jpg',
  '/SHOES/photo-1518049362265-d5b2a6467637.avif',
  '/SHOES/photo-1543163521-1bf539c55dd2.avif',
  '/SHOES/photo-1590099033615-be195f8d575c.avif',
  '/SHOES/photo-1610398752800-146f269dfcc8.avif',
  '/SHOES/premium_photo-1671718111684-9142a70a5fe0.avif',
  '/SHOES/premium_photo-1673977133155-3b738590d58e.avif',
  '/SHOES/premium_photo-1676234844384-82e1830af724.avif',
  '/SHOES/premium_photo-1695604461285-09f2cf47ec80.avif',
  '/SHOES/premium_photo-1711051513016-72baa1035293.avif',
];

const BAGS = [
  '/BAGS/photo-1548036328-c9fa89d128fa.avif',
  '/BAGS/photo-1559563458-527698bf5295.avif',
  '/BAGS/photo-1566150905458-1bf1fc113f0d.avif',
  '/BAGS/photo-1584917865442-de89df76afd3.avif',
  '/BAGS/photo-1587467512961-120760940315.avif',
  '/BAGS/photo-1594223274512-ad4803739b7c.avif',
  '/BAGS/photo-1600857062241-98e5dba7f214.avif',
  '/BAGS/photo-1606522754091-a3bbf9ad4cb3.avif',
  '/BAGS/premium_photo-1670984076180-22a6c8f27f2b.avif',
  '/BAGS/premium_photo-1673384389924-097135cbf1cd.avif',
  '/BAGS/premium_photo-1678739395192-bfdd13322d34.avif',
];

const STALEES_STEEL = [
  '/STALEES_STEEL/Untitled.jpg',
  '/STALEES_STEEL/Untitledd.jpg',
  '/STALEES_STEEL/iiimages.jpg',
  '/STALEES_STEEL/iimagess.jpg',
  '/STALEES_STEEL/imagges.jpg',
  '/STALEES_STEEL/immages.jpg',
];

const HOME_WARW = [
  '/HOME_WARW/8237ec08-f1bb-4b78-9a04-a420beaf539d-350x465.jpeg',
  '/HOME_WARW/Untitleed.jpg',
  '/HOME_WARW/Untittled.jpg',
  '/HOME_WARW/imageees.jpg',
  '/HOME_WARW/imagees.jpg',
  '/HOME_WARW/imageess.jpg',
];

// Deterministic PRNG (same sequence on server and client)
let __seed = 123456789;
function seededRandom() {
  // Linear congruential generator parameters
  __seed = (1103515245 * __seed + 12345) % 2147483648; // 2^31
  return __seed / 2147483648;
}

function pick(arr: string[], n = 3): string[] {
  const copy = [...arr];
  const out: string[] = [];
  while (copy.length && out.length < n) {
    const i = Math.floor(seededRandom() * copy.length);
    out.push(copy.splice(i, 1)[0]!);
  }
  return out;
}

export const products: Product[] = [
  {
    id: 1,
    slug: 'casual-outfit-set',
    name: { ar: 'طقم كاجوال', en: 'Casual Outfit Set' },
    brandSlug: 'nike',
    categorySlugs: ['casual'],
    price: 399,
    originalPrice: 499,
    images: pick(CASUAL, 4),
    discount: 20,
    tags: ['featured', 'sale']
  },
  {
    id: 2,
    slug: 'sport-shoes-kids',
    name: { ar: 'حذاء رياضي', en: 'Sport Shoes' },
    brandSlug: 'adidas',
    categorySlugs: ['shoes'],
    price: 550,
    images: pick(SHOES, 4),
    isNew: true,
    tags: ['new', 'bestseller']
  },
  {
    id: 3,
    slug: 'fashion-handbag',
    name: { ar: 'شنطة موضة', en: 'Fashion Handbag' },
    brandSlug: 'chicco',
    categorySlugs: ['bags'],
    price: 750,
    originalPrice: 899,
    images: pick(BAGS, 4),
    discount: 17,
    tags: ['sale', 'featured']
  },
  {
    id: 4,
    slug: 'stainless-bottle',
    name: { ar: 'زجاجة استانلس', en: 'Stainless Bottle' },
    brandSlug: 'pigeon',
    categorySlugs: ['stalees-steel'],
    price: 220,
    images: pick(STALEES_STEEL, 3),
    tags: ['recommended']
  },
  {
    id: 5,
    slug: 'home-warm-blanket',
    name: { ar: 'بطانية منزل دافئة', en: 'Warm Home Blanket' },
    brandSlug: 'bubbles',
    categorySlugs: ['home-warw'],
    price: 320,
    originalPrice: 380,
    images: pick(HOME_WARW, 3),
    discount: 16,
    tags: ['sale']
  },
  {
    id: 6,
    slug: 'casual-hoodie-kids',
    name: { ar: 'هودي كاجوال', en: 'Casual Hoodie' },
    brandSlug: 'zara',
    categorySlugs: ['casual'],
    price: 420,
    images: pick(CASUAL, 3),
    tags: ['featured']
  },
  {
    id: 7,
    slug: 'daily-sneakers',
    name: { ar: 'سنيكرز يومي', en: 'Daily Sneakers' },
    brandSlug: 'skechers',
    categorySlugs: ['shoes'],
    price: 610,
    images: pick(SHOES, 3),
    tags: ['bestseller']
  },
  {
    id: 8,
    slug: 'mini-cross-bag',
    name: { ar: 'شنطة كروس صغيرة', en: 'Mini Cross Bag' },
    brandSlug: 'tommy',
    categorySlugs: ['bags'],
    price: 490,
    images: pick(BAGS, 3),
    tags: ['recommended']
  },
  // Extra CASUAL
  {
    id: 9,
    slug: 'casual-jogger-pants',
    name: { ar: 'بنطال رياضي كاجوال', en: 'Casual Jogger Pants' },
    brandSlug: 'zara',
    categorySlugs: ['casual'],
    price: 380,
    originalPrice: 450,
    images: pick(CASUAL, 3),
    discount: 16,
    tags: ['sale']
  },
  {
    id: 10,
    slug: 'kids-casual-tshirt',
    name: { ar: 'تيشيرت كاجوال', en: 'Casual T-Shirt' },
    brandSlug: 'nike',
    categorySlugs: ['casual'],
    price: 190,
    images: pick(CASUAL, 3),
    tags: ['featured', 'recommended']
  },
  // Extra SHOES
  {
    id: 11,
    slug: 'light-running-shoes',
    name: { ar: 'حذاء جري خفيف', en: 'Light Running Shoes' },
    brandSlug: 'adidas',
    categorySlugs: ['shoes'],
    price: 690,
    images: pick(SHOES, 3),
    tags: ['bestseller']
  },
  {
    id: 12,
    slug: 'kids-sandals',
    name: { ar: 'صنادل', en: 'Sandals' },
    brandSlug: 'skechers',
    categorySlugs: ['shoes'],
    price: 330,
    images: pick(SHOES, 3),
    isNew: true,
    tags: ['new']
  },
  // Extra BAGS
  {
    id: 13,
    slug: 'school-backpack',
    name: { ar: 'شنطة ظهر مدرسية', en: 'School Backpack' },
    brandSlug: 'chicco',
    categorySlugs: ['bags'],
    price: 520,
    images: pick(BAGS, 3),
    tags: ['featured']
  },
  {
    id: 14,
    slug: 'mini-handbag',
    name: { ar: 'شنطة يد صغيرة', en: 'Mini Handbag' },
    brandSlug: 'tommy',
    categorySlugs: ['bags'],
    price: 430,
    originalPrice: 500,
    images: pick(BAGS, 3),
    discount: 14,
    tags: ['sale']
  },
  // Extra STALEES_STEEL
  {
    id: 15,
    slug: 'steel-lunchbox',
    name: { ar: 'علبة غداء استانلس', en: 'Stainless Lunchbox' },
    brandSlug: 'pigeon',
    categorySlugs: ['stalees-steel'],
    price: 260,
    images: pick(STALEES_STEEL, 3),
    tags: ['recommended']
  },
  {
    id: 16,
    slug: 'insulated-thermos',
    name: { ar: 'ترمس معزول', en: 'Insulated Thermos' },
    brandSlug: 'philips-avent',
    categorySlugs: ['stalees-steel'],
    price: 310,
    images: pick(STALEES_STEEL, 3),
    tags: ['featured']
  },
  // Extra HOME_WARW
  {
    id: 17,
    slug: 'home-warm-pajama',
    name: { ar: 'بيجامة منزل دافئة', en: 'Warm Home Pajama' },
    brandSlug: 'bubbles',
    categorySlugs: ['home-warw'],
    price: 440,
    images: pick(HOME_WARW, 3),
    isNew: true,
    tags: ['new']
  },
  {
    id: 18,
    slug: 'soft-home-robe',
    name: { ar: 'روب منزلي ناعم', en: 'Soft Home Robe' },
    brandSlug: 'mustela',
    categorySlugs: ['home-warw'],
    price: 390,
    images: pick(HOME_WARW, 3),
    tags: ['recommended']
  }
];
