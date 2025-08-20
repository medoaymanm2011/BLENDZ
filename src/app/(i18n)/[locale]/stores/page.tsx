'use client';

import { useTranslations } from 'next-intl';

export default function StoresPage() {
  const t = useTranslations();

  const stores = [
    {
      id: 1,
      name: t('stores.riyadh.name'),
      address: t('stores.riyadh.address'),
      phone: '+966 11 123 4567',
      hours: t('stores.riyadh.hours'),
      location: { lat: 24.7136, lng: 46.6753 },
    },
    {
      id: 2,
      name: t('stores.jeddah.name'),
      address: t('stores.jeddah.address'),
      phone: '+966 12 765 4321',
      hours: t('stores.jeddah.hours'),
      location: { lat: 21.5433, lng: 39.1728 },
    },
    {
      id: 3,
      name: t('stores.dammam.name'),
      address: t('stores.dammam.address'),
      phone: '+966 13 555 7890',
      hours: t('stores.dammam.hours'),
      location: { lat: 26.4207, lng: 50.0888 },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('stores.title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900">{store.name}</h2>
              <p className="text-gray-700 mt-2">{store.address}</p>
              <div className="mt-3 text-sm text-gray-600">
                <p>
                  <span className="font-medium">{t('stores.phone')}:</span> {store.phone}
                </p>
                <p>
                  <span className="font-medium">{t('stores.hours')}:</span> {store.hours}
                </p>
              </div>
              <div className="mt-4">
                <a
                  href={`https://www.google.com/maps?q=${store.location.lat},${store.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-md transition"
                >
                  {t('stores.viewOnMap')}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}