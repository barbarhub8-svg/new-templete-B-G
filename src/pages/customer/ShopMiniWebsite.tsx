import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Clock, Home, IndianRupee, ArrowLeft,
  Loader2, Phone, X, ChevronLeft, ChevronRight, Check, Scissors,
  PlayCircle, Share2, ArrowUpRight, ExternalLink, ZoomIn,
  Calendar, Users, Award, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getShopById, getShopStaff } from '../../lib/api';
import type { StaffMember } from '../../types';
import { recordSalonVisit } from '../../lib/recentlyViewed';

function fmt12h(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function isOpenNow(openingTime: string, closingTime: string, weeklyOff: string) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  if (days[new Date().getDay()] === weeklyOff) return false;
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const open  = parseInt(openingTime?.split(':')[0] ?? '9') * 60 + parseInt(openingTime?.split(':')[1] ?? '0');
  const close = parseInt(closingTime?.split(':')[0] ?? '21') * 60 + parseInt(closingTime?.split(':')[1] ?? '0');
  return now >= open && now < close;
}

function Lightbox({ photos, index, onClose, onPrev, onNext }: {
  photos: string[]; index: number; onClose: ()=>void; onPrev: ()=>void; onNext: ()=>void;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[300] bg-[#0A0A0A]/98 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="text-white/40 text-sm font-medium tabular-nums font-inter">{index + 1} / {photos.length}</span>
        <button onClick={onClose} className="w-9 h-9 bg-white/8 hover:bg-white/15 rounded-xl flex items-center justify-center text-white border border-white/10 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative px-14" onClick={(e) => e.stopPropagation()}>
        {photos.length > 1 && (
          <button onClick={onPrev} className="absolute left-4 w-11 h-11 bg-white/8 hover:bg-white/15 rounded-xl flex items-center justify-center text-white border border-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <img src={photos[index]} alt="" className="max-h-[72vh] max-w-full object-contain rounded-2xl" draggable={false} />
        {photos.length > 1 && (
          <button onClick={onNext} className="absolute right-4 w-11 h-11 bg-white/8 hover:bg-white/15 rounded-xl flex items-center justify-center text-white border border-white/10 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function PhotoGallery({ photos, onOpenLightbox }: { photos: string[]; onOpenLightbox: (i: number) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  if (photos.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full aspect-[16/9] bg-[#1E1E1E] rounded-2xl overflow-hidden cursor-zoom-in group border border-white/8"
        onClick={() => onOpenLightbox(activeIndex)}>
        <img key={photos[activeIndex]} src={photos[activeIndex]} alt="" onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-[1.02] transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} />
        {!imgLoaded && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-white/20" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-4 right-4 bg-[#0A0A0A]/60 backdrop-blur-sm border border-gold/30 text-gold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-3.5 h-3.5" /> View full
        </div>
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-[#0A0A0A]/60 backdrop-blur-sm border border-white/10 text-white/60 text-xs px-2.5 py-1 rounded-full font-medium">
            {activeIndex + 1} / {photos.length}
          </div>
        )}
        {photos.length > 1 && (<>
          <button onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i - 1 + photos.length) % photos.length); setImgLoaded(false); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#0A0A0A]/50 hover:bg-[#0A0A0A]/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i + 1) % photos.length); setImgLoaded(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#0A0A0A]/50 hover:bg-[#0A0A0A]/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100">
            <ChevronRight className="w-4 h-4" />
          </button>
        </>)}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button key={i} onClick={() => { setActiveIndex(i); setImgLoaded(false); }}
              className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 ${i === activeIndex ? 'border-gold shadow-gold' : 'border-white/10 opacity-50 hover:opacity-80 hover:border-white/30'}`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceItem({ service, selected, onToggle }: { service: any; selected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`w-full flex items-center gap-4 text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
        selected ? 'border-gold bg-gold/5 shadow-gold' : 'border-white/10 bg-[#1E1E1E] hover:border-gold/30'
      }`}>
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        selected ? 'bg-gold border-gold' : 'border-white/20'
      }`}>
        {selected && <Check className="w-3 h-3 text-[#0A0A0A]" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm font-inter ${selected ? 'text-gold' : 'text-white/80'}`}>{service.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Clock className="w-3 h-3 text-white/30 flex-shrink-0" />
          <span className="text-xs text-white/30 font-medium">{service.duration_minutes} min</span>
        </div>
      </div>
      <div className={`flex items-center gap-0.5 font-bold text-base flex-shrink-0 ${selected ? 'text-gold' : 'text-white/40'}`}>
        <IndianRupee className="w-4 h-4" />{service.price.toLocaleString('en-IN')}
      </div>
    </button>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="bg-[#1E1E1E] border border-white/8 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center font-bold text-gold text-sm flex-shrink-0">
            {review.customer_name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <p className="font-semibold text-sm text-white">{review.customer_name}</p>
            <div className="flex items-center gap-0.5 mt-0.5">
              {[1,2,3,4,5].map((i) => <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'fill-gold text-gold' : 'text-white/15'}`} />)}
            </div>
          </div>
        </div>
        <span className="text-[11px] text-white/25 flex-shrink-0 font-inter">
          {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      {review.comment && <p className="text-sm text-white/50 leading-relaxed font-inter">{review.comment}</p>}
    </div>
  );
}

