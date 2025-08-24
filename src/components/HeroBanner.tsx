'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

type UiSlide = {
  id: number;
  image: string;
  // i18n keys (static fallback)
  titleKey?: string;
  subtitleKey?: string;
  buttonKey?: string;
  // direct text (from API)
  titleText?: string;
  subtitleText?: string;
  buttonText?: string;
  // CTA
  ctaType?: 'none' | 'scroll' | 'link';
  ctaTarget?: string | null;
  href?: string; // used for legacy link CTA
};

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  // No static fallback; start empty and render neutral skeleton until dynamic loads
  const [slides, setSlides] = useState<UiSlide[]>([]);
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'ar';

  useEffect(() => {
    // Fetch dynamic slides from API (MongoDB). If available, map to UiSlide shape.
    (async () => {
      try {
        const res = await fetch('/api/slides', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const apiSlides: UiSlide[] = (data.slides || []).map((s: any, idx: number) => ({
          id: idx + 1,
          image: s.imageUrl,
          titleText: s.title,
          subtitleText: s.subtitle,
          buttonText: s.ctaText,
          ctaType: s.ctaType,
          ctaTarget: s.ctaTarget ?? null,
          href: s.ctaType === 'link' ? s.ctaTarget : undefined,
        }));
        if (apiSlides.length > 0) setSlides(apiSlides);
      } catch {
        // ignore, keep skeleton
      }
    })();
  }, []);

  useEffect(() => {
    const len = slides.length || 1;
    if (slides.length === 0) return; // no rotation while skeleton
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % len);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    const len = slides.length || 1;
    setCurrentSlide((prev) => (prev + 1) % len);
  };

  const prevSlide = () => {
    const len = slides.length || 1;
    setCurrentSlide((prev) => (prev - 1 + len) % len);
  };

  // Neutral skeleton if no slides
  if (slides.length === 0) {
    return (
      <div className="relative h-[620px] md:h-[820px] lg:h-[900px] overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
    );
  }

  return (
    <div className="relative h-[620px] md:h-[820px] lg:h-[900px] overflow-hidden bg-gray-100 rounded-xl">
      {slides.map((slide, index) => {
        const active = index === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out ${active ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ transform: `translateX(${(index - currentSlide) * 100}%)` }}
          >
            <div className="absolute inset-0">
              <Image
                src={slide.image}
                alt={slide.titleText ?? (slide.titleKey ? t(slide.titleKey) : 'Slide image')}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="relative z-10 h-full flex items-center justify-center text-white p-6">
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-5xl font-extrabold drop-shadow">{slide.titleText ?? (slide.titleKey ? t(slide.titleKey) : '')}</h2>
                <p className="text-lg md:text-2xl opacity-95">{slide.subtitleText ?? (slide.subtitleKey ? t(slide.subtitleKey) : '')}</p>
                {(slide.ctaType ?? 'scroll') === 'scroll' && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = (slide.ctaTarget as string) || '#home-products';
                      const id = target.startsWith('#') ? target.slice(1) : target;
                      const el = document.getElementById(id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      else window.location.hash = `#${id}`;
                    }}
                    className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    {slide.buttonText ?? (slide.buttonKey ? t(slide.buttonKey) : 'Shop Now')}
                  </button>
                )}
                {(slide.ctaType ?? 'scroll') === 'link' && slide.ctaTarget && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = slide.ctaTarget as string;
                      const href = target.startsWith('/') ? `/${locale}${target}` : target;
                      window.location.href = href;
                    }}
                    className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    {slide.buttonText ?? (slide.buttonKey ? t(slide.buttonKey) : 'Shop Now')}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows (RTL-aware) */}
      <button
        onClick={prevSlide}
        className={`${isRTL ? 'right-4' : 'left-4'} absolute top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-700 shadow-md ring-1 ring-black/5 hover:shadow-lg transition`}
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={`${isRTL ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}`} />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className={`${isRTL ? 'left-4' : 'right-4'} absolute top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-700 shadow-md ring-1 ring-black/5 hover:shadow-lg transition`}
        aria-label="Next slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={`${isRTL ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}`} />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 space-x-reverse">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}