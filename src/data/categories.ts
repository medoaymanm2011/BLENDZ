export type Category = {
  id: number;
  name: { ar: string; en: string };
  slug: string;
  icon?: string;
  image?: string;
};

export const categories: Category[] = [
  {
    id: 1,
    name: { ar: 'CASUAL', en: 'CASUAL' },
    slug: 'casual',
    image: '/CASUAL/photo-1434389677669-e08b4cac3105.avif',
  },
  {
    id: 2,
    name: { ar: 'SHOES', en: 'SHOES' },
    slug: 'shoes',
    image: '/SHOES/istockphoto-1009996074-612x612.jpg',
  },
  {
    id: 3,
    name: { ar: 'BAGS', en: 'BAGS' },
    slug: 'bags',
    image: '/BAGS/photo-1548036328-c9fa89d128fa.avif',
  },
  {
    id: 4,
    name: { ar: 'STALEES_STEEL', en: 'STALEES_STEEL' },
    slug: 'stalees-steel',
    image: '/STALEES_STEEL/Untitled.jpg',
  },
  {
    id: 5,
    name: { ar: 'HOME_WARW', en: 'HOME_WARW' },
    slug: 'home-warw',
    image: '/HOME_WARW/8237ec08-f1bb-4b78-9a04-a420beaf539d-350x465.jpeg',
  },
];
