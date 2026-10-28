import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Clock, Home, Store, Loader2,
  Search, X, ArrowRight, Scissors, TrendingUp, Shield, Zap,
  Sparkles, ChevronDown, Users, Award, ChevronLeft, ChevronRight,
  Quote, Smile, IndianRupee, Smartphone, Crown
} from 'lucide-react';
import { getApprovedShops } from '@/lib/api';
import { JAIPUR_PREMIER_SHOPS, FEATURED_NAIL_STUDIOS } from '@/lib/dummyShopsData';
import { FeaturedOffersCarousel } from '@/components/ui/FeaturedOffersCarousel';
import { RecommendedForYou } from '@/components/ui/RecommendedForYou';
import { LimitedTimeOfferBanner } from '@/components/ui/LimitedTimeOfferBanner';
import { HeroBackgroundCarousel } from '@/components/ui/HeroBackgroundCarousel';
import { FeaturedNailStudios } from '@/components/ui/FeaturedNailStudios';
import { ServiceFilterStrip } from '@/components/ui/ServiceFilterStrip';
import { LocationAutoSuggest, CURATED_LOCATIONS, LocationOption } from '@/components/ui/LocationAutoSuggest';
import { RecentlyViewedCarousel } from '@/components/ui/RecentlyViewedCarousel';
import { recordSalonVisit } from '@/lib/recentlyViewed';

// ─── Demo data ────────────────────────────────────────────────────────────────

const BASE_DEMO_SHOPS = [
  {
    id: 'dummy-1', name: 'The Royal Barberia',
    tagline: 'Luxury grooming with modern fades and classic precision styling.',
    photo: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=900&h=600&fit=crop&q=90',
    rating: 4.9, totalReviews: 312, city: 'Mumbai', address: 'Bhilwara, Rajasthan',
    tags: ['In-Shop', 'Premium', 'Beard Styling'], homeService: false,
    opening_time: '09:00', closing_time: '21:00', weekly_off: 'Monday', total_bookings: 1450, isDemo: true,
  },
  {
    id: 'dummy-2', name: 'Classic Cuts Studio',
    tagline: 'Professional grooming experts in a premium ambience.',
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&h=600&fit=crop&q=90',
    rating: 4.8, totalReviews: 210, city: 'Mumbai', address: 'Azad Nagar, Mumbai',
    tags: ['Home Service', 'Hair Spa', 'Premium'], homeService: true,
    opening_time: '10:00', closing_time: '21:00', weekly_off: 'Tuesday', total_bookings: 980, isDemo: true,
  },
  {
    id: 'dummy-3', name: 'Urban Fade Lounge',
    tagline: 'Trendy hairstyles, skin fades, and luxury salon experience.',
    photo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&h=600&fit=crop&q=90',
    rating: 5.0, totalReviews: 180, city: 'Delhi', address: 'Connaught Place, Delhi',
    tags: ['In-Shop', 'Trending Styles', 'Premium'], homeService: false,
    opening_time: '09:30', closing_time: '22:00', weekly_off: 'Wednesday', total_bookings: 820, isDemo: true,
  },
];

const DUMMY_SHOPS = [...JAIPUR_PREMIER_SHOPS, ...FEATURED_NAIL_STUDIOS, ...BASE_DEMO_SHOPS];

const TESTIMONIALS = [
  { name: 'Arjun Mehta', city: 'Mumbai', rating: 5, text: 'Absolutely love Nexora! Booked a haircut in under a minute and the salon was top-notch. Will never go back to calling in advance.', avatar: 'A' },
  { name: 'Priya Sharma', city: 'Delhi', rating: 5, text: 'The home service option is a game changer. The barber arrived on time and the result was salon-quality — right at my doorstep!', avatar: 'P' },
  { name: 'Rahul Verma', city: 'Bangalore', rating: 5, text: 'I referred 3 friends and we all earned rewards. Best loyalty program I have ever used for grooming services.', avatar: 'R' },
  { name: 'Sneha Patel', city: 'Pune', rating: 5, text: 'Found a premium salon near my office through Nexora. The real-time slot availability makes planning so much easier.', avatar: 'S' },
];

