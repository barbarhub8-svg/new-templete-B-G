import { useState, useEffect } from 'react';

const HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&fit=crop&q=85',
    alt: 'Luxury Barber Salon Interior',
  },
  {
    url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&fit=crop&q=85',
    alt: 'Modern High-End Grooming Suite',
  },
  {
    url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1600&fit=crop&q=85',
    alt: 'Royal Grooming and Styling Studio',
  },
];

export function HeroBackgroundCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500); // 4.5 seconds per slide
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {/* 3 Full-Bleed Background Images with Smooth Crossfade */}
      {HERO_IMAGES.map((img, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={img.url}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
            }`}
          >
            <img
              src={img.url}
              alt={img.alt}
              className={`w-full h-full object-cover brightness-95 contrast-105 transition-transform duration-[6000ms] ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
            />
          </div>
        );
      })}

      {/* Lighter, Balanced Gradient Overlays with Soft Backdrop Blur for Vivid Images */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/20 z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/40 via-transparent to-[#0A0A0A]/80 z-10 backdrop-blur-[1px]" />

      {/* Subtle Bottom Right Slide Indicator Dots */}
      <div className="absolute bottom-8 right-8 z-20 hidden md:flex items-center gap-2 pointer-events-auto">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex ? 'w-6 bg-gold' : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
