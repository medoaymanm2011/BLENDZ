export type HeroSlide = {
  id: number;
  image: string; // local public path
  href?: string;
  titleKey: string; // i18n key
  subtitleKey: string; // i18n key
  buttonKey: string; // i18n key
};

// Image pools from public/ folders
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

const ALL_IMAGES = [...CASUAL, ...SHOES, ...BAGS, ...STALEES_STEEL, ...HOME_WARW];

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getRandomHeroSlides(count = 5): HeroSlide[] {
  const pool = shuffleInPlace([...ALL_IMAGES]).slice(0, Math.min(count, ALL_IMAGES.length));
  return pool.map((image, idx) => ({
    id: idx + 1,
    image,
    href: '/category/all',
    titleKey: `hero.slide${(idx % 3) + 1}.title`,
    subtitleKey: `hero.slide${(idx % 3) + 1}.subtitle`,
    buttonKey: `hero.slide${(idx % 3) + 1}.button`,
  }));
}

// Deterministic default slides: take first N images in a fixed order
export function getDefaultHeroSlides(count = 5): HeroSlide[] {
  const pool = ALL_IMAGES.slice(0, Math.min(count, ALL_IMAGES.length));
  return pool.map((image, idx) => ({
    id: idx + 1,
    image,
    href: '/category/all',
    titleKey: `hero.slide${(idx % 3) + 1}.title`,
    subtitleKey: `hero.slide${(idx % 3) + 1}.subtitle`,
    buttonKey: `hero.slide${(idx % 3) + 1}.button`,
  }));
}