const SERVICE_CATEGORIES = [
  {
    label: 'Hair Cut',
    icon: '✂️',
    count: '20+ Salons',
    color: 'border-gold/20 hover:border-gold/50',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80&fit=crop',
  },
  {
    label: 'Nails Art Studio',
    icon: '💅',
    count: '18+ Studios',
    color: 'border-gold/40 hover:border-gold',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&fit=crop',
  },
  {
    label: 'Beard Styling',
    icon: '🪒',
    count: '15+ Salons',
    color: 'border-blue-400/20 hover:border-blue-400/50',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80&fit=crop',
  },
  {
    label: 'Hair Spa',
    icon: '💆',
    count: '18+ Salons',
    color: 'border-emerald-400/20 hover:border-emerald-400/50',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80&fit=crop',
  },
  {
    label: 'Skin Fade',
    icon: '💈',
    count: '22+ Salons',
    color: 'border-gold/20 hover:border-gold/50',
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80&fit=crop',
  },
  {
    label: 'Facial & Glow',
    icon: '🧴',
    count: '10+ Salons',
    color: 'border-rose-400/20 hover:border-rose-400/50',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80&fit=crop',
  },
  {
    label: 'Hair Color',
    icon: '🎨',
    count: '12+ Salons',
    color: 'border-purple-400/20 hover:border-purple-400/50',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&fit=crop',
  },
  {
    label: 'Bridal / Groom',
    icon: '💍',
    count: '8+ Salons',
    color: 'border-amber-400/20 hover:border-amber-400/50',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80&fit=crop',
  },
];

