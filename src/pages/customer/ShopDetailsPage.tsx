import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Clock, Home, IndianRupee, ArrowLeft, ChevronRight,
  Loader2, Store, Phone, Video, X, ChevronLeft, Check, Scissors,
  Info, Grid3X3, MessageSquare, PlayCircle, Award, Users, Calendar,
  ZoomIn
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../hooks/use-toast';
import { getShopById, getShopStaff } from '../../lib/api';
import type { StaffMember } from '../../types';
import SalonLightbox from '../../components/ui/Lightbox';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'services' | 'team' | 'reviews' | 'gallery';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'gallery', label: 'Gallery', icon: Grid3X3 },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}



// ─── Service Checkbox Card ────────────────────────────────────────────────────

function ServiceCheckCard({
  service,
  selected,
  onToggle,
  compact = false,
}: {
  service: any;
  selected: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between text-left transition-all duration-150 rounded-xl border-2 ${
        compact ? 'p-3' : 'p-4'
      } ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-white hover:border-primary/40 hover:bg-secondary/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          compact ? 'w-4 h-4' : 'w-5 h-5'
        } ${selected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
          {selected && <Check className={compact ? 'w-2.5 h-2.5 text-white' : 'w-3 h-3 text-white'} />}
        </div>
        <div>
          <p className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>{service.name}</p>
          <p className={`text-muted-foreground ${compact ? 'text-[10px]' : 'text-xs'}`}>{service.duration_minutes} mins</p>
        </div>
      </div>
      <div className={`flex items-center gap-0.5 font-bold transition-colors ${
        compact ? 'text-sm' : 'text-base'
      } ${selected ? 'text-primary' : 'text-muted-foreground'}`}>
        <IndianRupee className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        {service.price}
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShopDetailsPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Staff Lightbox
  const [staffLightboxOpen, setStaffLightboxOpen] = useState(false);
  const [staffLightboxIndex, setStaffLightboxIndex] = useState(0);

  const staffPhotos = useMemo(() => {
    return staffList.map(s => s.profile_photo_url).filter(Boolean) as string[];
  }, [staffList]);

  // Sidebar service selection
  const [selectedServices, setSelectedServices] = useState<any[]>([]);

  useEffect(() => {
    if (shopId) loadShopDetails();
    else navigate('/');
  }, [shopId]);

  async function loadShopDetails() {
    try {
      setLoading(true);
      const [shopData, staffData] = await Promise.all([
        getShopById(shopId!),
        getShopStaff(shopId!, true),
      ]);
      if (!shopData) throw new Error('Shop not found');
      setShop(shopData);
      setStaffList(staffData || []);
    } catch (error: any) {
      toast({ title: 'Shop Not Found', description: error.message, variant: 'destructive' });
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  }

  // ─── Lightbox helpers ───────────────────────────────────────────────────────

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const prevPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  }, []);

  const nextPhoto = useCallback(() => {
    setLightboxIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  }, []);

  // ─── Service toggle ─────────────────────────────────────────────────────────

  function toggleService(service: any) {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  }

  // ─── Proceed to booking ─────────────────────────────────────────────────────

  function proceedToBook() {
    navigate(`/shop/${shop.id}/book`, {
      state: { preSelectedServices: selectedServices },
    });
  }

  // ─── Loading / Error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading shop details…</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-xl font-semibold mb-2">Shop Not Found</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  // ─── Derived data ───────────────────────────────────────────────────────────

  const photos = shop.shop_media
    ?.filter((m: any) => m.media_type === 'photo')
    ?.sort((a: any, b: any) => a.display_order - b.display_order)
    ?.map((m: any) => m.media_url) || [];

  const videoMedia = shop.shop_media?.find((m: any) => m.media_type === 'video');
  const activeServices = shop.services?.filter((s: any) => s.is_active !== false) || [];
  const reviews = shop.reviews || [];

  const servicesTotal = selectedServices.reduce((s: number, svc: any) => s + svc.price, 0);
  const totalDuration = selectedServices.reduce((s: number, svc: any) => s + svc.duration_minutes, 0);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-24 bg-background">

      {/* Lightbox for Salon Photos */}
      <SalonLightbox
        images={photos}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
        title={shop?.name}
      />

      {/* Lightbox for Staff Photos */}
      <SalonLightbox
        images={staffPhotos}
        currentIndex={staffLightboxIndex}
        isOpen={staffLightboxOpen}
        onClose={() => setStaffLightboxOpen(false)}
        onIndexChange={setStaffLightboxIndex}
        title="Specialist Team"
      />

      {/* ── Back header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border sticky top-[57px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="text-sm font-medium truncate text-muted-foreground">{shop.name}</div>
        </div>
      </div>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative h-72 md:h-96 overflow-hidden bg-muted">
        {photos.length > 0 ? (
          <>
            <img
              src={photos[0]}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Scissors className="w-20 h-20 text-primary/20" />
          </div>
        )}

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {shop.home_service_available && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white border-0">
                      <Home className="w-3 h-3 mr-1" /> Home Service
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-1 drop-shadow-sm">{shop.name}</h1>
                {shop.tagline && (
                  <p className="text-white/80 text-sm italic mb-2">"{shop.tagline}"</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {shop.address}, {shop.city}
                  </div>
                  {shop.contact_number && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {shop.contact_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Hero stat pills */}
              <div className="flex gap-3 flex-wrap">
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-center">
                  <div className="flex items-center gap-1 justify-center mb-0.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-lg">{Number(shop.average_rating || 0).toFixed(1)}</span>
                  </div>
                  <p className="text-[10px] text-white/70">{shop.total_reviews || 0} reviews</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-center">
                  <p className="font-bold text-lg">{shop.total_bookings || 0}</p>
                  <p className="text-[10px] text-white/70">bookings</p>
                </div>
                {shop.years_of_experience > 0 && (
                  <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-center">
                    <p className="font-bold text-lg">{shop.years_of_experience}+</p>
                    <p className="text-[10px] text-white/70">yrs exp.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Photo count */}
        {photos.length > 1 && (
          <button
            onClick={() => openLightbox(0)}
            className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/60 transition-colors"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            View all {photos.length} photos
          </button>
        )}
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2">

            {/* Tab navigation */}
            <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-6 overflow-x-auto">
              {TABS.map(({ id, label, icon: Icon }) => {
                // Hide gallery tab if no media
                if (id === 'gallery' && photos.length === 0 && !videoMedia) return null;
                // Hide reviews tab if no reviews
                if (id === 'reviews' && reviews.length === 0) return null;
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                      active
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {id === 'reviews' && reviews.length > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {reviews.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Tab: Overview ─────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-5">

                {/* About */}
                {(shop.about_description || shop.years_of_experience > 0 || shop.speciality) && (
                  <Card className="p-6">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      About This Shop
                    </h2>
                    {shop.about_description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mb-5">
                        {shop.about_description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {shop.years_of_experience > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/15 rounded-xl">
                          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-base text-primary">{shop.years_of_experience}+ Years</p>
                            <p className="text-xs text-muted-foreground">Experience</p>
                          </div>
                        </div>
                      )}
                      {shop.speciality && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-xl">
                          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-bold text-base text-amber-700">{shop.speciality}</p>
                            <p className="text-xs text-muted-foreground">Speciality</p>
                          </div>
                        </div>
                      )}
                      {shop.total_bookings > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200/60 rounded-xl">
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-base text-blue-700">{shop.total_bookings}</p>
                            <p className="text-xs text-muted-foreground">Happy Clients</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Working Hours & Details */}
                <Card className="p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Working Hours & Details
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Open Hours</span>
                      </div>
                      <span className="text-sm font-semibold">
                        {shop.opening_time?.slice(0, 5)} – {shop.closing_time?.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Weekly Off</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{shop.weekly_off}</Badge>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Home Service</span>
                      </div>
                      {shop.home_service_available ? (
                        <span className="text-sm font-semibold text-emerald-600">
                          ₹{shop.home_service_charge} extra · {shop.service_radius_km} km radius
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not available</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Address</span>
                      </div>
                      <span className="text-sm text-right text-muted-foreground max-w-[55%]">
                        {shop.address}, {shop.city}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Services preview (first 3) */}
                {activeServices.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Scissors className="w-5 h-5 text-primary" />
                        Services
                      </h2>
                      <button
                        onClick={() => setActiveTab('services')}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        See all {activeServices.length}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {activeServices.slice(0, 3).map((service: any) => (
                        <ServiceCheckCard
                          key={service.id}
                          service={service}
                          selected={!!selectedServices.find((s) => s.id === service.id)}
                          onToggle={() => toggleService(service)}
                        />
                      ))}
                    </div>
                    {activeServices.length > 3 && (
                      <button
                        onClick={() => setActiveTab('services')}
                        className="w-full mt-3 py-2.5 text-sm text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
                      >
                        + {activeServices.length - 3} more services
                      </button>
                    )}
                  </Card>
                )}

                {/* Team snapshot */}
                {staffList.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Our Specialists
                      </h2>
                      <button
                        onClick={() => setActiveTab('team')}
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        Meet all {staffList.length}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {staffList.slice(0, 3).map((staff) => (
                        <div key={staff.id} className="p-3.5 border border-border rounded-xl bg-card/60 flex items-center gap-3">
                          {staff.profile_photo_url ? (
                            <img src={staff.profile_photo_url} alt={staff.full_name} className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {staff.full_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs truncate">{staff.full_name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{staff.primary_role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Rating snapshot */}
                {reviews.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" />
                        Reviews
                      </h2>
                      <button
                        onClick={() => setActiveTab('reviews')}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        See all {reviews.length}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-6 mb-5">
                      <div className="text-center">
                        <p className="text-5xl font-bold text-amber-500">
                          {Number(shop.average_rating || 0).toFixed(1)}
                        </p>
                        <StarRating rating={shop.average_rating || 0} size="md" />
                        <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {reviews.slice(0, 2).map((review: any) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ── Tab: Services ─────────────────────────────────────────────── */}
            {activeTab === 'services' && (
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" />
                  All Services
                </h2>
                <p className="text-xs text-muted-foreground mb-5">
                  Select services to add them to your booking
                </p>
                {activeServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Scissors className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No services listed yet</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeServices.map((service: any) => (
                      <ServiceCheckCard
                        key={service.id}
                        service={service}
                        selected={!!selectedServices.find((s) => s.id === service.id)}
                        onToggle={() => toggleService(service)}
                      />
                    ))}
                  </div>
                )}

                {selectedServices.length > 0 && (
                  <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-sm">
                        {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                      </span>
                      <span className="font-bold text-primary">₹{servicesTotal}</span>
                    </div>
                    <Button className="w-full" onClick={proceedToBook}>
                      <Scissors className="w-4 h-4 mr-2" />
                      Book These Services
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* ── Tab: Team ─────────────────────────────────────────────────── */}
            {activeTab === 'team' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Specialists & Staff
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {staffList.length} Specialist{staffList.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  Experienced beauty, hair, and wellness professionals dedicated to your care.
                </p>

                {staffList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No specialists listed yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staffList.map((staff) => (
                      <div
                        key={staff.id}
                        className="p-5 border border-border rounded-xl bg-card hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start gap-3.5 mb-3">
                            {staff.profile_photo_url ? (
                              <img
                                src={staff.profile_photo_url}
                                alt={staff.full_name}
                                className="w-14 h-14 rounded-xl object-cover border border-border flex-shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                                {staff.full_name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <h3 className="font-semibold text-base truncate">{staff.full_name}</h3>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] ${
                                    staff.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    staff.status === 'Busy' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    staff.status === 'On Leave' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {staff.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium mt-0.5">{staff.primary_role}</p>

                              {/* Only show phone if NOT hidden from public */}
                              {!staff.hide_mobile_from_public && staff.mobile_number && (
                                <a
                                  href={`tel:${staff.mobile_number}`}
                                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-1.5"
                                >
                                  <Phone className="w-3 h-3 text-primary" />
                                  {staff.mobile_number}
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Skills & Specializations */}
                          {staff.specializations && staff.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {staff.specializations.map((skill) => (
                                <span
                                  key={skill}
                                  className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 w-full hover:bg-primary hover:text-white"
                          onClick={() => navigate(`/shop/${shop.id}/book?staffId=${staff.id}`)}
                        >
                          <Scissors className="w-3.5 h-3.5 mr-1.5" />
                          Book Appointment with {staff.full_name.split(' ')[0]}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ── Tab: Reviews ──────────────────────────────────────────────── */}
            {activeTab === 'reviews' && (
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-amber-500">
                      {Number(shop.average_rating || 0).toFixed(1)}
                    </p>
                    <StarRating rating={shop.average_rating || 0} size="md" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {reviews.length} reviews
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-16" />
                  <div className="flex-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Customer Feedback</p>
                    <p>Real reviews from verified bookings</p>
                  </div>
                </div>

                <Separator className="mb-5" />

                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No reviews yet</p>
                    <p className="text-xs mt-1">Be the first to book and review</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {reviews.map((review: any) => (
                      <ReviewCard key={review.id} review={review} full />
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* ── Tab: Gallery ──────────────────────────────────────────────── */}
            {activeTab === 'gallery' && (
              <div className="space-y-5">
                {/* Photos Grid */}
                {photos.length > 0 && (
                  <Card className="p-6">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Grid3X3 className="w-5 h-5 text-primary" />
                      Photos
                      <span className="text-sm font-normal text-muted-foreground">({photos.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {photos.map((src: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => openLightbox(i)}
                          className="relative aspect-square rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                          <img
                            src={src}
                            alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Video */}
                {videoMedia && (
                  <Card className="p-6">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-primary" />
                      Shop Video Tour
                    </h2>
                    <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                      <video
                        src={videoMedia.media_url}
                        controls
                        className="w-full h-full"
                      >
                        Your browser does not support video playback.
                      </video>
                    </div>
                  </Card>
                )}

                {photos.length === 0 && !videoMedia && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No media available yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Sticky Sidebar ────────────────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-28 space-y-4">

              {/* Service selector */}
              <Card className="p-5">
                <h3 className="font-semibold mb-1">Select Services</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Pick services to see your total before booking
                </p>

                {activeServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No services listed
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {activeServices.map((service: any) => (
                      <ServiceCheckCard
                        key={service.id}
                        service={service}
                        selected={!!selectedServices.find((s) => s.id === service.id)}
                        onToggle={() => toggleService(service)}
                        compact
                      />
                    ))}
                  </div>
                )}

                {/* Live price summary */}
                {selectedServices.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-1.5 mb-3">
                      {selectedServices.map((svc) => (
                        <div key={svc.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate flex-1 pr-2">{svc.name}</span>
                          <span className="font-semibold">₹{svc.price}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-4 px-3 py-2 bg-primary/5 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Total · ~{totalDuration} mins</p>
                        <p className="font-bold text-primary text-lg">₹{servicesTotal}</p>
                      </div>
                      <button
                        onClick={() => setSelectedServices([])}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </>
                )}

                <Button
                  size="lg"
                  className="w-full mt-2"
                  onClick={proceedToBook}
                >
                  {selectedServices.length > 0 ? (
                    <>
                      <Scissors className="w-4 h-4 mr-2" />
                      Book {selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''} · ₹{servicesTotal}
                    </>
                  ) : (
                    <>
                      Book Appointment
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </Card>

              {/* Shop quick info */}
              <Card className="p-5 bg-secondary/30">
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {shop.opening_time?.slice(0, 5)} – {shop.closing_time?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>Off on <strong className="text-foreground">{shop.weekly_off}</strong></span>
                  </div>
                  {shop.home_service_available && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Home className="w-4 h-4 flex-shrink-0" />
                      <span>Home service · +₹{shop.home_service_charge}</span>
                    </div>
                  )}
                  {shop.contact_number && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{shop.contact_number}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Trust signals */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-lg font-bold text-amber-600">
                    {Number(shop.average_rating || 0).toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Rating</p>
                </div>
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                  <p className="text-lg font-bold text-primary">{shop.total_bookings || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Bookings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky CTA ────────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border p-4 shadow-lg">
        <div className="flex items-center gap-3">
          {selectedServices.length > 0 && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
              </p>
              <p className="font-bold text-primary">₹{servicesTotal}</p>
            </div>
          )}
          <Button size="lg" className="flex-1" onClick={proceedToBook}>
            <Scissors className="w-4 h-4 mr-2" />
            {selectedServices.length > 0
              ? `Book · ₹${servicesTotal}`
              : 'Book Appointment'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review, full = false }: { review: any; full?: boolean }) {
  return (
    <div className={`${full ? 'border-b border-border last:border-0 pb-5 last:pb-0' : 'p-4 bg-secondary/40 rounded-xl'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {review.customer_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <p className="font-semibold text-sm">{review.customer_name}</p>
          </div>
          <div className="flex items-center gap-1 ml-9">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{review.rating}/5</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      {review.comment && (
        <p className={`text-sm text-muted-foreground leading-relaxed ml-9 ${!full ? 'line-clamp-2' : ''}`}>
          {review.comment}
        </p>
      )}
    </div>
  );
}
