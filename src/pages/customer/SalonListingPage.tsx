import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Star, MapPin, Clock, Home, Store, Loader2, Search, X,
  ArrowRight, Scissors, TrendingUp, Filter, SlidersHorizontal,
  ChevronLeft, ChevronRight, ChevronDown, Grid3X3, List,
  Award, CheckCircle, Crown
} from 'lucide-react';
import { getApprovedShops } from '@/lib/api';
import { JAIPUR_PREMIER_SHOPS, FEATURED_NAIL_STUDIOS } from '@/lib/dummyShopsData';
import { recordSalonVisit } from '@/lib/recentlyViewed';

// ─── Demo data ────────────────────────────────────────────────────────────────

const BASE_DEMO_SHOPS = [
  {
    id: 'dummy-1', name: 'The Royal Barberia',
    tagline: 'Luxury grooming with modern fades and classic precision styling.',
    photo: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=900&h=600&fit=crop&q=90',
    rating: 4.9, totalReviews: 312, city: 'Mumbai', address: 'Bhilwara, Rajasthan',
    tags: ['Hair Cut', 'Premium', 'Beard Styling'], homeService: false,
    opening_time: '09:00', closing_time: '21:00', weekly_off: 'Monday',
    total_bookings: 1450, isDemo: true, category: 'Barbershop',
    home_service_charge: 0,
  },
  {
    id: 'dummy-2', name: 'Classic Cuts Studio',
    tagline: 'Professional grooming experts in a premium ambience.',
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&h=600&fit=crop&q=90',
    rating: 4.8, totalReviews: 210, city: 'Mumbai', address: 'Azad Nagar, Mumbai',
    tags: ['Home Service', 'Hair Spa', 'Hair Cut'], homeService: true,
    opening_time: '10:00', closing_time: '21:00', weekly_off: 'Tuesday',
    total_bookings: 980, isDemo: true, category: 'Salon',
    home_service_charge: 100,
  },
  {
    id: 'dummy-3', name: 'Urban Fade Lounge',
    tagline: 'Trendy hairstyles, skin fades, and luxury salon experience.',
    photo: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&h=600&fit=crop&q=90',
    rating: 5.0, totalReviews: 180, city: 'Delhi', address: 'Connaught Place, Delhi',
    tags: ['Skin Fade', 'Beard Styling', 'Premium'], homeService: false,
    opening_time: '09:30', closing_time: '22:00', weekly_off: 'Wednesday',
    total_bookings: 820, isDemo: true, category: 'Barbershop',
    home_service_charge: 0,
  },
  {
    id: 'dummy-4', name: 'Serenity Spa & Salon',
    tagline: 'Complete beauty solutions — hair, skin, and relaxation.',
    photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&h=600&fit=crop&q=90',
    rating: 4.7, totalReviews: 95, city: 'Bangalore', address: 'Koramangala, Bangalore',
    tags: ['Facial', 'Hair Spa', 'Hair Color'], homeService: true,
    opening_time: '09:00', closing_time: '20:00', weekly_off: 'Sunday',
    total_bookings: 540, isDemo: true, category: 'Spa',
    home_service_charge: 150,
  },
  {
    id: 'dummy-5', name: 'Prestige Barbers',
    tagline: 'Old-school precision meets modern style in every cut.',
    photo: 'https://images.unsplash.com/photo-1492526234853-2f83bfdb9c3a?w=900&h=600&fit=crop&q=90',
    rating: 4.6, totalReviews: 143, city: 'Pune', address: 'FC Road, Pune',
    tags: ['Hair Cut', 'Beard Styling', 'Hot Towel Shave'], homeService: false,
    opening_time: '08:30', closing_time: '20:00', weekly_off: 'Thursday',
    total_bookings: 670, isDemo: true, category: 'Barbershop',
    home_service_charge: 0,
  },
  {
    id: 'dummy-6', name: 'Glow Studio',
    tagline: 'Bridal and special occasion hair and makeup specialists.',
    photo: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900&h=600&fit=crop&q=90',
    rating: 4.8, totalReviews: 72, city: 'Chennai', address: 'Anna Nagar, Chennai',
    tags: ['Bridal', 'Hair Color', 'Facial'], homeService: true,
    opening_time: '09:00', closing_time: '19:00', weekly_off: 'Monday',
    total_bookings: 310, isDemo: true, category: 'Salon',
    home_service_charge: 200,
  },
];

