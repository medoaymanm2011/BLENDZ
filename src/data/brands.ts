export type Brand = {
  id: number;
  name: string;
  slug: string;
  color?: string;
  image?: string;
};

export const brands: Brand[] = [
  // Live brands from vilainkids.com (image URLs are absolute)
  { id: 1, name: 'Chicco', slug: 'chicco', image: 'https://www.vilainkids.com/storage/brand-images/01K15ZZNXQZFDB6ZEJAXZ6XBM9.webp' },
  { id: 2, name: 'bubbles', slug: 'bubbles', image: 'https://www.vilainkids.com/storage/brand-images/01K1601ZTJ6VVNMX5YPHARG1QY.webp' },
  { id: 3, name: 'TRUE', slug: 'true', image: 'https://www.vilainkids.com/storage/brand-images/01K1604HCC4MP6S4HAQ9ME2GW1.webp' },
  { id: 4, name: 'philips avent', slug: 'philips-avent', image: 'https://www.vilainkids.com/storage/brand-images/01K1608JQY5SD2P7PDFKVY9H41.webp' },
  { id: 5, name: 'candy baby', slug: 'candy-baby', image: 'https://www.vilainkids.com/storage/brand-images/01K160NG2Z8RRCDS2VMZFZCZ7E.webp' },
  { id: 6, name: 'lovi', slug: 'lovi', image: 'https://www.vilainkids.com/storage/brand-images/01K160SDJQ0CYW3ANJ3E4JGHD2.webp' },
  { id: 7, name: 'lovi trends', slug: 'lovi-trends', image: 'https://www.vilainkids.com/storage/brand-images/01K160TF6QHGQPSQC3RRETRQ38.webp' },
  { id: 8, name: 'la fruta', slug: 'la-fruta', image: 'https://www.vilainkids.com/storage/brand-images/01K160VPVP97H82XR469A02293.webp' },
  { id: 9, name: 'safari', slug: 'safari', image: 'https://www.vilainkids.com/storage/brand-images/01K160XKSBZFHG9YD1PJB5HT3A.webp' },
  { id: 10, name: 'canpol baby', slug: 'canpol-baby', image: 'https://www.vilainkids.com/storage/brand-images/01K160YZE95R2THTAGKTT54XY7.webp' },
  { id: 11, name: 'farlin', slug: 'farlin', image: 'https://www.vilainkids.com/storage/brand-images/01K1613D677E5ANFN30JQH0ZHY.webp' },
  { id: 12, name: 'wee', slug: 'wee', image: 'https://www.vilainkids.com/storage/brand-images/01K1614RXJQQ1JQBSM744XQG96.webp' }
];