export default function ShopMiniWebsite() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (shopId) loadShop(); else navigate('/'); }, [shopId]);
  useEffect(() => {
    const h = () => { const b = heroRef.current?.getBoundingClientRect().bottom ?? 0; setStickyVisible(b < 0); };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  async function loadShop() {
    try {
      setLoading(true);
      const [data, staff] = await Promise.all([
        getShopById(shopId!),
        getShopStaff(shopId!, true),
      ]);
      if (!data) throw new Error('Shop not found');
      setShop(data);
      setStaffList(staff || []);
      recordSalonVisit(data);
    } catch (err: any) {
      toast({ title: 'Shop Not Found', description: err.message, variant: 'destructive' });
      setTimeout(() => navigate('/'), 2000);
    } finally { setLoading(false); }
  }

  const photos: string[] = (shop?.shop_media ?? [])
    .filter((m: any) => m.media_type === 'photo')
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((m: any) => m.media_url as string);

  const logoUrl: string | undefined = (shop?.shop_media ?? []).find(
    (m: any) => m.media_type === 'owner_photo'
  )?.media_url;

  const videoMedia = (shop?.shop_media ?? []).find((m: any) => m.media_type === 'video');
  const activeServices = (shop?.services ?? []).filter((s: any) => s.is_active !== false);
  const reviews: any[] = shop?.reviews ?? [];
  const totalPrice = selectedServices.reduce((s, svc) => s + svc.price, 0);
  const totalDuration = selectedServices.reduce((s, svc) => s + svc.duration_minutes, 0);

  function toggleService(svc: any) {
    setSelectedServices((prev) => prev.find((s) => s.id === svc.id) ? prev.filter((s) => s.id !== svc.id) : [...prev, svc]);
  }
  function proceedToBook() { navigate(`/shop/${shopId}/book`, { state: { preSelectedServices: selectedServices } }); }
  const openLightbox = useCallback((i: number) => { setLightboxIndex(i); setLightboxOpen(true); }, []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevPhoto = useCallback(() => setLightboxIndex((i) => (i === 0 ? photos.length - 1 : i - 1)), [photos.length]);
  const nextPhoto = useCallback(() => setLightboxIndex((i) => (i === photos.length - 1 ? 0 : i + 1)), [photos.length]);

  function handleShare() {
    if (navigator.share) { navigator.share({ title: shop?.name, url: window.location.href }); }
    else { navigator.clipboard.writeText(window.location.href); toast({ title: 'Link Copied!' }); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A]">
        <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-2xl flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 animate-spin text-gold" />
        </div>
        <p className="text-white/30 font-inter text-sm">Loading salon…</p>
      </div>
    );
  }
  if (!shop) return null;

  const openNow = isOpenNow(shop.opening_time, shop.closing_time, shop.weekly_off);
  const mapsAddress = encodeURIComponent(`${shop.address}, ${shop.city}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsAddress}`;
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapsAddress}&output=embed`;
  const whatsappUrl = shop.contact_number
    ? `https://wa.me/91${shop.contact_number.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I'd like to book at ${shop.name}.`)}`
    : null;
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {lightboxOpen && photos.length > 0 && (
        <Lightbox photos={photos} index={lightboxIndex} onClose={closeLightbox} onPrev={prevPhoto} onNext={nextPhoto} />
      )}

      {/* Sticky bottom CTA */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${stickyVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="bg-[#141414] border-t border-gold/20 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {logoUrl ? (
                <div className="w-9 h-9 rounded-xl bg-[#0A0A0A] border border-gold/30 p-0.5 flex-shrink-0 overflow-hidden shadow-sm">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center font-playfair font-bold text-gold text-xs flex-shrink-0">
                  {shop.name?.charAt(0) || 'S'}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-playfair font-bold text-white text-sm truncate">{shop.name}</p>
                <p className="text-xs text-white/30 font-inter truncate">{selectedServices.length > 0 ? `${selectedServices.length} selected · ~${totalDuration} min` : 'Select services or book'}</p>
              </div>
            </div>
            {selectedServices.length > 0 && (
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-white/30">Total</p>
                <p className="font-bold text-gold text-lg leading-none">₹{totalPrice.toLocaleString('en-IN')}</p>
              </div>
            )}
            <button onClick={proceedToBook}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm rounded-xl transition-all shadow-gold active:scale-95">
              <Calendar className="w-4 h-4" /> Book Now
            </button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div ref={heroRef}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white bg-[#0A0A0A]/60 backdrop-blur-md border border-white/15 px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-[#0A0A0A]/80 transition-colors">
            <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline font-inter">Back</span>
          </button>
          <button onClick={handleShare}
            className="w-10 h-10 bg-[#0A0A0A]/60 backdrop-blur-md border border-white/15 rounded-xl flex items-center justify-center text-white hover:bg-[#0A0A0A]/80 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Hero image with Auto-Resize container */}
        <div className="relative h-[55vh] min-h-[400px] max-h-[620px] bg-[#141414] overflow-hidden">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[activeHeroIndex] || photos[0]}
                alt={shop.name}
                className="w-full h-full object-cover object-center opacity-70 transition-all duration-700 select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-[#0A0A0A]/20" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Scissors className="w-16 h-16 text-white/10" />
            </div>
          )}

          {/* Multiple Hero Photos Slider Controls (if owner added multiple images) */}
          {photos.length > 1 && (
            <div className="absolute top-20 right-5 z-20 flex items-center gap-1.5 bg-[#0A0A0A]/75 backdrop-blur-md border border-gold/30 px-3 py-1 rounded-full shadow-gold/10">
              <span className="text-[10px] text-white/60 font-inter font-medium mr-0.5">
                {activeHeroIndex + 1}/{photos.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveHeroIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors"
                title="Previous hero photo"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setActiveHeroIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition-colors"
                title="Next hero photo"
              >
                ›
              </button>
            </div>
          )}

          {/* Open status */}
          <div className="absolute top-20 left-5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${
              openNow ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-red-500/15 border-red-400/30 text-red-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${openNow ? 'bg-gold animate-gold-pulse' : 'bg-red-400'}`} />
              {openNow ? `Open · Closes ${fmt12h(shop.closing_time)}` : 'Closed Now'}
            </span>
          </div>

          {/* Salon Logo, Name & Branding in Hero */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-8">
            <div className="flex items-center gap-3.5 sm:gap-4 mb-2.5">
              {/* Salon Logo with Auto-Resize container */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0A0A0A]/90 border-2 border-gold/40 shadow-gold p-1 flex-shrink-0 backdrop-blur-md overflow-hidden flex items-center justify-center">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${shop.name} logo`}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <span className="font-playfair font-bold text-gold text-2xl sm:text-3xl">
                    {shop.name?.charAt(0) || 'S'}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-playfair font-bold text-white leading-tight" style={{ fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)' }}>
                  {shop.name}
                </h1>
                {shop.tagline && <p className="text-white/50 text-xs sm:text-sm italic font-inter mt-0.5 line-clamp-1">"{shop.tagline}"</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/40 text-xs sm:text-sm font-inter">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold/50" />{shop.address}, {shop.city}</span>
              {shop.contact_number && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gold/50" />{shop.contact_number}</span>}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-[#141414] border-b border-white/8">
          <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center gap-6 overflow-x-auto">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((i) => <Star key={i} className={`w-3 h-3 ${i <= Math.round(shop.average_rating||0) ? 'fill-gold text-gold' : 'text-white/15'}`} />)}
              </div>
              <span className="font-bold text-sm text-white">{Number(shop.average_rating||0).toFixed(1)}</span>
              <span className="text-white/30 text-xs font-inter">({shop.total_reviews||0})</span>
            </div>
            <div className="w-px h-5 bg-white/10 flex-shrink-0" />
            <div className="flex items-center gap-1.5 flex-shrink-0 text-sm text-white/40 font-inter">
              <Clock className="w-3.5 h-3.5 text-gold/50" />
              <span>{fmt12h(shop.opening_time)} – {fmt12h(shop.closing_time)}</span>
            </div>
            {shop.home_service_available && (<>
              <div className="w-px h-5 bg-white/10 flex-shrink-0" />
              <div className="flex items-center gap-1.5 flex-shrink-0 text-sm text-gold font-inter">
                <Home className="w-3.5 h-3.5" /><span>Home Service</span>
              </div>
            </>)}
            <button onClick={proceedToBook}
              className="ml-auto flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm rounded-xl transition-all shadow-gold active:scale-95">
              <Scissors className="w-4 h-4" /> Book Now
            </button>
          </div>
        </div>
      </div>

      {/* PAGE BODY */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10 pb-28">

        {/* Gallery */}
        {photos.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-playfair font-bold text-white text-xl">Gallery</h2>
              {photos.length > 1 && (
                <button onClick={() => openLightbox(0)}
                  className="text-xs font-semibold text-gold/60 hover:text-gold flex items-center gap-1.5 transition-colors font-inter">
                  <ZoomIn className="w-3.5 h-3.5" /> All ({photos.length})
                </button>
              )}
            </div>
            <PhotoGallery photos={photos} onOpenLightbox={openLightbox} />
            {videoMedia && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2"><PlayCircle className="w-4 h-4 text-gold/50" /><span className="text-sm font-semibold text-white/60 font-inter">Shop Tour</span></div>
                <div className="aspect-video bg-[#1E1E1E] border border-white/8 rounded-2xl overflow-hidden">
                  <video src={videoMedia.media_url} controls className="w-full h-full" />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Services */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="gold-divider w-8 mb-3" />
              <h2 className="font-playfair font-bold text-white text-xl">Services</h2>
              <p className="text-white/30 text-xs mt-0.5 font-inter">{activeServices.length} available</p>
            </div>
            {selectedServices.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-white/30 font-inter">{selectedServices.length} selected</p>
                <p className="text-xl font-bold text-gold">₹{totalPrice.toLocaleString('en-IN')}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 bg-gold/5 border border-gold/15 rounded-xl px-4 py-3 mb-4">
            <Info className="w-4 h-4 text-gold/50 flex-shrink-0" />
            <p className="text-xs text-white/40 font-inter">Tap to select services, then proceed to booking.</p>
          </div>
          {activeServices.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-white/15">
              <Scissors className="w-12 h-12 mb-3" /><p className="text-sm">No services listed</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeServices.map((svc: any) => (
                <ServiceItem key={svc.id} service={svc} selected={!!selectedServices.find((s) => s.id === svc.id)} onToggle={() => toggleService(svc)} />
              ))}
            </div>
          )}
          {selectedServices.length > 0 && (
            <div className="mt-5 bg-[#141414] border border-gold/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-white text-sm">{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected</p>
                <p className="text-white/30 text-xs mt-0.5 font-inter">~{totalDuration} min · ₹{totalPrice.toLocaleString('en-IN')}</p>
              </div>
              <button onClick={proceedToBook}
                className="flex items-center gap-2 px-5 py-3 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm rounded-xl transition-all shadow-gold flex-shrink-0 active:scale-95">
                <Calendar className="w-4 h-4" /> Continue Booking <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* About */}
        {(shop.about_description || shop.speciality || shop.years_of_experience > 0) && (
          <section>
            <div className="gold-divider w-8 mb-3" />
            <h2 className="font-playfair font-bold text-white text-xl mb-4">About</h2>
            {shop.about_description && <p className="text-white/50 text-sm leading-relaxed mb-4 font-inter">{shop.about_description}</p>}
            <div className="flex flex-wrap gap-3">
              {shop.speciality && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gold/8 border border-gold/20 rounded-xl">
                  <Award className="w-4 h-4 text-gold" />
                  <span className="text-sm font-semibold text-gold font-inter">{shop.speciality}</span>
                </div>
              )}
              {shop.years_of_experience > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gold/8 border border-gold/20 rounded-xl">
                  <Star className="w-4 h-4 text-gold" />
                  <span className="text-sm font-semibold text-gold font-inter">{shop.years_of_experience}+ Years</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Our Specialists & Team */}
        {staffList.length > 0 && (
          <section>
            <div className="gold-divider w-8 mb-3" />
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="font-playfair font-bold text-white text-xl">Our Specialists</h2>
                <p className="text-white/30 text-xs mt-0.5 font-inter">Skilled artists & therapists at {shop.name}</p>
              </div>
              <span className="text-gold text-xs font-semibold px-2.5 py-1 bg-gold/10 border border-gold/20 rounded-full font-inter">
                {staffList.length} Team Member{staffList.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {staffList.map((staff) => (
                <div
                  key={staff.id}
                  className="bg-[#1E1E1E] border border-white/8 rounded-2xl p-5 hover:border-gold/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3.5 mb-3">
                      {staff.profile_photo_url ? (
                        <img
                          src={staff.profile_photo_url}
                          alt={staff.full_name}
                          className="w-14 h-14 rounded-2xl object-cover border border-gold/20 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold text-lg flex-shrink-0">
                          {staff.full_name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-playfair font-bold text-white text-base truncate">{staff.full_name}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider flex-shrink-0 ${
                            staff.status === 'Available' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                            staff.status === 'Busy' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                            staff.status === 'On Leave' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                            'bg-white/10 text-white/50 border border-white/10'
                          }`}>
                            {staff.status}
                          </span>
                        </div>
                        <p className="text-gold text-xs font-inter font-medium mt-0.5">{staff.primary_role}</p>

                        {/* Direct Mobile Contact — strictly hidden if hide_mobile_from_public is true */}
                        {!staff.hide_mobile_from_public && staff.mobile_number && (
                          <a
                            href={`tel:${staff.mobile_number}`}
                            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-gold transition-colors mt-1.5 font-inter"
                          >
                            <Phone className="w-3 h-3 text-gold/60" />
                            {staff.mobile_number}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Specializations & Skills */}
                    {staff.specializations && staff.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {staff.specializations.map((skill) => (
                          <span
                            key={skill}
                            className="text-[11px] px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/8 text-white/60 font-inter"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/shop/${shop.id}/book?staffId=${staff.id}`)}
                    className="mt-4 w-full py-2.5 px-3 bg-gold/10 hover:bg-gold hover:text-[#0A0A0A] text-gold font-bold text-xs rounded-xl border border-gold/25 transition-all flex items-center justify-center gap-1.5 active:scale-95 font-inter"
                  >
                    <Scissors className="w-3.5 h-3.5" /> Book with {staff.full_name.split(' ')[0]}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Home Service */}
        {shop.home_service_available && (
          <section>
            <div className="bg-[#141414] border border-gold/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gold/10 border border-gold/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-playfair font-bold text-white text-base mb-1">Home Service Available</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-4 font-inter">
                    Professional grooming at your doorstep within {shop.service_radius_km||5} km.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[['Charge', `₹${shop.home_service_charge}`, 'added to bill'], ['Radius', `${shop.service_radius_km||5} km`, 'from salon']].map(([label, val, sub]) => (
                      <div key={label} className="bg-[#0A0A0A] border border-gold/15 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gold/50 font-medium mb-0.5 uppercase tracking-wide font-inter">{label}</p>
                        <p className="font-bold text-gold text-lg">{val}</p>
                        <p className="text-[10px] text-white/30 font-inter">{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section>
            <div className="gold-divider w-8 mb-3" />
            <div className="flex items-start justify-between mb-5 gap-4">
              <div>
                <h2 className="font-playfair font-bold text-white text-xl mb-0.5">Reviews</h2>
                <p className="text-white/30 text-sm font-inter">{reviews.length} verified</p>
              </div>
              <div className="flex items-center gap-3 bg-gold/8 border border-gold/20 rounded-2xl px-4 py-3 flex-shrink-0">
                <div className="text-center">
                  <p className="text-3xl font-black text-gold leading-none">{Number(shop.average_rating||0).toFixed(1)}</p>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[1,2,3,4,5].map((i) => <Star key={i} className={`w-3 h-3 ${i <= Math.round(shop.average_rating||0) ? 'fill-gold text-gold' : 'text-white/15'}`} />)}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {visibleReviews.map((r: any) => <ReviewCard key={r.id} review={r} />)}
            </div>
            {reviews.length > 4 && (
              <button onClick={() => setShowAllReviews((v) => !v)}
                className="mt-4 w-full py-3 border border-white/10 hover:border-gold/30 rounded-xl text-sm font-semibold text-white/40 hover:text-gold transition-all flex items-center justify-center gap-2 font-inter">
                {showAllReviews ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> All {reviews.length} reviews</>}
              </button>
            )}
          </section>
        )}

        {/* Contact */}
        <section>
          <div className="gold-divider w-8 mb-3" />
          <h2 className="font-playfair font-bold text-white text-xl mb-5">Contact & Location</h2>
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-4 p-4 bg-[#1E1E1E] border border-white/8 rounded-2xl">
              <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center flex-shrink-0"><MapPin className="w-4 h-4 text-gold" /></div>
              <div><p className="text-[10px] text-white/25 font-medium mb-0.5 uppercase tracking-wide font-inter">Address</p>
                <p className="text-sm font-semibold text-white">{shop.address}</p><p className="text-sm text-white/40 font-inter">{shop.city}</p></div>
            </div>
            {shop.contact_number && (
              <div className="flex items-start gap-4 p-4 bg-[#1E1E1E] border border-white/8 rounded-2xl">
                <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center flex-shrink-0"><Phone className="w-4 h-4 text-gold" /></div>
                <div><p className="text-[10px] text-white/25 font-medium mb-0.5 uppercase tracking-wide font-inter">Phone</p>
                  <p className="text-sm font-semibold text-white">{shop.contact_number}</p></div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {shop.contact_number && (
              <a href={`tel:${shop.contact_number}`}
                className="flex items-center justify-center gap-2 py-3.5 bg-[#1E1E1E] border border-white/10 hover:border-gold/30 text-white/70 hover:text-gold font-semibold rounded-xl transition-all text-sm font-inter">
                <Phone className="w-4 h-4" /> Call
              </a>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3.5 bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] font-semibold rounded-xl hover:bg-[#25D366]/15 transition-all text-sm font-inter">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp
              </a>
            )}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-3.5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold rounded-xl transition-all text-sm shadow-gold font-inter ${!shop.contact_number && !whatsappUrl ? 'col-span-2' : ''}`}>
              <MapPin className="w-4 h-4" /> Open Maps <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/8 h-56 relative">
            <iframe title={`${shop.name} location`} src={mapsEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="w-full h-full" />
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-gold/20">
          <div className="absolute inset-0 bg-gradient-to-br from-[#141414] to-[#0E0E0E]" />
          <div className="absolute right-0 top-0 w-48 h-48 bg-gold/5 rounded-full blur-[60px] pointer-events-none" />
          <div className="relative z-10 p-8 text-center">
            <div className="w-14 h-14 bg-gold/10 border border-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Scissors className="w-7 h-7 text-gold" />
            </div>
            <h2 className="font-playfair font-bold text-white text-2xl mb-2">Ready to Book?</h2>
            <p className="text-white/35 text-sm mb-6 max-w-xs mx-auto leading-relaxed font-inter">
              Reserve your slot at {shop.name}. No sign-up required.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={proceedToBook}
                className="flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm rounded-xl shadow-gold transition-all active:scale-95">
                <Calendar className="w-4 h-4" /> Book Appointment
              </button>
              {shop.contact_number && (
                <a href={`tel:${shop.contact_number}`}
                  className="flex items-center justify-center gap-2.5 px-7 py-3.5 bg-transparent text-white font-semibold text-sm border border-white/15 hover:border-gold/30 hover:text-gold rounded-xl transition-all active:scale-95 font-inter">
                  <Phone className="w-4 h-4" /> Call Us
                </a>
              )}
            </div>
          </div>
        </section>

        <footer className="text-center py-4">
          <p className="font-playfair font-semibold text-white/40 text-sm">{shop.name}</p>
          <p className="text-white/20 text-xs mt-1 font-inter">{shop.address}, {shop.city}</p>
          <p className="mt-2 text-white/15 text-xs font-inter">
            Powered by <button onClick={() => navigate('/')} className="text-gold/60 hover:text-gold transition-colors">Nexora Salonos</button>
          </p>
        </footer>
      </div>
    </div>
  );
}