const DUMMY_SHOPS = [...JAIPUR_PREMIER_SHOPS, ...FEATURED_NAIL_STUDIOS, ...BASE_DEMO_SHOPS];

export const CATEGORY_ITEMS = [
  { id: 'All', label: 'All Salons', icon: '✨' },
  { id: 'Nails Art Studio', label: 'Nails Art Studio', icon: '💅', primary: true },
  { id: 'Barbershop', label: 'Barbershop', icon: '💈' },
  { id: 'Salon', label: 'Salon', icon: '✂️' },
  { id: 'Spa', label: 'Spa & Wellness', icon: '💆' },
];

const CATEGORIES = CATEGORY_ITEMS.map(c => c.id);
const PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Budget (Under ₹500)', min: 0, max: 500 },
  { label: 'Mid-Range (₹500 - ₹1500)', min: 500, max: 1500 },
  { label: 'Luxury (₹1500+)', min: 1500, max: Infinity },
];
const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'bookings', label: 'Most Popular' },
  { value: 'name', label: 'A – Z' },
];
const RATING_OPTIONS = [0, 4, 4.5, 4.8];
const PER_PAGE = 9;

// ─── useInView ────────────────────────────────────────────────────────────────

function useInView(threshold = 0.05) {
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

// ─── Shop Card (Grid) ─────────────────────────────────────────────────────────

function ShopGridCard({ shop, index, onClick }: { shop: any; index: number; onClick: () => void }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { ref, inView } = useInView(0.05);

  const rating = Number(shop.rating ?? shop.average_rating ?? 0);
  const reviews = Number(shop.totalReviews ?? shop.total_reviews ?? 0);
  const badgeText = rating >= 4.9 ? 'Luxury Choice' : (rating >= 4.7 || shop.isDemo) ? 'Top Rated' : null;

  return (
    <div ref={ref} onClick={onClick} className="group cursor-pointer"
      style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.5s ease ${(index % 3) * 0.08}s, transform 0.5s ease ${(index % 3) * 0.08}s` }}>
      <div className="bg-[#141414] rounded-2xl overflow-hidden border border-white/8 hover:border-gold/40 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        <div className="relative h-48 overflow-hidden bg-[#1E1E1E] flex-shrink-0">
          {shop.photo && !imgError ? (
            <img src={shop.photo} alt={shop.name}
              onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Scissors className="w-12 h-12 text-white/10" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/80 via-transparent to-transparent" />
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#0A0A0A]/80 backdrop-blur-md border border-gold/30 px-2 py-1 rounded-full z-10">
            <Star className="w-3 h-3 fill-gold text-gold" />
            <span className="text-xs font-bold text-gold">{rating.toFixed(1)}</span>
          </div>
          
          {/* Top-Left: Gold Badge Overlay & Home service pill */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
            {badgeText && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-[#17130A]/95 to-[#241D0E]/95 backdrop-blur-md text-amber-300 border border-amber-400/50 shadow-[0_2px_10px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-105 font-inter">
                {badgeText === 'Luxury Choice' ? (
                  <Crown className="w-2.5 h-2.5 text-gold fill-gold/25" />
                ) : (
                  <Award className="w-2.5 h-2.5 text-gold" />
                )}
                <span>{badgeText}</span>
              </div>
            )}
            {(shop.homeService || shop.home_service_available) && (
              <div className="inline-flex items-center gap-1 bg-gold/90 text-[#0A0A0A] px-2 py-0.5 rounded-full text-[10px] font-bold font-inter shadow-sm">
                <Home className="w-2.5 h-2.5" /> Home
              </div>
            )}
          </div>

          {shop.category && (
            <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-[#0A0A0A]/70 backdrop-blur-sm rounded-full text-[10px] text-white/50 font-inter border border-white/10">
              {shop.category}
            </div>
          )}
        </div>

        <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
          <h3 className="font-playfair font-bold text-white text-base mb-1 leading-tight">{shop.name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-white/30 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0 text-gold/40" />
            <span className="truncate">{shop.address || shop.city}</span>
          </div>
          {Array.isArray(shop.tags) && shop.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              {shop.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-gold/80 border border-gold/20">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {shop.tagline && (
            <p className="text-white/35 text-xs leading-relaxed mb-3 line-clamp-2 flex-1">{shop.tagline}</p>
          )}
          <div className="flex items-center justify-between text-[11px] text-white/25 mb-3">
            <div className="flex items-center gap-1"><Star className="w-3 h-3 text-gold/40" />{reviews} reviews</div>
            <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{String(shop.opening_time ?? '').slice(0,5)}–{String(shop.closing_time ?? '').slice(0,5)}</div>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-[#0A0A0A] bg-gold hover:bg-gold-light transition-all flex items-center justify-center gap-1.5 shadow-gold mt-auto">
            Book Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shop Row (List) ──────────────────────────────────────────────────────────

function ShopListRow({ shop, onClick }: { shop: any; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const rating = Number(shop.rating ?? shop.average_rating ?? 0);
  const reviews = Number(shop.totalReviews ?? shop.total_reviews ?? 0);
  const tags: string[] = Array.isArray(shop.tags) ? shop.tags : [];

  return (
    <div onClick={onClick} className="group cursor-pointer bg-[#141414] border border-white/8 hover:border-gold/30 rounded-2xl p-4 flex gap-4 transition-all hover:-translate-y-0.5">
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#1E1E1E] flex-shrink-0">
        {shop.photo && !imgError ? (
          <img src={shop.photo} alt={shop.name} onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Scissors className="w-8 h-8 text-white/10" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-playfair font-bold text-white text-base mb-0.5 truncate">{shop.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-white/30">
              <MapPin className="w-3 h-3 text-gold/40 flex-shrink-0" />
              <span className="truncate">{shop.address || shop.city}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span className="text-gold font-bold text-sm">{rating.toFixed(1)}</span>
            <span className="text-white/20 text-xs">({reviews})</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 my-2">
          {tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/40">{tag}</span>
          ))}
          {(shop.homeService || shop.home_service_available) && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold/70 flex items-center gap-1">
              <Home className="w-2.5 h-2.5" /> Home
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-white/25">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{String(shop.opening_time ?? '').slice(0,5)}–{String(shop.closing_time ?? '').slice(0,5)}</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{shop.total_bookings} bookings</span>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#0A0A0A] bg-gold hover:bg-gold-light transition-all shadow-gold flex items-center gap-1">
            Book <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SalonListingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rawShops, setRawShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || 'all');
  const [area, setArea] = useState(searchParams.get('area') || '');
  const [category, setCategory] = useState('All');
  const [priceRangeIndex, setPriceRangeIndex] = useState(0);
  const [homeOnly, setHomeOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);

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
          tags: (shop.services ?? []).slice(0, 4).map((s: any) => String(s.name ?? '')),
          isDemo: false,
        };
      });
      setRawShops(transformed);
    } catch {
      setRawShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadShops(); }, [loadShops]);

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam !== null) setSearch(qParam);
    const cityParam = searchParams.get('city');
    if (cityParam) setCity(cityParam);
    const areaParam = searchParams.get('area');
    if (areaParam !== null) setArea(areaParam);
    const catParam = searchParams.get('category');
    if (catParam) setCategory(catParam);
  }, [searchParams]);

  const allShops = useMemo(() => rawShops.length > 0 ? rawShops : DUMMY_SHOPS, [rawShops]);

  const cities = useMemo(() => {
    const citySet = new Set(allShops.map((s: any) => s.city?.trim()).filter(Boolean));
    const normalizedCities = Array.from(citySet).map(c => c!.charAt(0).toUpperCase() + c!.slice(1));
    const combined = ['all', 'Jaipur', ...normalizedCities.filter(c => c.toLowerCase() !== 'jaipur')];
    return Array.from(new Set(combined));
  }, [allShops]);

  const filtered = useMemo(() => {
    let list = [...allShops];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(s =>
        String(s.name ?? '').toLowerCase().includes(q) ||
        String(s.city ?? '').toLowerCase().includes(q) ||
        String(s.address ?? '').toLowerCase().includes(q) ||
        String(s.landmark ?? '').toLowerCase().includes(q) ||
        String(s.tagline ?? '').toLowerCase().includes(q) ||
        (Array.isArray(s.tags) && s.tags.some((t: string) => t.toLowerCase().includes(q))) ||
        (s.category && String(s.category).toLowerCase().includes(q)) ||
        (Array.isArray(s.services) && s.services.some((svc: any) => String(svc.name || '').toLowerCase().includes(q)))
      );
    }
    if (city && city !== 'all') {
      list = list.filter(s => String(s.city || '').toLowerCase() === city.toLowerCase());
    }
    if (area) {
      const a = area.toLowerCase();
      list = list.filter(s =>
        String(s.landmark || '').toLowerCase().includes(a) ||
        String(s.address || '').toLowerCase().includes(a) ||
        (Array.isArray(s.tags) && s.tags.some((t: string) => t.toLowerCase().includes(a))) ||
        String(s.description || '').toLowerCase().includes(a)
      );
    }
    if (category !== 'All') {
      const catLower = category.toLowerCase();
      list = list.filter(s => {
        const sCat = (s.category || '').toLowerCase();
        if (catLower.includes('nail')) {
          if (sCat.includes('nail')) return true;
          if (Array.isArray(s.tags) && s.tags.some((t: string) => t.toLowerCase().includes('nail') || t.toLowerCase().includes('manicure'))) return true;
          if (Array.isArray(s.services) && s.services.some((svc: any) => String(svc.name || '').toLowerCase().includes('nail') || String(svc.category || '').toLowerCase().includes('nail') || String(svc.category || '').toLowerCase().includes('manicure'))) return true;
          return false;
        }
        return sCat === catLower || sCat.includes(catLower);
      });
    }
    if (priceRangeIndex > 0) {
      const range = PRICE_RANGES[priceRangeIndex];
      list = list.filter(s => {
        const services = s.services || [];
        if (services.length === 0) return true;
        return services.some((svc: any) => {
          const price = Number(svc.price || 0);
          return price >= range.min && price <= range.max;
        });
      });
    }
    if (homeOnly) list = list.filter(s => s.homeService || s.home_service_available);
    if (minRating > 0) list = list.filter(s => Number(s.rating ?? s.average_rating ?? 0) >= minRating);

    list.sort((a, b) => {
      if (sortBy === 'rating') return Number(b.rating ?? b.average_rating ?? 0) - Number(a.rating ?? a.average_rating ?? 0);
      if (sortBy === 'bookings') return Number(b.total_bookings ?? 0) - Number(a.total_bookings ?? 0);
      if (sortBy === 'name') return String(a.name ?? '').localeCompare(String(b.name ?? ''));
      return 0;
    });
    return list;
  }, [allShops, search, city, area, category, priceRangeIndex, homeOnly, minRating, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [search, city, area, category, priceRangeIndex, homeOnly, minRating, sortBy]);

  function clearFilters() {
    setSearch('');
    setCity('all');
    setArea('');
    setCategory('All');
    setPriceRangeIndex(0);
    setHomeOnly(false);
    setMinRating(0);
    setSortBy('rating');
    setPage(1);
  }

  const hasActiveFilters = search || city !== 'all' || area || category !== 'All' || priceRangeIndex > 0 || homeOnly || minRating > 0;

  const inputCls = 'w-full px-3 py-2.5 text-sm bg-[#0A0A0A] border border-white/12 focus:border-gold/40 text-white placeholder-white/20 rounded-xl outline-none font-inter transition-all';

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ── Page Header ── */}
      <div className="border-b border-white/8 bg-[#0E0E0E]">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
          <div className="gold-divider w-8 mb-4" />
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-playfair font-bold text-white text-3xl sm:text-4xl mb-2">Explore Salons</h1>
              <p className="text-white/35 text-sm font-inter">
                {loading ? 'Loading salons…' : `${filtered.length} salon${filtered.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search salons, services, cities…"
                className="w-full h-11 pl-10 pr-10 text-sm bg-[#141414] border border-white/12 focus:border-gold/40 text-white placeholder-white/20 rounded-xl outline-none font-inter"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                  <X className="w-3 h-3 text-white/40" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <div className="flex gap-8">
          {/* ── Filter Sidebar ── */}
          <aside className={`flex-shrink-0 transition-all duration-300 ${showFilters ? 'w-64' : 'w-0 overflow-hidden'} hidden md:block`}>
            <div className="w-64 space-y-5 sticky top-24">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-gold" />
                  <p className="font-playfair font-semibold text-white">Filters</p>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 font-inter transition-colors px-2 py-1 border border-red-500/20 rounded-md bg-red-500/5 hover:bg-red-500/10">Clear all</button>
                )}
              </div>

              {/* City */}
              <div className="nexora-card rounded-xl p-4">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 font-inter">City</p>
                <div className="relative">
                  <select value={city} onChange={e => setCity(e.target.value)}
                    className={`${inputCls} pr-8 appearance-none cursor-pointer ring-2 ring-gold/50`}>
                    {cities.map(c => <option key={c} value={c} className="bg-[#141414]">{c === 'all' ? 'All Cities' : c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                </div>
              </div>

              {/* Category */}
              <div className="nexora-card rounded-xl p-4">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 font-inter">Category</p>
                <div className="space-y-1">
                  {CATEGORY_ITEMS.map(cat => (
                    <button key={cat.id} onClick={() => setCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all font-inter cursor-pointer ${
                        category === cat.id
                          ? 'bg-gold/15 border border-gold/40 text-gold shadow-[0_0_12px_rgba(212,175,55,0.25)] font-semibold'
                          : 'text-white/60 hover:text-white hover:bg-white/5 hover:border-gold/30 hover:shadow-[0_0_10px_rgba(212,175,55,0.15)] border border-transparent'
                      }`}>
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span>{cat.label}</span>
                        {cat.primary && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-gold/20 text-gold border border-gold/30 uppercase font-bold">Primary</span>
                        )}
                      </span>
                      {category === cat.id && <CheckCircle className="w-3.5 h-3.5 text-gold" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="nexora-card rounded-xl p-4">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 font-inter">Price Range</p>
                <div className="space-y-1">
                  {PRICE_RANGES.map((range, idx) => (
                    <button key={range.label} onClick={() => setPriceRangeIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all font-inter ${priceRangeIndex === idx ? 'bg-gold/10 border border-gold/25 text-gold' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                      {range.label}
                      {priceRangeIndex === idx && <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Rating */}
              <div className="nexora-card rounded-xl p-4">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 font-inter">Minimum Rating</p>
                <div className="space-y-1">
                  {RATING_OPTIONS.map(r => (
                    <button key={r} onClick={() => setMinRating(r)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all font-inter ${minRating === r ? 'bg-gold/10 border border-gold/25 text-gold' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                      <span className="flex items-center gap-1.5">
                        <Star className={`w-3.5 h-3.5 ${minRating === r ? 'fill-gold text-gold' : 'text-white/20'}`} />
                        {r === 0 ? 'Any rating' : `${r}+ Stars`}
                      </span>
                      {minRating === r && <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Home Service */}
              <div className="nexora-card rounded-xl p-4">
                <button onClick={() => setHomeOnly(p => !p)}
                  className="w-full flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${homeOnly ? 'bg-gold' : 'bg-white/10'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${homeOnly ? 'left-5' : 'left-1'}`} />
                    </div>
                    <div>
                      <p className="text-white/70 text-sm font-inter font-medium">Home Service</p>
                      <p className="text-white/25 text-[10px] font-inter">Grooming at your doorstep</p>
                    </div>
                  </div>
                  <Home className={`w-4 h-4 ${homeOnly ? 'text-gold' : 'text-white/20'}`} />
                </button>
              </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Category Filter Pills Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none snap-x">
              {CATEGORY_ITEMS.map((item) => {
                const isSelected = category === item.id;
                const isNailStudio = item.id === 'Nails Art Studio';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={`flex-shrink-0 snap-start flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-300 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-gradient-to-r from-gold via-gold-light to-gold text-[#0A0A0A] border-gold shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-[1.02] font-bold'
                        : isNailStudio
                        ? 'bg-[#17140f] border-gold/40 text-white hover:text-gold hover:border-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:-translate-y-0.5'
                        : 'bg-[#141414] border-white/10 hover:border-gold/50 text-white/70 hover:text-white hover:shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:-translate-y-0.5'
                    }`}
                  >
                    <span className="text-sm leading-none">{item.icon}</span>
                    <span className="font-inter whitespace-nowrap">{item.label}</span>
                    {item.primary && !isSelected && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-gold/20 text-gold border border-gold/30 uppercase font-bold tracking-wider">
                        Primary
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              {/* Mobile filters toggle + count */}
              <div className="flex items-center gap-3">
                <button onClick={() => setShowFilters(p => !p)}
                  className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-white/12 hover:border-gold/30 text-white/40 hover:text-gold text-xs font-semibold font-inter transition-all">
                  <Filter className="w-3.5 h-3.5" />
                  Filters
                  {hasActiveFilters && <span className="w-2 h-2 bg-gold rounded-full" />}
                </button>
                <p className="text-white/25 text-xs font-inter">
                  {loading ? 'Loading…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-inter transition-colors">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <div className="relative">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="h-9 pl-3 pr-8 text-xs bg-[#141414] border border-white/12 focus:border-gold/40 text-white/60 rounded-xl outline-none font-inter appearance-none cursor-pointer">
                    {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-[#141414]">{opt.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                </div>

                {/* View mode */}
                <div className="flex gap-1 bg-[#141414] rounded-xl p-1 border border-white/8">
                  <button onClick={() => setViewMode('grid')}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-gold text-[#0A0A0A]' : 'text-white/30 hover:text-white'}`}>
                    <Grid3X3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-gold text-[#0A0A0A]' : 'text-white/30 hover:text-white'}`}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-5">
                {search && <span className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold font-inter">"{search}" <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button></span>}
                {city !== 'all' && <span className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold font-inter">{city} <button onClick={() => setCity('all')}><X className="w-3 h-3" /></button></span>}
                {category !== 'All' && <span className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold font-inter">{category} <button onClick={() => setCategory('All')}><X className="w-3 h-3" /></button></span>}
                {priceRangeIndex > 0 && <span className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold font-inter">{PRICE_RANGES[priceRangeIndex].label} <button onClick={() => setPriceRangeIndex(0)}><X className="w-3 h-3" /></button></span>}
                {homeOnly && <span className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold font-inter">Home Service <button onClick={() => setHomeOnly(false)}><X className="w-3 h-3" /></button></span>}
                {minRating > 0 && <span className="flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold font-inter">{minRating}+ Stars <button onClick={() => setMinRating(0)}><X className="w-3 h-3" /></button></span>}
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-14 h-14 bg-[#141414] border border-gold/20 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-gold" />
                </div>
                <p className="text-white/30 font-inter text-sm">Curating your experience…</p>
              </div>
            ) : paged.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-[#141414] border border-white/10 rounded-2xl flex items-center justify-center mb-5">
                  <Store className="w-8 h-8 text-white/15" />
                </div>
                <p className="font-playfair font-semibold text-white text-xl mb-2">No salons found</p>
                <p className="text-white/30 text-sm font-inter mb-6">Try adjusting your filters or search query</p>
                <button onClick={clearFilters}
                  className="px-6 py-2.5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm rounded-xl shadow-gold transition-all font-inter">
                  Clear All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {paged.map((shop, i) => (
                  <ShopGridCard key={String(shop.id)} shop={shop} index={i}
                    onClick={() => {
                      recordSalonVisit(shop);
                      navigate(`/shop/${shop.id}`);
                    }} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {paged.map((shop) => (
                  <ShopListRow key={String(shop.id)} shop={shop}
                    onClick={() => {
                      recordSalonVisit(shop);
                      navigate(`/shop/${shop.id}`);
                    }} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/8">
                <p className="text-xs text-white/25 font-inter">
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-9 h-9 bg-[#141414] border border-white/10 hover:border-gold/30 text-white/40 hover:text-gold rounded-xl flex items-center justify-center disabled:opacity-30 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold font-inter transition-all ${p === page ? 'bg-gold text-[#0A0A0A] shadow-gold' : 'bg-[#141414] border border-white/10 text-white/40 hover:border-gold/30 hover:text-gold'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-9 h-9 bg-[#141414] border border-white/10 hover:border-gold/30 text-white/40 hover:text-gold rounded-xl flex items-center justify-center disabled:opacity-30 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* List your salon strip */}
            {!loading && (
              <div className="mt-12 nexora-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-gold/15">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-playfair font-semibold text-white">Own a salon? Join Nexora</p>
                    <p className="text-white/30 text-xs font-inter">Reach thousands of new clients. Free to list.</p>
                  </div>
                </div>
                <button onClick={() => navigate('/owner/register')} type="button"
                  className="px-6 py-2.5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm rounded-xl shadow-gold transition-all whitespace-nowrap font-inter">
                  Get Listed Free →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