const WHY_NEXORA = [
  { icon: Shield, label: 'Verified Salons', desc: 'Every salon on Nexora is personally reviewed and approved by our quality team before listing.', color: 'text-gold', bg: 'bg-gold/10 border-gold/20' },
  { icon: Zap, label: 'Instant Booking', desc: 'Reserve your slot in under 60 seconds. No calls, no waiting — just seamless online booking.', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { icon: Home, label: 'Home Service', desc: 'Can\'t make it to the salon? Book a professional groomer to come to your doorstep.', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  { icon: IndianRupee, label: 'Rewards & Cashback', desc: 'Earn 2% cashback on every booking and ₹20 for every friend you refer. Savings on every visit.', color: 'text-gold', bg: 'bg-gold/10 border-gold/20' },
  { icon: Smartphone, label: 'Real-time Slots', desc: 'See live availability and choose the exact time that suits you. No double bookings ever.', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  { icon: Award, label: 'Premium Quality', desc: 'Only the best salons and barbers make it on to the Nexora platform. Quality guaranteed.', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
];

// ─── useInView ────────────────────────────────────────────────────────────────

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Luxury Shop Card ─────────────────────────────────────────────────────────

function LuxuryShopCard({ shop, index, onClick }: { shop: any; index: number; onClick: () => void }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { ref, inView } = useInView(0.08);

  const photo = shop.photo ?? shop.photos?.[0];
  const rating = Number(shop.rating ?? shop.average_rating ?? 0);
  const reviews = Number(shop.totalReviews ?? shop.total_reviews ?? 0);
  const tags: string[] = Array.isArray(shop.tags) ? shop.tags : [];
  const isHome = !!(shop.homeService ?? shop.home_service_available);
  const bookings = Number(shop.total_bookings ?? 0);

  // High performing business gold badge
  const badgeText = rating >= 4.9 ? 'Luxury Choice' : 'Top Rated';

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="group relative cursor-pointer"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`,
      }}
    >
      <div className="bg-[#141414] rounded-2xl overflow-hidden border border-white/8 hover:border-gold/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-gold-lg group">
        <div className="relative h-52 overflow-hidden bg-[#1E1E1E]">
          {photo && !imgError ? (
            <img src={photo} alt={shop.name}
              onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1E1E1E]">
              <Scissors className="w-12 h-12 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/20 to-transparent" />
          
          {/* Top-Right: Rating Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#0A0A0A]/85 backdrop-blur-md border border-gold/30 px-2.5 py-1.5 rounded-full z-10">
            <Star className="w-3 h-3 fill-gold text-gold" />
            <span className="text-xs font-bold text-gold">{rating.toFixed(1)}</span>
          </div>

          {/* Top-Left: Small 'Top Rated' or 'Luxury Choice' Gold Badge Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-[#17130A]/95 to-[#241D0E]/95 backdrop-blur-md text-amber-300 border border-amber-400/50 shadow-[0_2px_12px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-105 font-inter">
              {badgeText === 'Luxury Choice' ? (
                <Crown className="w-3 h-3 text-gold fill-gold/25" />
              ) : (
                <Award className="w-3 h-3 text-gold" />
              )}
              <span>{badgeText}</span>
            </div>

            {isHome && (
              <div className="inline-flex items-center gap-1 bg-gold/90 text-[#0A0A0A] px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm font-inter">
                <Home className="w-2.5 h-2.5" /> Home
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <h3 className="text-white font-playfair font-bold text-lg leading-tight">{shop.name}</h3>
          </div>
        </div>
        <div className="px-4 pt-3 pb-4">
          {shop.tagline && (
            <p className="text-white/40 text-xs leading-relaxed mb-3 line-clamp-2">{shop.tagline}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-white/30 mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0 text-gold/50" />
            <span className="truncate">{shop.address || shop.city}</span>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">{tag}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 py-3 border-t border-white/8 mb-3">
            <div className="flex items-center gap-1 text-[11px] text-white/30">
              <Star className="w-3 h-3 text-gold/50" />
              <span>{reviews} reviews</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-white/30">
              <TrendingUp className="w-3 h-3 text-gold/50" />
              <span>{bookings} bookings</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-white/30 ml-auto">
              <Clock className="w-3 h-3" />
              <span>{String(shop.opening_time ?? '').slice(0, 5)}–{String(shop.closing_time ?? '').slice(0, 5)}</span>
            </div>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-[#0A0A0A] bg-gold hover:bg-gold-light transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-gold">
            Book Appointment <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Testimonial Carousel ─────────────────────────────────────────────────────

function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  const { ref, inView } = useInView(0.1);

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const t = TESTIMONIALS[idx];

  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
      <div className="nexora-card rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/4 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
        <Quote className="w-10 h-10 text-gold/20 mb-6" />
        <p className="font-playfair text-white text-xl md:text-2xl leading-relaxed mb-8 max-w-2xl">
          "{t.text}"
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center font-playfair font-bold text-gold text-lg">
              {t.avatar}
            </div>
            <div>
              <p className="font-playfair font-semibold text-white">{t.name}</p>
              <p className="text-white/30 text-sm font-inter">{t.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-gold text-gold" />
            ))}
          </div>
        </div>
        {/* Dots */}
        <div className="flex items-center gap-2 mt-8">
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-300 ${i === idx ? 'w-6 h-2 bg-gold' : 'w-2 h-2 bg-white/15 hover:bg-white/30'}`} />
          ))}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setIdx(p => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-gold/40 hover:text-gold text-white/40 flex items-center justify-center transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setIdx(p => (p + 1) % TESTIMONIALS.length)}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:border-gold/40 hover:text-gold text-white/40 flex items-center justify-center transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const [rawShops, setRawShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationOption>(() => {
    try {
      const stored = localStorage.getItem('nexora_user_location');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return parsed;
      }
    } catch {}
    return CURATED_LOCATIONS[0]; // 'all'
  });
  const { ref: sectionRef, inView: sectionInView } = useInView(0.05);
  const { ref: whyRef, inView: whyInView } = useInView(0.05);
  const { ref: catRef, inView: catInView } = useInView(0.05);
  const { ref: statsRef, inView: statsInView } = useInView(0.1);

  const handleLocationChange = useCallback((loc: LocationOption) => {
    setSelectedLocation(loc);
    try {
      localStorage.setItem('nexora_user_location', JSON.stringify(loc));
    } catch {}
  }, []);

  const loadShops = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getApprovedShops();
      const transformed = ((data as any[]) || []).map((shop: any) => {
        const mediaList: any[] = shop.shop_media ?? [];
        const photos = mediaList
          .filter((m: any) => m.media_type === 'photo')
          .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((m: any) => m.media_url as string);
        return {
          ...shop, photo: photos[0] ?? null, photos,
          rating: shop.average_rating, totalReviews: shop.total_reviews,
          homeService: shop.home_service_available,
          tags: (shop.services ?? []).slice(0, 3).map((s: any) => String(s.name ?? '')),
          isDemo: false,
        };
      });
      setRawShops(transformed);
    } catch (err) {
      console.error('Failed to load shops:', err);
      setRawShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadShops(); }, [loadShops]);

  const allShops = useMemo(() => rawShops.length > 0 ? rawShops : DUMMY_SHOPS, [rawShops]);

  const topRatedShops = useMemo(() => {
    let list = [...allShops].sort((a, b) => Number(b.rating ?? b.average_rating ?? 0) - Number(a.rating ?? a.average_rating ?? 0));

    // Location filtering by City & Area
    if (selectedLocation && selectedLocation.city !== 'all') {
      const { city, area } = selectedLocation;

      if (area) {
        const areaLower = area.toLowerCase();
        // Exact area matches (by landmark, address, tags, or description)
        const areaMatches = list.filter(s =>
          String(s.landmark || '').toLowerCase().includes(areaLower) ||
          String(s.address || '').toLowerCase().includes(areaLower) ||
          (Array.isArray(s.tags) && s.tags.some((t: string) => t.toLowerCase().includes(areaLower))) ||
          String(s.description || '').toLowerCase().includes(areaLower)
        );

        if (areaMatches.length > 0) {
          // Area matches prioritized first, followed by others in the same city
          const othersInCity = list.filter(s => !areaMatches.includes(s) && String(s.city || '').toLowerCase() === city.toLowerCase());
          list = [...areaMatches, ...othersInCity];
        } else {
          list = list.filter(s => String(s.city || '').toLowerCase() === city.toLowerCase());
        }
      } else if (city) {
        list = list.filter(s => String(s.city || '').toLowerCase() === city.toLowerCase());
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        String(s.name ?? '').toLowerCase().includes(q) ||
        String(s.city ?? '').toLowerCase().includes(q) ||
        String(s.address ?? '').toLowerCase().includes(q) ||
        String(s.landmark ?? '').toLowerCase().includes(q) ||
        String(s.tagline ?? '').toLowerCase().includes(q) ||
        (Array.isArray(s.tags) && s.tags.some((t: string) => t.toLowerCase().includes(q))) ||
        (Array.isArray(s.services) && s.services.some((svc: any) => String(svc.name || '').toLowerCase().includes(q)))
      );
    }
    return list.slice(0, 12);
  }, [allShops, selectedLocation, searchQuery]);

  function handleSearchNavigate() {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedLocation && selectedLocation.city !== 'all') {
      params.set('city', selectedLocation.city);
      if (selectedLocation.area) params.set('area', selectedLocation.area);
    }
    const paramStr = params.toString();
    navigate(paramStr ? `/salons?${paramStr}` : '/salons');
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ═══════ LIMITED TIME OFFERS BANNER ═══════ */}
      <LimitedTimeOfferBanner />

      {/* ═══════ HERO ═══════ */}
      <section className="relative h-[520px] sm:h-[550px] min-h-[480px] max-h-[580px] flex flex-col justify-center overflow-hidden">
        {/* Automatic Scrolling Background Image Carousel with Dark Gradient Overlays */}
        <HeroBackgroundCarousel />

        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-gold/5 blur-[120px] pointer-events-none z-10" />
        <div className="absolute bottom-1/3 left-1/5 w-72 h-72 rounded-full bg-gold/3 blur-[100px] pointer-events-none z-10" />

        <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-8 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 border border-gold/40 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 mb-3 shadow-lg self-start">
            <Sparkles className="w-3 h-3 text-gold" />
            <span className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase">Premium Salon Experience</span>
          </div>

          <div className="mb-3 sm:mb-4 max-w-3xl">
            <h1 className="font-playfair font-bold text-white leading-[1.05] tracking-tight mb-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>
              Where Style <span className="text-gold-gradient italic">Meets Luxury</span>
            </h1>
            <p className="text-white/90 text-sm sm:text-base font-inter font-light leading-relaxed max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              Book appointments at premier salons and barbershops. Curated for discerning clients.
            </p>
          </div>

          {/* Search + City Dropdown */}
          <div className="flex flex-col sm:flex-row gap-2.5 max-w-2xl mb-4 sm:mb-5">
            <div className="relative flex-1 bg-[#141414]/90 backdrop-blur-md border border-white/15 hover:border-gold/50 rounded-2xl flex items-center overflow-hidden transition-all duration-300 focus-within:border-gold/60 focus-within:shadow-gold shadow-2xl">
              <div className="pl-4 pr-2.5 flex-shrink-0">
                <Search className="w-4 h-4 text-gold/80" />
              </div>
              <input
                type="text"
                placeholder="Search salons, locations, or services…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchNavigate()}
                className="flex-1 py-3 pr-3 text-xs sm:text-sm text-white placeholder-white/40 bg-transparent outline-none font-inter"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mr-2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X className="w-3 h-3 text-white/50" />
                </button>
              )}
            </div>
            {/* Location Auto-Suggest with City & Area auto-detection */}
            <LocationAutoSuggest
              value={selectedLocation}
              onChange={handleLocationChange}
              availableShops={allShops}
              placeholder="Select city or area…"
            />

            <button type="button" onClick={handleSearchNavigate}
              className="bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl transition-all shadow-gold hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer">
              Search
            </button>
          </div>

          {/* Active location indicator if filtered */}
          {selectedLocation && selectedLocation.city !== 'all' && (
            <div className="flex items-center gap-2 mb-3.5 self-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-gold/15 border border-gold/40 text-gold font-inter backdrop-blur-md shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                <span>
                  Filtering salons & studios in <strong className="text-white">{selectedLocation.displayName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleLocationChange(CURATED_LOCATIONS[0])}
                  className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors ml-0.5 cursor-pointer"
                  title="Clear location filter"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}

          <div className="mb-3 sm:mb-4">
            <FeaturedOffersCarousel />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-2.5 mb-2 sm:mb-3">
            {[
              { label: '50+ Premier Salons', icon: Store },
              { label: '10,000+ Satisfied Clients', icon: Users },
              { label: '24/7 Easy Booking', icon: Zap },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5 border border-gold/20 bg-black/40 backdrop-blur-md rounded-full px-3 py-1">
                <Icon className="w-3 h-3 text-gold" />
                <span className="text-white/80 text-[11px] font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-white/30 text-[10px] tracking-widest uppercase font-inter">Explore Salons</span>
            <ChevronDown className="w-3 h-3 text-gold/60 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════ PLATFORM STATS BAR ═══════ */}
      <div ref={statsRef} className="border-y border-white/8 bg-[#0E0E0E]">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/8">
            {[
              { value: '50+', label: 'Premier Salons', icon: Store },
              { value: '10K+', label: 'Bookings Completed', icon: Award },
              { value: '4.9★', label: 'Average Rating', icon: Star },
              { value: '₹20', label: 'Referral Bonus', icon: IndianRupee },
            ].map(({ value, label, icon: Icon }, i) => (
              <div key={label} className="flex items-center gap-4 md:px-8 first:pl-0 last:pr-0"
                style={{ opacity: statsInView ? 1 : 0, transform: statsInView ? 'translateY(0)' : 'translateY(16px)', transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s` }}>
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="font-playfair font-bold text-white text-2xl leading-none">{value}</p>
                  <p className="text-white/35 text-xs font-inter mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ SERVICE CATEGORIES ═══════ */}
      <section className="w-full px-4 sm:px-8 lg:px-12 py-16">
        <div ref={catRef}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
            style={{ opacity: catInView ? 1 : 0, transform: catInView ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
            <div>
              <div className="gold-divider w-10 mb-4" />
              <h2 className="font-playfair font-bold text-white text-3xl sm:text-4xl mb-2">Popular Services</h2>
              <p className="text-white/35 text-sm font-inter">Find salons by what you need</p>
            </div>
            <button onClick={() => navigate('/salons')} type="button"
              className="flex items-center gap-2 text-xs font-semibold text-gold border border-gold/30 hover:border-gold hover:bg-gold/5 rounded-xl px-4 py-2.5 transition-all whitespace-nowrap">
              View All Salons <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {SERVICE_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => {
                  if (cat.label === 'Nails Art Studio') {
                    navigate('/salons?category=Nails+Art+Studio');
                  } else {
                    navigate(`/salons?q=${encodeURIComponent(cat.label.includes('Bridal') ? 'Bridal' : cat.label)}`);
                  }
                }}
                className="group relative h-60 sm:h-64 rounded-2xl overflow-hidden border border-white/10 hover:border-gold/70 shadow-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:-translate-y-1 transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-gold/50 cursor-pointer"
                style={{
                  opacity: catInView ? 1 : 0,
                  transform: catInView ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity 0.5s ease ${0.1 + i * 0.05}s, transform 0.5s ease ${0.1 + i * 0.05}s, border-color 0.3s`,
                }}
              >
                {/* Background image with hover zoom effect */}
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300 group-hover:from-black/95 group-hover:via-black/50" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-10">
                  {/* Top Row: Icon Badge & Count Tag */}
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-xl shadow-md group-hover:border-gold/50 group-hover:scale-105 transition-all">
                      {cat.icon}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/70 backdrop-blur-md border border-white/15 text-gold shadow-sm font-inter">
                      {cat.count}
                    </span>
                  </div>

                  {/* Bottom Row: Title & Action */}
                  <div>
                    <h3 className="text-white font-playfair font-bold text-lg sm:text-xl group-hover:text-gold transition-colors leading-tight">
                      {cat.label}
                    </h3>
                    <p className="text-white/70 text-xs font-inter mt-1.5 flex items-center gap-1.5 group-hover:text-white transition-colors">
                      <span>Explore salons</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gold group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ RECENTLY VIEWED (LAST 3 VISITED SALONS) ═══════ */}
      <RecentlyViewedCarousel />

      {/* ═══════ AI-POWERED RECOMMENDED FOR YOU ═══════ */}
      <RecommendedForYou />

      {/* ═══════ TOP RATED SALONS ═══════ */}
      <section ref={sectionRef} className="w-full px-4 sm:px-8 lg:px-12 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10"
          style={{ opacity: sectionInView ? 1 : 0, transform: sectionInView ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
          <div>
            <div className="gold-divider w-12 mb-4" />
            <h2 className="font-playfair font-bold text-white text-3xl sm:text-5xl leading-tight mb-2">
              Top Rated Salons {selectedLocation && selectedLocation.city !== 'all' ? (
                <span className="text-gold-gradient font-inter text-xl sm:text-3xl block sm:inline sm:ml-2">
                  in {selectedLocation.displayName}
                </span>
              ) : null}
            </h2>
            <p className="text-white/40 text-sm font-inter">
              {selectedLocation && selectedLocation.city !== 'all'
                ? `Showing handpicked premier salons & barbershops in ${selectedLocation.displayName}`
                : 'Handpicked premium salons delivering exceptional service'}
            </p>
          </div>
          <button onClick={() => {
            const url = selectedLocation && selectedLocation.city !== 'all'
              ? `/salons?city=${encodeURIComponent(selectedLocation.city)}${selectedLocation.area ? `&area=${encodeURIComponent(selectedLocation.area)}` : ''}`
              : '/salons';
            navigate(url);
          }} type="button"
            className="flex items-center gap-2 text-xs font-semibold text-gold border border-gold/30 hover:border-gold hover:bg-gold/5 rounded-xl px-4 py-2.5 transition-all whitespace-nowrap">
            <Store className="w-3.5 h-3.5" /> Browse All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 bg-[#141414] border border-gold/20 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-gold" />
            </div>
            <p className="text-white/30 font-inter text-sm">Curating your experience…</p>
          </div>
        ) : topRatedShops.length === 0 ? (
          <div className="text-center py-16 bg-[#121212]/90 border border-white/10 rounded-2xl p-8 max-w-xl mx-auto shadow-2xl">
            <MapPin className="w-10 h-10 text-gold/60 mx-auto mb-3 animate-pulse" />
            <h3 className="font-playfair text-white text-xl font-bold mb-1">
              No salons found in {selectedLocation.displayName}
            </h3>
            <p className="text-white/40 text-sm font-inter mb-5 leading-relaxed">
              We haven't partnered with salons in this exact locality yet. Reset your location filter to view all premier salons in nearby hubs.
            </p>
            <button
              type="button"
              onClick={() => handleLocationChange(CURATED_LOCATIONS[0])}
              className="px-6 py-2.5 rounded-xl bg-gold text-[#0A0A0A] font-bold text-xs shadow-gold hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Reset to All Locations
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topRatedShops.map((shop, i) => (
              <LuxuryShopCard key={String(shop.id)} shop={shop} index={i}
                onClick={() => {
                  recordSalonVisit(shop);
                  navigate(`/shop/${shop.id}`);
                }} />
            ))}
          </div>
        )}

        {!loading && topRatedShops.length > 0 && (
          <div className="text-center mt-10">
            <button onClick={() => {
              const url = selectedLocation && selectedLocation.city !== 'all'
                ? `/salons?city=${encodeURIComponent(selectedLocation.city)}${selectedLocation.area ? `&area=${encodeURIComponent(selectedLocation.area)}` : ''}`
                : '/salons';
              navigate(url);
            }} type="button"
              className="px-8 py-3.5 rounded-xl border border-gold/30 text-gold hover:bg-gold/5 hover:border-gold font-semibold text-sm transition-all">
              View All Salons {selectedLocation && selectedLocation.city !== 'all' ? `in ${selectedLocation.displayName}` : ''}
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </button>
          </div>
        )}
      </section>

      {/* ═══════ SERVICE FILTER STRIP ═══════ */}
      <ServiceFilterStrip selectedLocation={selectedLocation} />

      {/* ═══════ FEATURED NAIL STUDIOS ═══════ */}
      <FeaturedNailStudios selectedLocation={selectedLocation} />

      {/* ═══════ WHY NEXORA ═══════ */}
      <section className="border-t border-white/8 bg-[#0E0E0E]">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-20">
          <div ref={whyRef}>
            <div className="text-center mb-14"
              style={{ opacity: whyInView ? 1 : 0, transform: whyInView ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
              <div className="gold-divider w-10 mx-auto mb-5" />
              <h2 className="font-playfair font-bold text-white text-3xl sm:text-4xl md:text-5xl mb-4">Why Choose Nexora?</h2>
              <p className="text-white/35 text-base font-inter max-w-xl mx-auto leading-relaxed">
                We've built the most seamless salon booking experience — designed for clients who value their time and quality.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {WHY_NEXORA.map(({ icon: Icon, label, desc, color, bg }, i) => (
                <div key={label} className="nexora-card rounded-2xl p-6 group hover:border-gold/20 transition-all"
                  style={{ opacity: whyInView ? 1 : 0, transform: whyInView ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.5s ease ${0.1 + i * 0.08}s, transform 0.5s ease ${0.1 + i * 0.08}s` }}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${bg}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3 className="font-playfair font-bold text-white text-lg mb-2">{label}</h3>
                  <p className="text-white/35 text-sm font-inter leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="w-full px-4 sm:px-8 lg:px-12 py-20">
        <div className="text-center mb-12">
          <div className="gold-divider w-10 mx-auto mb-5" />
          <h2 className="font-playfair font-bold text-white text-3xl sm:text-4xl mb-3">Client Testimonials</h2>
          <p className="text-white/35 text-sm font-inter">Experiences from our valued clientele</p>
        </div>
        <TestimonialCarousel />
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {TESTIMONIALS.slice(1, 4).map((t) => (
            <div key={t.name} className="nexora-card rounded-2xl p-5">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-gold text-gold" />)}
              </div>
              <p className="text-white/50 text-xs font-inter leading-relaxed mb-4 line-clamp-3">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center text-gold text-xs font-bold font-playfair">{t.avatar}</div>
                <div>
                  <p className="text-white text-xs font-semibold font-inter">{t.name}</p>
                  <p className="text-white/25 text-[10px] font-inter">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ OWNER CTA ═══════ */}
      <section className="w-full px-4 sm:px-8 lg:px-12 pb-20">
        <div className="rounded-3xl overflow-hidden relative border border-gold/15">
          <div className="absolute inset-0 bg-gradient-to-br from-[#141414] to-[#0E0E0E]" />
          <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-gold/6 blur-[80px] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-8 sm:px-12 py-12 sm:py-16">
            <div>
              <div className="gold-divider w-8 mb-5" />
              <h3 className="font-playfair font-bold text-white text-3xl sm:text-4xl mb-3">Own a Salon?</h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-sm font-inter">
                Join Nexora and transform your business. Manage bookings, build your brand, and reach thousands of new clients.
              </p>
              <div className="flex items-center gap-4 mt-5">
                {[
                  { icon: Smile, label: 'No joining fee' },
                  { icon: Zap, label: 'Get listed in 24h' },
                  { icon: Users, label: '1000+ trusted clients' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-white/40 font-inter">
                    <Icon className="w-3.5 h-3.5 text-gold/60" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button type="button" onClick={() => navigate('/owner/register')}
                className="px-8 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm shadow-gold hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
                Register Your Salon
              </button>
              <button type="button" onClick={() => navigate('/login')}
                className="px-8 py-3.5 rounded-xl bg-transparent text-gold font-semibold text-sm border border-gold/40 hover:border-gold hover:bg-gold/5 transition-all whitespace-nowrap">
                Owner Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ BOTTOM FEATURES STRIP ═══════ */}
      <section className="border-t border-white/8">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Shield, label: 'Verified Salons', sub: 'Every salon reviewed & approved' },
              { icon: Zap, label: 'Instant Booking', sub: 'Reserve your slot in 60 seconds' },
              { icon: Home, label: 'Home Service', sub: 'Grooming at your doorstep' },
              { icon: Star, label: 'Premium Quality', sub: 'Real reviews from real clients' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="font-playfair font-semibold text-white text-sm mb-0.5">{label}</p>
                  <p className="text-white/30 text-xs leading-relaxed font-inter">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
