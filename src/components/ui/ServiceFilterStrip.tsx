import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
  Sparkles,
  Flame,
} from 'lucide-react';

export interface ServiceChip {
  id: string;
  label: string;
  query: string;
  emoji: string;
  count: string;
  popular?: boolean;
  isPrimary?: boolean;
  badge?: string;
}

export const SERVICE_CHIPS: ServiceChip[] = [
  {
    id: 'all',
    label: 'All Services',
    query: '',
    emoji: '✨',
    count: '60+ Salons',
  },
  {
    id: 'nail-art-studio',
    label: 'Nails Art Studio',
    query: 'Nail',
    emoji: '💅',
    count: '18+ Studios',
    popular: true,
    isPrimary: true,
    badge: 'Popular',
  },
  {
    id: 'haircut',
    label: 'Haircut & Styling',
    query: 'Haircut',
    emoji: '✂️',
    count: '45+ Salons',
    popular: true,
  },
  {
    id: 'beard',
    label: 'Beard Grooming',
    query: 'Beard',
    emoji: '🧔',
    count: '38+ Salons',
  },
  {
    id: 'hair-spa',
    label: 'Hair Spa & Therapy',
    query: 'Hair Spa',
    emoji: '💆',
    count: '28+ Salons',
    popular: true,
  },
  {
    id: 'facial',
    label: 'Facial & Glow',
    query: 'Facial',
    emoji: '🧴',
    count: '32+ Salons',
  },
  {
    id: 'hair-color',
    label: 'Hair Color & Highlights',
    query: 'Color',
    emoji: '🎨',
    count: '24+ Salons',
  },
  {
    id: 'skin-fade',
    label: 'Skin Fade & Taper',
    query: 'Skin Fade',
    emoji: '💈',
    count: '22+ Salons',
  },
  {
    id: 'massage',
    label: 'Massage & Wellness',
    query: 'Massage',
    emoji: '🔥',
    count: '18+ Spas',
  },
  {
    id: 'bridal',
    label: 'Bridal & Groom',
    query: 'Bridal',
    emoji: '💍',
    count: '14+ Salons',
  },
];

interface ServiceFilterStripProps {
  activeQuery?: string;
  selectedLocation?: {
    city?: string;
    area?: string;
    displayName?: string;
  } | null;
  onSelect?: (query: string) => void;
  className?: string;
}

