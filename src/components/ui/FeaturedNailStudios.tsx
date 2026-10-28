import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Star, MapPin, IndianRupee, ArrowRight,
  ChevronLeft, ChevronRight, Home, ShieldCheck, Check,
  Compass, Filter, Crown, Award
} from 'lucide-react';
import { FEATURED_NAIL_STUDIOS } from '@/lib/dummyShopsData';
import { recordSalonVisit } from '@/lib/recentlyViewed';

interface FeaturedNailStudiosProps {
  selectedLocation?: {
    city?: string;
    area?: string;
    displayName?: string;
    type?: string;
  } | null;
}

export function FeaturedNailStudios({ selectedLocation }: FeaturedNailStudiosProps = {}) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter or prioritize studios based on selected location
  const filteredStudios = useMemo(() => {
    if (!selectedLocation || selectedLocation.city === 'all' || !selectedLocation.displayName) {
      return FEATURED_NAIL_STUDIOS;
    }

    const { city, area } = selectedLocation;

    if (area) {
      const areaLower = area.toLowerCase();
      // First find exact area matches
      const exactAreaMatches = FEATURED_NAIL_STUDIOS.filter(
        (s) =>
          s.landmark?.toLowerCase().includes(areaLower) ||
          s.address?.toLowerCase().includes(areaLower) ||
          s.tags?.some((t) => t.toLowerCase().includes(areaLower))
      );

      if (exactAreaMatches.length > 0) {
        // Place exact matches first, then other studios in same city
        const others = FEATURED_NAIL_STUDIOS.filter((s) => !exactAreaMatches.includes(s));
        return [...exactAreaMatches, ...others];
      }
    }

    if (city && city.toLowerCase() !== 'all') {
      const cityMatches = FEATURED_NAIL_STUDIOS.filter(
        (s) => s.city?.toLowerCase() === city.toLowerCase()
      );
      if (cityMatches.length > 0) return cityMatches;
    }

    return FEATURED_NAIL_STUDIOS;
  }, [selectedLocation]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full px-4 sm:px-8 lg:px-12 py-16 border-t border-white/8 relative overflow-hidden bg-gradient-to-b from-[#0A0A0A] via-[#0E0E0E] to-[#0A0A0A]">
      {/* Ambient background gold glow */}
      <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-gold/4 rounded-full blur-[140px] pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 border border-gold/30 bg-gold/10 rounded-full px-3.5 py-1">
              <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
              <span className="text-gold text-xs font-semibold tracking-wider uppercase font-inter">
                Haute Couture Nail Art & Care
              </span>
            </div>
            {selectedLocation && selectedLocation.city !== 'all' && (
              <div className="inline-flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 rounded-full px-3 py-1 text-xs text-emerald-400 font-inter">
                <MapPin className="w-3 h-3" />
                <span>Filtered for {selectedLocation.displayName}</span>
              </div>
            )}
          </div>
          <h2 className="font-playfair font-bold text-white text-3xl sm:text-4xl leading-tight mb-2">
            Featured <span className="text-gold-gradient italic">Nail Studios</span>
          </h2>
          <p className="text-white/40 text-sm font-inter max-w-xl">
            Bespoke nail art, Russian dry manicures, BIAB overlays, and palatial pedicures by top-rated nail artists.
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => {
              const url = selectedLocation?.city && selectedLocation.city !== 'all'
                ? `/salons?q=Nail&city=${encodeURIComponent(selectedLocation.city)}${selectedLocation.area ? `&area=${encodeURIComponent(selectedLocation.area)}` : ''}`
                : '/salons?q=Nail';
              navigate(url);
            }}
            type="button"
            className="flex items-center gap-2 text-xs font-semibold text-gold border border-gold/30 hover:border-gold hover:bg-gold/5 rounded-xl px-4 py-2.5 transition-all whitespace-nowrap"
          >
            <span>View All Nail Studios</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="w-9 h-9 rounded-xl bg-[#141414] border border-white/10 hover:border-gold/50 text-white/60 hover:text-gold flex items-center justify-center transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="w-9 h-9 rounded-xl bg-[#141414] border border-white/10 hover:border-gold/50 text-white/60 hover:text-gold flex items-center justify-center transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Card Row */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent snap-x snap-mandatory relative z-10"
      >
        {filteredStudios.map((studio) => {
          const isAreaMatch =
            selectedLocation?.area &&
            (studio.landmark?.toLowerCase().includes(selectedLocation.area.toLowerCase()) ||
              studio.address?.toLowerCase().includes(selectedLocation.area.toLowerCase()));

          const studioBadge = studio.rating >= 4.9 ? 'Luxury Choice' : 'Top Rated';

          return (
            <div
              key={studio.id}
              onClick={() => {
                recordSalonVisit(studio);
                navigate(`/shop/${studio.id}`);
              }}
              className={`w-[290px] sm:w-[330px] flex-shrink-0 snap-start group relative bg-gradient-to-br from-[#181612]/95 via-[#141414]/95 to-[#0D0D0D]/95 backdrop-blur-md border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:gold-glow cursor-pointer overflow-hidden shadow-xl ${
                isAreaMatch ? 'border-gold/60 ring-1 ring-gold/40' : 'border-gold/25 hover:border-gold/70'
              }`}
            >
              {/* Ambient inner glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none group-hover:bg-gold/15 transition-all duration-500" />

              <div>
                {/* Image Container with Zoom Effect */}
                <div className="aspect-[16/10] rounded-xl overflow-hidden relative mb-3 bg-[#1A1A1A]">
                  <img
                    src={studio.photo}
                    alt={studio.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Top Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
                    {/* Left: Gold Badge Overlay */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-[#17130A]/95 to-[#241D0E]/95 backdrop-blur-md text-amber-300 border border-amber-400/50 shadow-[0_2px_10px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-105 font-inter">
                      {studioBadge === 'Luxury Choice' ? (
                        <Crown className="w-2.5 h-2.5 text-gold fill-gold/25" />
                      ) : (
                        <Award className="w-2.5 h-2.5 text-gold" />
                      )}
                      <span>{studioBadge}</span>
                    </div>

                    {/* Right: Rating & Auxiliary Badges */}
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/75 backdrop-blur-md text-gold border border-gold/30 font-inter">
                        <Star className="w-2.5 h-2.5 fill-gold text-gold" />
                        <span>{studio.rating.toFixed(1)}</span>
                      </span>

                      {isAreaMatch && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold text-[#0A0A0A] shadow-gold font-inter animate-pulse">
                          <span>Nearby</span>
                        </span>
                      )}
                      {studio.homeService && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 backdrop-blur-md text-emerald-400 border border-emerald-500/30" title="Home doorstep service">
                          <Home className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs">
                  <span className="text-white/80 font-medium font-inter flex items-center gap-1 text-[11px] truncate">
                    <MapPin className="w-3 h-3 text-gold flex-shrink-0" />
                    <span className="truncate">{studio.landmark}</span>
                  </span>
                  <span className="text-gold font-bold text-xs bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-gold/30 font-inter">
                    From ₹{studio.startingPrice}
                  </span>
                </div>
              </div>

              {/* Title & Tagline */}
              <h3 className="font-playfair font-bold text-white text-lg group-hover:text-gold transition-colors leading-snug mb-1">
                {studio.name}
              </h3>
              <p className="text-white/50 text-xs font-inter line-clamp-2 leading-relaxed mb-3">
                {studio.tagline}
              </p>

              {/* Tags / Service Pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {studio.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-white/70 border border-white/10 group-hover:border-gold/20 font-inter"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Row: Book Now CTA */}
            <div className="pt-3 border-t border-white/8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 text-[11px] text-white/40 font-inter">
                <ShieldCheck className="w-3.5 h-3.5 text-gold/70" />
                <span>Verified Studio</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/shop/${studio.id}`);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-xs transition-all shadow-gold hover:scale-105 active:scale-95 flex items-center gap-1 font-inter whitespace-nowrap"
              >
                <span>Book Studio</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
      </div>
    </section>
  );
}
