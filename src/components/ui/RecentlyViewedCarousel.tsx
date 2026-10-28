import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, MapPin, Star, ChevronLeft, ChevronRight, ArrowRight,
  Store, Trash2, Home, RotateCcw, Sparkles, Crown
} from 'lucide-react';
import {
  RecentlyViewedSalon,
  getRecentlyViewedSalons,
  clearRecentlyViewedSalons,
  restoreDefaultRecentlyViewed,
  MAX_DISPLAYED
} from '@/lib/recentlyViewed';

function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function RecentlyViewedCarousel() {
  const navigate = useNavigate();
  const [salons, setSalons] = useState<RecentlyViewedSalon[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load recently viewed salons
  const loadSalons = useCallback(() => {
    const data = getRecentlyViewedSalons(MAX_DISPLAYED);
    setSalons(data);
  }, []);

  useEffect(() => {
    loadSalons();

    // Listen to visit updates dispatched from other pages/components
    const handleUpdate = () => {
      loadSalons();
    };

    window.addEventListener('recently_viewed_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('recently_viewed_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadSalons]);

  // Check scroll positions for scroll buttons
  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [salons, checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = 380;
    const shift = direction === 'left' ? -cardWidth : cardWidth;
    el.scrollBy({ left: shift, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  const handleClear = () => {
    clearRecentlyViewedSalons();
    setSalons([]);
  };

  const handleRestore = () => {
    const restored = restoreDefaultRecentlyViewed();
    setSalons(restored);
  };

  if (salons.length === 0) {
    return (
      <section className="w-full px-4 sm:px-8 lg:px-12 py-10 border-b border-white/5 bg-[#0D0D0D]/60">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-[#141414] border border-white/8">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-playfair font-bold text-white text-base">Recently Viewed Salons</p>
              <p className="text-white/40 text-xs font-inter mt-0.5">
                Explore any salon to quickly return and resume your booking here.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestore}
              className="flex items-center gap-1.5 text-xs font-semibold text-gold border border-gold/30 hover:border-gold hover:bg-gold/5 rounded-xl px-3.5 py-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Sample Salons</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/salons')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0A] bg-gold hover:bg-gold-light rounded-xl px-4 py-2 transition-all cursor-pointer"
            >
              <span>Explore Salons</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 py-12 border-b border-white/5 bg-gradient-to-b from-[#0E0E0E] to-[#0A0A0A]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="gold-divider w-10 mb-3" />
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-gold" />
            </div>
            <h2 className="font-playfair font-bold text-white text-2xl sm:text-3xl">
              Recently Viewed
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-semibold uppercase tracking-wider font-inter">
              Last {salons.length} visited
            </span>
          </div>
          <p className="text-white/40 text-xs sm:text-sm font-inter mt-1.5">
            Quick return navigation to salons and studios you recently explored
          </p>
        </div>

        {/* Carousel controls & Clear action */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[11px] font-medium text-white/40 hover:text-rose-400 px-2.5 py-2 rounded-xl hover:bg-white/5 transition-all mr-1 cursor-pointer"
            title="Clear recently viewed history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
              canScrollLeft
                ? 'border-gold/40 text-gold bg-gold/5 hover:bg-gold hover:text-[#0A0A0A] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] cursor-pointer'
                : 'border-white/10 text-white/20 bg-white/5 cursor-not-allowed opacity-40'
            }`}
            aria-label="Previous salon"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
              canScrollRight
                ? 'border-gold/40 text-gold bg-gold/5 hover:bg-gold hover:text-[#0A0A0A] hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] cursor-pointer'
                : 'border-white/10 text-white/20 bg-white/5 cursor-not-allowed opacity-40'
            }`}
            aria-label="Next salon"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-3 pt-1"
      >
        {salons.map((salon) => {
          const rating = Number(salon.rating ?? 4.8);
          const reviews = Number(salon.totalReviews ?? 50);
          const isLuxuryChoice = rating >= 4.9;

          return (
            <div
              key={salon.id}
              onClick={() => navigate(`/shop/${salon.id}`)}
              className="flex-shrink-0 w-[290px] sm:w-[340px] md:w-[380px] snap-start group relative bg-[#131313] border border-white/10 rounded-2xl overflow-hidden hover:border-gold/70 hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
            >
              {/* Image & Header Overlays */}
              <div className="relative h-44 sm:h-48 overflow-hidden bg-[#1a1a1a]">
                <img
                  src={salon.photo || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&h=600&fit=crop&q=90'}
                  alt={salon.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&h=600&fit=crop&q=90';
                  }}
                />

                {/* Gradient shadow for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-black/20 to-black/60" />

                {/* Top Overlay: Luxury Badge & Time-ago */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                  {/* Luxury Choice / Top Rated Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/85 backdrop-blur-md border border-gold/60 text-gold shadow-[0_0_12px_rgba(212,175,55,0.45)]">
                    <Crown className="w-3 h-3 text-gold animate-pulse" />
                    <span className="text-[10px] font-bold tracking-wider uppercase font-inter">
                      {isLuxuryChoice ? 'Luxury Choice' : 'Top Rated'}
                    </span>
                  </div>

                  {/* Viewed Time Ago */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-white/80 text-[10px] font-medium font-inter">
                    <Clock className="w-2.5 h-2.5 text-gold/80" />
                    <span>{formatTimeAgo(salon.viewedAt)}</span>
                  </div>
                </div>

                {/* Category tag in bottom-left over image */}
                {salon.category && (
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/80 backdrop-blur-md border border-white/20 text-gold font-inter">
                      {salon.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-playfair font-bold text-white text-base sm:text-lg group-hover:text-gold transition-colors line-clamp-1">
                      {salon.name}
                    </h3>
                    <div className="flex items-center gap-1 flex-shrink-0 bg-black/40 px-2 py-0.5 rounded-md border border-gold/20">
                      <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                      <span className="text-gold font-bold text-xs">{rating.toFixed(1)}</span>
                      <span className="text-white/30 text-[10px]">({reviews})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-white/40 mb-3">
                    <MapPin className="w-3 h-3 text-gold/50 flex-shrink-0" />
                    <span className="truncate">{salon.address || salon.city || 'Jaipur'}</span>
                  </div>

                  {salon.tagline && (
                    <p className="text-white/50 text-xs font-inter line-clamp-1 mb-3">
                      {salon.tagline}
                    </p>
                  )}

                  {/* Tags */}
                  {salon.tags && salon.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {salon.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 font-inter"
                        >
                          {tag}
                        </span>
                      ))}
                      {salon.homeService && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gold/10 border border-gold/30 text-gold flex items-center gap-1 font-inter">
                          <Home className="w-2.5 h-2.5" /> Doorstep
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Quick Return Action */}
                <div className="pt-3 border-t border-white/8 flex items-center justify-between">
                  <span className="text-[11px] text-white/40 font-inter flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-gold/60" />
                    <span>Quick Return</span>
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-gold group-hover:translate-x-1 transition-transform">
                    <span>Revisit Salon</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