export function ServiceFilterStrip({
  activeQuery,
  selectedLocation,
  onSelect,
  className = '',
}: ServiceFilterStripProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (!activeQuery) return 'all';
    const qLower = activeQuery.toLowerCase();
    const found = SERVICE_CHIPS.find(
      (c) => c.query && (c.query.toLowerCase() === qLower || qLower.includes(c.query.toLowerCase()))
    );
    return found ? found.id : 'all';
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleChipClick = (chip: ServiceChip) => {
    setSelectedId(chip.id);

    if (onSelect) {
      onSelect(chip.query);
      return;
    }

    // Default behavior: navigate to /salons with search query and location filter
    const params = new URLSearchParams();
    if (chip.id === 'nail-art-studio') {
      params.set('category', 'Nails Art Studio');
    } else if (chip.query) {
      params.set('q', chip.query);
    }
    if (selectedLocation && selectedLocation.city !== 'all') {
      params.set('city', selectedLocation.city);
      if (selectedLocation.area) params.set('area', selectedLocation.area);
    }
    const paramStr = params.toString();
    navigate(paramStr ? `/salons?${paramStr}` : '/salons');
  };

  return (
    <section className={`w-full px-4 sm:px-8 lg:px-12 pt-8 pb-4 relative z-10 ${className}`}>
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 border border-gold/30 bg-gold/10 rounded-full px-3 py-0.5 mb-2.5">
            <SlidersHorizontal className="w-3 h-3 text-gold" />
            <span className="text-gold text-[11px] font-semibold tracking-wider uppercase font-inter">
              Filter by Service
            </span>
          </div>
          <h3 className="font-playfair font-bold text-white text-2xl sm:text-3xl leading-snug">
            Quickly Narrow Down <span className="text-gold-gradient italic">Your Search</span>
          </h3>
          <p className="text-white/40 text-xs sm:text-sm font-inter mt-1 max-w-xl">
            Choose a service type to filter premier salons and book your desired specialist instantly.
          </p>
        </div>

        {/* Scroll Nav Buttons & Explore Link */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => navigate('/salons')}
            type="button"
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-gold/80 hover:text-gold transition-colors font-inter cursor-pointer"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll service filters left"
              className="w-8 h-8 rounded-xl bg-[#141414] border border-white/10 hover:border-gold/50 text-white/60 hover:text-gold flex items-center justify-center transition-all duration-200 cursor-pointer hover:shadow-[0_0_12px_rgba(212,175,55,0.25)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll service filters right"
              className="w-8 h-8 rounded-xl bg-[#141414] border border-white/10 hover:border-gold/50 text-white/60 hover:text-gold flex items-center justify-center transition-all duration-200 cursor-pointer hover:shadow-[0_0_12px_rgba(212,175,55,0.25)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Strip of Chips */}
      <div className="relative group/strip">
        {/* Left and Right subtle gradient fades for scroll indication */}
        <div className="absolute left-0 top-0 bottom-3 w-8 bg-gradient-to-r from-[#0A0A0A] to-transparent pointer-events-none z-10 hidden sm:block opacity-70" />
        <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-[#0A0A0A] to-transparent pointer-events-none z-10 hidden sm:block opacity-70" />

        <div
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory relative scroll-smooth focus:outline-none"
          tabIndex={0}
          role="region"
          aria-label="Service filter chips"
        >
          {SERVICE_CHIPS.map((chip) => {
            const isSelected = selectedId === chip.id;
            const isNailStudio = chip.isPrimary || chip.id === 'nail-art-studio';

            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`group relative flex-shrink-0 snap-start flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-gradient-to-r from-gold via-gold-light to-gold text-[#0A0A0A] border-gold shadow-[0_0_24px_rgba(212,175,55,0.45)] scale-[1.02] font-bold'
                    : isNailStudio
                    ? 'bg-gradient-to-r from-[#17140f] to-[#121212] border-gold/45 text-white hover:text-gold hover:border-gold hover:shadow-[0_0_24px_rgba(212,175,55,0.4)] hover:-translate-y-0.5'
                    : 'bg-[#141414]/90 backdrop-blur-md border-white/10 hover:border-gold/60 text-white/80 hover:text-white hover:shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:-translate-y-0.5'
                }`}
              >
                {/* Icon wrapper */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm transition-transform duration-300 group-hover:scale-110 ${
                    isSelected
                      ? 'bg-black/20 text-[#0A0A0A]'
                      : isNailStudio
                      ? 'bg-gold/15 border border-gold/30 shadow-[0_0_8px_rgba(212,175,55,0.3)]'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className="leading-none select-none">{chip.emoji}</span>
                </div>

                {/* Label */}
                <span
                  className={`font-inter whitespace-nowrap ${
                    isSelected ? 'font-bold' : isNailStudio ? 'font-semibold text-white group-hover:text-gold' : ''
                  }`}
                >
                  {chip.label}
                </span>

                {/* Counter Tag */}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-inter transition-colors ${
                    isSelected
                      ? 'bg-black/20 text-[#0A0A0A] font-bold'
                      : isNailStudio
                      ? 'bg-gold/15 text-gold border border-gold/30 font-medium'
                      : 'bg-white/5 border border-white/10 text-white/40 group-hover:text-white/70'
                  }`}
                >
                  {chip.count}
                </span>

                {/* Primary / Popular Badge for Nails Art Studio & others */}
                {chip.badge && !isSelected && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase rounded bg-gold/20 text-gold border border-gold/40 shadow-[0_0_8px_rgba(212,175,55,0.3)]">
                    {chip.badge}
                  </span>
                )}

                {chip.popular && !chip.badge && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse flex-shrink-0 shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
