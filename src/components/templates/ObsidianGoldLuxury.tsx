import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Award,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Diamond,
  Droplets,
  Facebook,
  Gem,
  Globe,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Palette,
  Phone,
  Play,
  Quote,
  Scissors,
  Sparkles,
  Star,
  Tag,
  Users,
  X,
  Youtube,
  ZoomIn,
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { MultiViewBookingCalendarModal } from '../ui/MultiViewBookingCalendarModal';
import { ReviewsSection } from '../ui/ReviewsSection';
import Lightbox from '../ui/Lightbox';
import {
  buildObsidianGoldData,
  formatPrice,
  formatReviewDate,
  type OGCategory,
  type OGPackage,
  type OGService,
  type OGSiteData,
} from './obsidianGoldData';
import './obsidian-gold.css';

// =====================================================
// TEMPLATE 01 — OBSIDIAN GOLD LUXURY
// A complete, data-driven public salon website.
// Consumes the shop record / staff list / media already
// loaded by ShopMiniWebsite's existing APIs.
// =====================================================

export const OBSIDIAN_GOLD_TEMPLATE_ID = 'obsidian-gold';

export interface ObsidianGoldLuxuryProps {
  shop: any;
  staffList?: any[];
  onReviewAdded?: () => void;
  /** Demo mode: booking opens the live calendar instead of the real booking route. */
  isPreview?: boolean;
  /** Adds a top offset for the preview toolbar. */
  previewOffset?: boolean;
  /** Keeps the floating CTA inside a simulated mobile viewport. */
  constrainedWidth?: boolean;
}

function Stars({ value, className = 'w-3.5 h-3.5' }: { value: number; className?: string }) {
  if (!(value > 0)) return null;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${className} ${i <= Math.round(value) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-white/20'}`}
        />
      ))}
    </div>
  );
}

function DiamondRule({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
      <span className="h-[5px] w-[5px] rotate-45 bg-[#D4AF37]" />
      <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  center?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className={`mb-10 sm:mb-14 ${center ? 'text-center' : ''}`}>
      <div className={`flex items-center gap-3 ${center ? 'justify-center' : ''}`}>
        <span className="h-px w-7 bg-[#D4AF37]/60" />
        <span className="og-eyebrow">{eyebrow}</span>
      </div>
      <div className={`mt-4 flex flex-col gap-4 ${center ? 'items-center' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
        <h2 className="text-[clamp(1.9rem,4vw,3.3rem)] leading-[1.12] text-white max-w-3xl break-words">
          {title}
        </h2>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {description && (
        <p className={`mt-4 max-w-2xl text-sm sm:text-[0.95rem] leading-relaxed text-[#A1A1AA] ${center ? 'mx-auto' : ''}`}>
          {description}
        </p>
      )}
      {center && <DiamondRule className="mt-6" />}
    </div>
  );
}

function categoryIcon(name: string) {
  const n = name.toLowerCase();
  if (/cut|hair|barber|fade|trim|styl/.test(n)) return Scissors;
  if (/color|colour|balayage|highlight|dye/.test(n)) return Palette;
  if (/spa|massage|therap|wellness|relax/.test(n)) return Sparkles;
  if (/facial|skin|beauty|glow/.test(n)) return Droplets;
  if (/nail|manicure|pedicure/.test(n)) return Gem;
  if (/beard|shave|groom/.test(n)) return Crown;
  if (/makeup|make-up|bridal|wedding/.test(n)) return Heart;
  return Diamond;
}

function socialIcon(kind: string) {
  switch (kind) {
    case 'instagram': return Instagram;
    case 'facebook': return Facebook;
    case 'youtube': return Youtube;
    case 'website': return Globe;
    default: return Globe;
  }
}

function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return `${text.slice(0, length).replace(/\s+\S*$/, '')}…`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

const NAV_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services' },
  { key: 'team', label: 'Our Team' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'contact', label: 'Contact' },
];

export function ObsidianGoldLuxury({
  shop,
  staffList = [],
  onReviewAdded,
  isPreview = false,
  previewOffset = false,
  constrainedWidth = false,
}: ObsidianGoldLuxuryProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const rawId = useId().replace(/:/g, '');
  const uid = `og-${rawId}`;
  const data: OGSiteData = useMemo(() => buildObsidianGoldData(shop, staffList), [shop, staffList]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedServices, setSelectedServices] = useState<OGService[]>([]);
  const [preferredStaffId, setPreferredStaffId] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [beforeAfterIndex, setBeforeAfterIndex] = useState(0);
  const [revealValue, setRevealValue] = useState(50);
  const [copiedCode, setCopiedCode] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  const sectionMargin = previewOffset ? 'scroll-mt-[8.5rem]' : 'scroll-mt-[5.5rem]';
  const sectionId = (key: string) => `${uid}-${key}`;

  const navAvailable = useMemo(
    () => ({
      home: true,
      about: Boolean(data.aboutText || data.aboutStory || data.specialties.length),
      services: data.services.length > 0,
      team: data.staff.length > 0,
      gallery: data.photos.length > 0,
      reviews: true,
      contact: Boolean(data.contact.phone || data.contact.address || data.contact.city || data.contact.socials.length),
    }),
    [data]
  );
  const navItems = NAV_ITEMS.filter((item) => navAvailable[item.key as keyof typeof navAvailable]);

  const filteredServices = useMemo(
    () => (activeCategory === 'All' ? data.services : data.services.filter((svc) => svc.category === activeCategory)),
    [data.services, activeCategory]
  );
  const totalPrice = selectedServices.reduce((sum, svc) => sum + svc.price, 0);
  const totalDuration = selectedServices.reduce((sum, svc) => sum + svc.duration, 0);

  const trustCards = useMemo(() => {
    const cards: { key: string; icon: any; value: string; label: string }[] = [];
    if (data.googleRating > 0) {
      cards.push({
        key: 'google',
        icon: Star,
        value: data.googleRating.toFixed(1),
        label: `Google rating${data.googleReviewCount > 0 ? ` · ${data.googleReviewCount} reviews` : ''}`,
      });
    }
    if (data.ratingValue > 0) {
      cards.push({
        key: 'rating',
        icon: Star,
        value: data.ratingValue.toFixed(1),
        label: `Client rating${data.ratingCount > 0 ? ` · ${data.ratingCount} reviews` : ''}`,
      });
    } else if (data.ratingCount > 0) {
      cards.push({ key: 'reviews', icon: MessageCircle, value: String(data.ratingCount), label: 'Client reviews' });
    }
    if (data.yearsExperience > 0) {
      cards.push({ key: 'years', icon: Award, value: `${data.yearsExperience}+`, label: 'Years of experience' });
    }
    if (data.staff.length > 0) {
      cards.push({ key: 'staff', icon: Users, value: String(data.staff.length), label: 'Professional staff' });
    }
    return cards;
  }, [data]);

  const hasTrustData = trustCards.length > 0 || data.highlights.length > 0;
  const hasHoursData = Boolean(data.hours.opening || data.hours.closing || data.hours.weeklyOff || data.hours.days.some((d) => d.label));
  const hasContactData = Boolean(
    data.contact.phone || data.contact.whatsappUrl || data.contact.email || data.contact.address || data.contact.city || data.contact.socials.length
  );

  const scrollTo = useCallback(
    (key: string) => {
      const element = document.getElementById(`${uid}-${key}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileOpen(false);
    },
    [uid]
  );

  useEffect(() => {
    const node = heroRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const toggleService = useCallback((service: OGService) => {
    setSelectedServices((prev) =>
      prev.some((item) => item.id === service.id)
        ? prev.filter((item) => item.id !== service.id)
        : [...prev, service]
    );
  }, []);

  const handleBook = useCallback(
    (services: OGService[] = [], options: { staffId?: string } = {}) => {
      if (isPreview) {
        if (services.length) setSelectedServices(services);
        if (options.staffId) setPreferredStaffId(options.staffId);
        setCalendarOpen(true);
        toast({
          title: 'Live booking preview',
          description: 'Pick a date and time to experience the booking calendar.',
        });
        return;
      }
      const params = new URLSearchParams();
      if (options.staffId) params.set('staffId', options.staffId);
      const query = params.toString();
      navigate(`/shop/${data.shopId}/book${query ? `?${query}` : ''}`, {
        state: { preSelectedServices: services.map((svc) => svc.raw ?? svc) },
      });
    },
    [isPreview, navigate, data.shopId, toast]
  );

  const handleCalendarConfirm = useCallback(
    (date: string, time: string) => {
      setCalendarOpen(false);
      toast({
        title: 'Preview reservation selected',
        description: `${formatReviewDate(date) || date} · ${time} — register your salon to accept real bookings.`,
      });
    },
    [toast]
  );

  const copyCode = useCallback(
    async (code: string) => {
      try {
        await navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast({ title: 'Coupon copied', description: code });
        window.setTimeout(() => setCopiedCode(''), 2500);
      } catch {
        toast({ title: code, description: 'Use this code when booking.' });
      }
    },
    [toast]
  );

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);

  const currentPair = data.beforeAfter[beforeAfterIndex] || data.beforeAfter[0];
  const nameWords = data.name.split(/\s+/).filter(Boolean);
  const nameAccent = nameWords.length > 1 ? nameWords.pop() : '';
  const nameLead = nameWords.join(' ');

  return (
    <div className="og-shell min-h-screen w-full bg-[#0A0A0A] text-white">
      {/* ══════════ 01 — ANNOUNCEMENT BAR ══════════ */}
      {data.announcement && (
        <div className="relative overflow-hidden border-b border-[#D4AF37]/25 bg-[#12100A]">
          <div className="og-shimmer-line opacity-40" />
          <div className="relative mx-auto flex max-w-[1320px] flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-center sm:px-8">
            <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-[#D4AF37]" />
            <span className="og-eyebrow !text-[9px]">{data.announcement.label}</span>
            <span className="text-[11px] leading-snug text-white/85 sm:text-xs">{data.announcement.text}</span>
            {data.announcement.coupon && (
              <button
                type="button"
                onClick={() => copyCode(data.announcement!.coupon)}
                className="inline-flex items-center gap-1.5 rounded-sm border border-dashed border-[#D4AF37]/60 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-[#F5D77A] transition-colors hover:bg-[#D4AF37]/10"
              >
                {copiedCode === data.announcement.coupon ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedCode === data.announcement.coupon ? 'COPIED' : data.announcement.coupon}
              </button>
            )}
            {data.announcement.expiresAt && (
              <span className="text-[10px] text-white/40">Until {formatReviewDate(data.announcement.expiresAt)}</span>
            )}
          </div>
        </div>
      )}

      {/* ══════════ 02 — HEADER & NAVIGATION ══════════ */}
      <header
        className={`sticky z-40 w-full border-b border-[#D4AF37]/20 bg-[#0A0A0A]/92 backdrop-blur-xl ${previewOffset ? 'top-14' : 'top-0'}`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
          <button type="button" onClick={() => scrollTo('home')} className="group flex min-w-0 items-center gap-3 text-left">
            {data.logoUrl ? (
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#D4AF37]/35 bg-[#141414] p-1">
                <img src={data.logoUrl} alt={`${data.name} logo`} className="h-full w-full object-contain" />
              </span>
            ) : (
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-sm border border-[#D4AF37]/45 bg-[#D4AF37]/8 font-playfair text-lg font-bold text-[#D4AF37]">
                {initials(data.name) || 'N'}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-playfair text-[13px] font-bold uppercase leading-none tracking-[0.16em] text-white sm:text-[15px]">
                {data.name}
              </span>
              <span className="mt-1.5 block truncate text-[8px] uppercase tracking-[0.34em] text-[#D4AF37]/75 sm:text-[9px]">
                {data.category || 'Luxury Salon'}
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={`#${sectionId(item.key)}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollTo(item.key);
                }}
                className="relative px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60 transition-colors hover:text-[#F5D77A]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleBook(selectedServices)}
              className="og-btn og-btn-primary !hidden !min-h-[42px] !px-5 sm:!inline-flex"
            >
              <CalendarDays className="h-4 w-4" /> Book Appointment
            </button>
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-sm border border-[#D4AF37]/30 text-[#F5D77A] transition-colors hover:bg-[#D4AF37]/10 lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-[#D4AF37]/25 bg-[#0F0F0F]/98 px-4 py-4 shadow-2xl backdrop-blur-xl lg:hidden">
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={`#${sectionId(item.key)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollTo(item.key);
                  }}
                  className="flex items-center justify-between border-b border-white/5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 transition-colors hover:text-[#F5D77A]"
                >
                  {item.label}
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#D4AF37]/60" />
                </a>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                handleBook(selectedServices);
              }}
              className="og-btn og-btn-primary mt-4 w-full"
            >
              <CalendarDays className="h-4 w-4" /> Book Appointment
            </button>
          </div>
        )}
      </header>

      {/* ══════════ 03 — CINEMATIC HERO ══════════ */}
      <section
        id={sectionId('home')}
        ref={heroRef}
        className={`relative flex min-h-[620px] items-center overflow-hidden border-b border-[#D4AF37]/15 lg:min-h-[780px] ${sectionMargin}`}
      >
        {data.heroPhoto ? (
          <img
            src={data.heroPhoto}
            alt={`${data.name} salon`}
            className="og-kenburns absolute inset-0 h-full w-full object-cover object-center opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_35%,rgba(212,175,55,0.16),transparent_60%),linear-gradient(135deg,#0A0A0A,#1C1C1C_60%,#0A0A0A)]" />
        )}
        <div className="og-hero-overlay absolute inset-0" />
        <div className="og-vignette absolute inset-0" />
        <div className="og-grain absolute inset-0" />
        <div className="absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-[#D4AF37]/35 to-transparent lg:block" />
        <div className="og-glow -right-20 top-10 hidden h-[460px] w-[460px] lg:block" />

        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="og-reveal max-w-3xl">
            <div className="mb-7 flex flex-wrap items-center gap-3">
              <span className="h-px w-10 bg-[#D4AF37]" />
              <span className="og-eyebrow">
                {[data.category, data.contact.city].filter(Boolean).join(' · ') || 'Salon & Grooming Studio'}
              </span>
            </div>

            <h1 className="break-words font-playfair text-[clamp(2.7rem,7vw,6rem)] font-semibold leading-[1.04] text-white">
              {nameLead && <span className="block">{nameLead}</span>}
              {nameAccent ? <span className="og-gold-text italic">{nameAccent}</span> : null}
            </h1>

            {data.tagline && (
              <p className="mt-6 max-w-2xl font-playfair text-lg italic leading-snug text-white/80 sm:text-2xl">
                “{data.tagline}”
              </p>
            )}
            {data.introduction && (
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#A1A1AA] sm:text-base">
                {truncate(data.introduction, 210)}
              </p>
            )}

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => handleBook(selectedServices)} className="og-btn og-btn-primary">
                <CalendarDays className="h-4 w-4" /> Book Appointment
              </button>
              {data.services.length > 0 && (
                <button type="button" onClick={() => scrollTo('services')} className="og-btn og-btn-ghost">
                  Explore Services <ArrowDown className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Trust indicators — only real, stored values */}
            <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-[#D4AF37]/20 pt-6">
              {data.googleRating > 0 && (
                <div className="flex items-center gap-2.5">
                  <span className="font-playfair text-2xl text-[#F5D77A]">{data.googleRating.toFixed(1)}</span>
                  <div>
                    <Stars value={data.googleRating} />
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                      Google rating{data.googleReviewCount > 0 ? ` · ${data.googleReviewCount} reviews` : ''}
                    </p>
                  </div>
                </div>
              )}
              {data.googleRating === 0 && data.ratingValue > 0 && (
                <div className="flex items-center gap-2.5">
                  <span className="font-playfair text-2xl text-[#F5D77A]">{data.ratingValue.toFixed(1)}</span>
                  <div>
                    <Stars value={data.ratingValue} />
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
                      Client rating{data.ratingCount > 0 ? ` · ${data.ratingCount} reviews` : ''}
                    </p>
                  </div>
                </div>
              )}
              {data.staff.length > 0 && (
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-[#D4AF37]" />
                  <div>
                    <p className="font-playfair text-xl text-white">{data.staff.length}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Professional staff</p>
                  </div>
                </div>
              )}
              {data.yearsExperience > 0 && (
                <div className="flex items-center gap-2.5">
                  <Award className="h-4 w-4 text-[#D4AF37]" />
                  <div>
                    <p className="font-playfair text-xl text-white">{data.yearsExperience}+</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Years of experience</p>
                  </div>
                </div>
              )}
              {data.hours.opening && data.hours.closing && (
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-[#D4AF37]" />
                  <div>
                    <p className="font-playfair text-base text-white">{data.hours.opening} – {data.hours.closing}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Opening hours</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex">
          <span className="text-[9px] uppercase tracking-[0.3em] text-white/35">Scroll</span>
          <span className="og-scroll-cue" />
        </div>
      </section>

      {/* ══════════ 04 — TRUST & HIGHLIGHTS ══════════ */}
      {hasTrustData && (
        <section className="border-b border-[#D4AF37]/15 bg-[#141414]" aria-label="Salon highlights">
          <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 lg:px-12">
            <div
              className={`grid grid-cols-2 gap-px overflow-hidden border border-[#D4AF37]/20 bg-[#D4AF37]/15 ${
                trustCards.length >= 4
                  ? 'md:grid-cols-4'
                  : trustCards.length === 3
                    ? 'md:grid-cols-3'
                    : trustCards.length === 2
                      ? 'md:grid-cols-2'
                      : 'md:grid-cols-1'
              }`}
            >
              {trustCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.key} className="bg-[#141414] p-5 sm:p-7">
                    <Icon className="mb-4 h-5 w-5 text-[#D4AF37]" />
                    <p className="og-gold-text font-playfair text-3xl">{card.value}</p>
                    <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-white/45">{card.label}</p>
                  </div>
                );
              })}
            </div>

            {data.highlights.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
                <span className="og-eyebrow mr-1">Highlights</span>
                {data.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="inline-flex items-center gap-2 rounded-sm border border-[#D4AF37]/25 bg-[#1C1C1C] px-3.5 py-2 text-[11px] text-white/70"
                  >
                    <Check className="h-3 w-3 text-[#D4AF37]" /> {highlight}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════ 05 — SERVICE CATEGORIES ══════════ */}
      {data.categories.length > 0 && (
        <section id={sectionId('categories')} className={`relative border-b border-white/5 py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading
              eyebrow="The Collection"
              title="Service Categories"
              description="Explore the disciplines available at this salon, organised exactly as listed by the business."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.categories.map((category: OGCategory, index) => {
                const Icon = categoryIcon(category.name);
                return (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category.name);
                      scrollTo('services');
                    }}
                    className="og-card og-card-hover og-image-zoom group relative flex h-56 flex-col justify-between overflow-hidden p-5 text-left"
                  >
                    {data.photos.length > 0 && (
                      <img
                        src={data.photos[index % data.photos.length]}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/75 to-[#141414]/20" />
                    <div className="relative flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-[#D4AF37]/35 bg-[#0A0A0A]/70 text-[#D4AF37]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-[#D4AF37]/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <div className="relative">
                      <h3 className="font-playfair text-xl text-white sm:text-[1.35rem]">{category.name}</h3>
                      <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/80">
                        {category.count} {category.count === 1 ? 'service' : 'services'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ 06 — PREMIUM SERVICES ══════════ */}
      {data.services.length > 0 && (
        <section id={sectionId('services')} className={`relative border-b border-white/5 py-20 sm:py-28 ${sectionMargin}`}>
          <div className="og-glow -left-32 top-0 h-80 w-80" />
          <div className="relative mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading
              eyebrow="The Craft"
              title="Premium Services"
              description="A curated menu of the treatments offered by this salon. Select your favourites and continue to booking."
              action={
                <button type="button" onClick={() => setCalendarOpen(true)} className="og-btn og-btn-quiet">
                  <CalendarDays className="h-4 w-4" /> Check Live Availability
                </button>
              }
            />

            {data.categories.length > 0 && (
              <div className="og-scroll mb-9 flex gap-2 overflow-x-auto pb-2">
                {['All', ...data.categories.map((category) => category.name)].map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`flex-shrink-0 rounded-sm border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all ${
                      activeCategory === category
                        ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0A]'
                        : 'border-[#D4AF37]/25 bg-[#141414] text-white/60 hover:border-[#D4AF37]/60 hover:text-[#F5D77A]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service: OGService) => {
                const selected = selectedServices.some((item) => item.id === service.id);
                return (
                  <article
                    key={service.id}
                    className={`og-card og-card-hover flex flex-col overflow-hidden ${selected ? '!border-[#D4AF37]/70 shadow-gold' : ''}`}
                  >
                    <div className="og-image-zoom relative h-52 overflow-hidden bg-[#1C1C1C]">
                      {service.image ? (
                        <img src={service.image} alt={service.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.14),transparent_65%),#141414]">
                          <Scissors className="h-10 w-10 text-[#D4AF37]/35" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                      {service.category && (
                        <span className="absolute left-4 top-4 rounded-sm border border-[#D4AF37]/35 bg-[#0A0A0A]/75 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-[#F5D77A] backdrop-blur-sm">
                          {service.category}
                        </span>
                      )}
                      {selected && (
                        <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-sm bg-[#D4AF37] text-[#0A0A0A]">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h3 className="font-playfair text-lg leading-snug text-white sm:text-xl">{service.name}</h3>
                      {service.description && (
                        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-[#A1A1AA] sm:text-[13px]">
                          {service.description}
                        </p>
                      )}
                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#D4AF37]/15 pt-4">
                        <div>
                          <p className="font-playfair text-xl text-[#F5D77A]">{formatPrice(service.price)}</p>
                          {service.duration > 0 && (
                            <p className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/40">
                              <Clock className="h-3 w-3" /> {service.duration} min
                            </p>
                          )}
                        </div>
                        <span className="h-8 w-px bg-[#D4AF37]/20" />
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => toggleService(service)}
                            className={`inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-sm border px-3 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                              selected
                                ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F5D77A]'
                                : 'border-white/15 text-white/70 hover:border-[#D4AF37]/60 hover:text-[#F5D77A]'
                            }`}
                          >
                            {selected ? <Check className="h-3 w-3" /> : null} {selected ? 'Selected' : 'Select Service'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBook([service])}
                            className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-sm bg-[#D4AF37]/10 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5D77A] transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0A]"
                          >
                            Book Now <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {selectedServices.length > 0 && (
              <div className="og-frame mt-8 flex flex-col gap-4 bg-[#141414] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <p className="og-eyebrow">Your selection</p>
                  <p className="mt-2 font-playfair text-lg text-white">
                    {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'}
                    {totalDuration > 0 ? ` · ${totalDuration} min` : ''}
                  </p>
                  <p className="mt-1 text-xs text-[#A1A1AA]">Total {formatPrice(totalPrice)}</p>
                </div>
                <button type="button" onClick={() => handleBook(selectedServices, { staffId: preferredStaffId || undefined })} className="og-btn og-btn-primary">
                  Continue Booking <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════ 07 — ABOUT OUR SALON ══════════ */}
      {(data.aboutText || data.aboutStory || data.specialties.length > 0) && (
        <section id={sectionId('about')} className={`border-b border-white/5 py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-12">
            <div className="relative">
              <div className="og-frame relative aspect-[4/5] overflow-hidden bg-[#141414] sm:aspect-[5/5]">
                {data.aboutPhoto ? (
                  <img src={data.aboutPhoto} alt={`${data.name} interior`} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.18),transparent_60%),linear-gradient(145deg,#141414,#0A0A0A)]">
                    <div className="text-center">
                      <Crown className="mx-auto h-12 w-12 text-[#D4AF37]/50" />
                      <p className="mt-5 font-playfair text-2xl text-white/60">{data.name}</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-5 -right-3 hidden h-24 w-24 border-b border-r border-[#D4AF37]/50 sm:block" />
            </div>

            <div className="og-reveal">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-7 bg-[#D4AF37]/60" />
                <span className="og-eyebrow">Our Story</span>
              </div>
              <h2 className="text-[clamp(2rem,4vw,3.3rem)] leading-tight text-white">
                About <span className="og-gold-text italic">{data.name}</span>
              </h2>
              {data.aboutText && <p className="mt-6 text-sm leading-[1.9] text-[#A1A1AA] sm:text-[15px]">{data.aboutText}</p>}
              {data.aboutStory && <p className="mt-4 text-sm leading-[1.9] text-white/55 sm:text-[15px]">{data.aboutStory}</p>}

              {data.specialties.length > 0 && (
                <div className="mt-8">
                  <p className="og-eyebrow mb-4">Specialties</p>
                  <div className="flex flex-wrap gap-2.5">
                    {data.specialties.slice(0, 8).map((specialty) => (
                      <span key={specialty} className="rounded-sm border border-[#D4AF37]/25 bg-[#1C1C1C] px-3.5 py-2 text-[11px] text-white/75">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-9 flex flex-wrap gap-8 border-t border-[#D4AF37]/20 pt-7">
                {data.yearsExperience > 0 && (
                  <div>
                    <p className="og-gold-text font-playfair text-3xl">{data.yearsExperience}+</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">Years of experience</p>
                  </div>
                )}
                {data.staff.length > 0 && (
                  <div>
                    <p className="og-gold-text font-playfair text-3xl">{data.staff.length}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">Specialists</p>
                  </div>
                )}
                {data.contact.city && (
                  <div>
                    <p className="font-playfair text-2xl text-white">{data.contact.city}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">Located in</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════ 08 — EXCLUSIVE OFFERS ══════════ */}
      {data.offers.length > 0 && (
        <section id={sectionId('offers')} className={`relative border-b border-white/5 py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading eyebrow="Privileges" title="Exclusive Offers" description="Current offers published by this salon." />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.offers.map((offer) => (
                <article key={offer.id} className="og-card og-card-hover relative overflow-hidden p-6 sm:p-7">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#D4AF37]/8 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <Tag className="h-5 w-5 text-[#D4AF37]" />
                      {offer.badge && (
                        <span className="rounded-sm border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#F5D77A]">
                          {offer.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-6 font-playfair text-xl text-white">{offer.title || 'Special Offer'}</h3>
                    {offer.description && <p className="mt-2.5 text-[13px] leading-relaxed text-[#A1A1AA]">{offer.description}</p>}
                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#D4AF37]/15 pt-5">
                      {offer.code && (
                        <button
                          type="button"
                          onClick={() => copyCode(offer.code)}
                          className="inline-flex items-center gap-2 rounded-sm border border-dashed border-[#D4AF37]/55 px-3 py-2 text-[11px] font-bold tracking-[0.14em] text-[#F5D77A] hover:bg-[#D4AF37]/10"
                        >
                          {copiedCode === offer.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedCode === offer.code ? 'COPIED' : offer.code}
                        </button>
                      )}
                      {offer.validUntil && (
                        <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
                          Until {formatReviewDate(offer.validUntil)}
                        </span>
                      )}
                      <button type="button" onClick={() => handleBook([])} className="ml-auto text-[#F5D77A] transition-colors hover:text-white" aria-label="Book this offer">
                        <ArrowUpRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ 09 — MEET OUR EXPERTS ══════════ */}
      {data.staff.length > 0 && (
        <section id={sectionId('team')} className={`border-b border-white/5 bg-[#101010] py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading eyebrow="The Artisans" title="Meet Our Experts" description="The professionals behind every appointment at this salon." />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.staff.map((member) => (
                <article key={member.id} className="og-card og-card-hover group overflow-hidden">
                  <div className="og-image-zoom relative aspect-[4/5] overflow-hidden bg-[#1C1C1C]">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="h-full w-full object-cover object-top" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.16),transparent_65%),#141414]">
                        <span className="font-playfair text-5xl text-[#D4AF37]/50">{initials(member.name)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                    <span className="absolute bottom-4 left-4 rounded-sm border border-[#D4AF37]/35 bg-[#0A0A0A]/70 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-[#F5D77A] backdrop-blur-sm">
                      {member.role || 'Specialist'}
                    </span>
                  </div>
                  <div className="p-5 sm:p-6">
                    <h3 className="font-playfair text-xl text-white">{member.name}</h3>
                    {member.experience && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[#D4AF37]/85">
                        <Award className="h-3 w-3" /> {member.experience} experience
                      </p>
                    )}
                    {member.specializations.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {member.specializations.slice(0, 4).map((skill) => (
                          <span key={skill} className="rounded-sm border border-white/10 bg-[#1C1C1C] px-2.5 py-1 text-[10px] text-white/60">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleBook(selectedServices, { staffId: member.id })}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm border border-[#D4AF37]/35 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5D77A] transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0A]"
                    >
                      Book with {member.name.split(' ')[0]} <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ 10 — LUXURY PORTFOLIO ══════════ */}
      {data.photos.length > 0 && (
        <section id={sectionId('gallery')} className={`border-b border-white/5 py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading
              eyebrow="The Portfolio"
              title="Luxury Portfolio"
              description="A look inside the salon and the work shared by the business."
              action={
                <button type="button" onClick={() => openLightbox(0)} className="og-btn og-btn-quiet">
                  <ZoomIn className="h-4 w-4" /> View All ({data.photos.length})
                </button>
              }
            />
            <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-3 lg:grid-cols-4">
              {data.photos.slice(0, 8).map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  onClick={() => openLightbox(index)}
                  className={`og-image-zoom group relative overflow-hidden rounded-sm border border-[#D4AF37]/20 bg-[#141414] ${
                    index === 0 ? 'row-span-2 col-span-2' : ''
                  }`}
                >
                  <img src={photo} alt={`${data.name} portfolio ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-[#0A0A0A]/0 transition-colors group-hover:bg-[#0A0A0A]/40" />
                  <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#D4AF37]/50 bg-[#0A0A0A]/75 text-[#F5D77A] opacity-0 transition-opacity group-hover:opacity-100">
                    <ZoomIn className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>

            {data.video && (
              <div className="og-frame mt-6 overflow-hidden bg-[#141414] p-4 sm:p-5">
                <p className="og-eyebrow mb-4 flex items-center gap-2"><Play className="h-3.5 w-3.5" /> Salon Film</p>
                <video src={data.video} controls playsInline className="aspect-video w-full rounded-sm bg-black" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════ 11 — BEFORE & AFTER ══════════ */}
      {data.beforeAfter.length > 0 && currentPair && (
        <section id={sectionId('transformations')} className={`border-b border-white/5 bg-[#101010] py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading eyebrow="Transformations" title="Before & After" description="Real transformations shared by the salon. Drag the handle to reveal the result." center />
            <div className="og-frame mx-auto max-w-4xl overflow-hidden bg-[#141414] p-2 sm:p-3">
              <div className="relative aspect-[4/3] w-full select-none overflow-hidden bg-black sm:aspect-[16/9]">
                <img src={currentPair.after} alt="After treatment" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - revealValue}% 0 0)` }}>
                  <img src={currentPair.before} alt="Before treatment" className="h-full w-full object-cover" draggable={false} />
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-between p-3 sm:p-4">
                  <span className="rounded-sm border border-white/20 bg-[#0A0A0A]/75 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">Before</span>
                  <span className="rounded-sm border border-[#D4AF37]/50 bg-[#0A0A0A]/75 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5D77A] backdrop-blur-sm">After</span>
                </div>
                <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-[2px] bg-[#D4AF37]" style={{ left: `${revealValue}%` }}>
                  <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#0A0A0A] bg-[#D4AF37] text-[#0A0A0A] shadow-gold">
                    <ChevronLeft className="-mr-1 h-3.5 w-3.5" /><ChevronRight className="-ml-1 h-3.5 w-3.5" />
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={revealValue}
                  onChange={(event) => setRevealValue(Number(event.target.value))}
                  aria-label="Reveal before and after"
                  className="og-range absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
                />
              </div>
              {(currentPair.title || currentPair.description) && (
                <div className="px-3 pb-2 pt-4 text-center sm:px-4">
                  {currentPair.title && <h3 className="font-playfair text-lg text-white">{currentPair.title}</h3>}
                  {currentPair.description && <p className="mt-1.5 text-xs text-[#A1A1AA]">{currentPair.description}</p>}
                </div>
              )}
            </div>

            {data.beforeAfter.length > 1 && (
              <div className="og-scroll mt-6 flex justify-start gap-3 overflow-x-auto pb-2 sm:justify-center">
                {data.beforeAfter.map((pair, index) => (
                  <button
                    key={pair.id}
                    type="button"
                    onClick={() => { setBeforeAfterIndex(index); setRevealValue(50); }}
                    className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-sm border transition-all ${
                      index === beforeAfterIndex ? 'border-[#D4AF37] shadow-gold' : 'border-[#D4AF37]/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={pair.after} alt={pair.title || `Transformation ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════ 12 — CUSTOMER TESTIMONIALS ══════════ */}
      {data.testimonials.length > 0 && (
        <section className="border-b border-white/5 py-20 sm:py-28">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading eyebrow="In Their Words" title="Customer Testimonials" description="Feedback shared by clients of this salon." center />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.testimonials.slice(0, 3).map((testimonial) => (
                <figure key={testimonial.id} className="og-card og-card-hover flex h-full flex-col p-6 sm:p-7">
                  <Quote className="h-7 w-7 text-[#D4AF37]/45" />
                  <Stars value={testimonial.rating} className="mt-5 h-3.5 w-3.5" />
                  <blockquote className="mt-4 flex-1 font-playfair text-[15px] italic leading-relaxed text-white/85 sm:text-base">
                    “{testimonial.comment}”
                  </blockquote>
                  <figcaption className="mt-6 border-t border-[#D4AF37]/15 pt-5">
                    <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/40">
                      {[testimonial.service, formatReviewDate(testimonial.date)].filter(Boolean).join(' · ') || 'Verified client'}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ 13 — CUSTOMER REVIEWS ══════════ */}
      <section id={sectionId('reviews')} className={`border-b border-white/5 py-20 sm:py-28 ${sectionMargin}`}>
        <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="Client Feedback"
            title="Customer Reviews"
            description={data.reviews.length > 0 ? 'Ratings and comments from real clients, with the option to add your own.' : 'Share your experience with this salon.'}
          />
          <div className="og-frame bg-[#141414] p-5 sm:p-8">
            <ReviewsSection
              shopId={data.shopId}
              reviews={data.reviews.map((review) => review.raw)}
              onReviewAdded={onReviewAdded || (() => {})}
              displayReviews
              hideForm={isPreview}
            />
            {isPreview && (
              <p className="mt-5 text-center text-[11px] uppercase tracking-[0.18em] text-[#D4AF37]/70">
                Preview mode · review submission is available on published websites
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ══════════ 14 — MEMBERSHIP & PACKAGES ══════════ */}
      {data.packages.length > 0 && (
        <section id={sectionId('membership')} className={`border-b border-white/5 bg-[#101010] py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading eyebrow="The Inner Circle" title="Membership & Packages" description="Memberships and packages offered by this salon." center />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.packages.map((pkg: OGPackage, index) => (
                <article
                  key={pkg.id}
                  className={`og-card og-card-hover relative flex flex-col p-6 sm:p-8 ${index === 0 ? '!border-[#D4AF37]/55' : ''}`}
                >
                  <Crown className="h-6 w-6 text-[#D4AF37]" />
                  <h3 className="mt-5 font-playfair text-xl text-white sm:text-2xl">{pkg.name || `Package ${index + 1}`}</h3>
                  {pkg.description && <p className="mt-2.5 text-[13px] leading-relaxed text-[#A1A1AA]">{pkg.description}</p>}
                  {pkg.price > 0 && (
                    <p className="mt-6 font-playfair text-3xl text-[#F5D77A]">
                      {formatPrice(pkg.price)}
                      {pkg.period && <span className="ml-1.5 font-inter text-xs tracking-normal text-white/45">/ {pkg.period}</span>}
                    </p>
                  )}
                  {pkg.benefits.length > 0 && (
                    <ul className="mt-6 space-y-2.5">
                      {pkg.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2.5 text-xs text-white/65">
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#D4AF37]" /> {benefit}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" onClick={() => handleBook([])} className="og-btn og-btn-ghost mt-8 w-full">
                    Enquire & Book <ArrowUpRight className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ 15 — APPOINTMENT BOOKING ══════════ */}
      <section id={sectionId('booking')} className={`relative overflow-hidden border-b border-[#D4AF37]/20 py-20 sm:py-28 ${sectionMargin}`}>
        {data.bookingPhoto && (
          <img src={data.bookingPhoto} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.13]" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(212,175,55,0.12),transparent_60%),linear-gradient(120deg,#0A0A0A,#141414_55%,#0A0A0A)]" />
        <div className="og-grain absolute inset-0" />
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-4 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-7 bg-[#D4AF37]/60" />
              <span className="og-eyebrow">Reservations</span>
            </div>
            <h2 className="text-[clamp(2.1rem,4.5vw,3.6rem)] leading-tight text-white">
              Reserve Your <span className="og-gold-text italic">Moment</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-[#A1A1AA] sm:text-[15px]">
              Choose your services, select a specialist and pick an available date and time. Your booking continues through the salon&apos;s secure booking flow.
            </p>
            <div className="mt-9 space-y-3.5">
              {[
                { n: '01', label: 'Select your services', icon: Scissors },
                { n: '02', label: 'Choose a specialist', icon: Users },
                { n: '03', label: 'Pick a date & time slot', icon: CalendarDays },
              ].map((step) => (
                <div key={step.n} className="flex items-center gap-4">
                  <span className="font-playfair text-sm text-[#D4AF37]">{step.n}</span>
                  <span className="h-px w-6 bg-[#D4AF37]/40" />
                  <step.icon className="h-4 w-4 text-[#D4AF37]/70" />
                  <span className="text-xs uppercase tracking-[0.16em] text-white/65">{step.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <button type="button" onClick={() => setCalendarOpen(true)} className="og-btn og-btn-ghost">
                <CalendarDays className="h-4 w-4" /> View Live Calendar
              </button>
              {data.contact.phone && (
                <a href={`tel:${data.contact.phone}`} className="og-btn og-btn-quiet">
                  <Phone className="h-4 w-4" /> Call {data.contact.phone}
                </a>
              )}
            </div>
          </div>

          <div className="og-frame bg-[#141414]/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:p-8">
            <div className="flex items-center justify-between gap-3 border-b border-[#D4AF37]/20 pb-5">
              <div>
                <p className="og-eyebrow">Booking Concierge</p>
                <h3 className="mt-2 font-playfair text-2xl text-white">Plan your visit</h3>
              </div>
              <CalendarDays className="h-8 w-8 text-[#D4AF37]/60" />
            </div>

            <div className="mt-6">
              <label className="og-eyebrow !text-[9px]" htmlFor={`${uid}-services`}>01 · Services</label>
              <div id={`${uid}-services`} className="og-scroll mt-3 flex max-h-[168px] flex-wrap gap-2 overflow-y-auto pr-1">
                {data.services.length > 0 ? (
                  data.services.slice(0, 12).map((service) => {
                    const selected = selectedServices.some((item) => item.id === service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`rounded-sm border px-3 py-2 text-left text-[11px] transition-colors ${
                          selected
                            ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F5D77A]'
                            : 'border-[#D4AF37]/20 bg-[#1C1C1C] text-white/65 hover:border-[#D4AF37]/50'
                        }`}
                      >
                        {selected && <Check className="mr-1 inline h-3 w-3" />}
                        {service.name}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-white/40">Services can be selected on the booking page.</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="og-eyebrow !text-[9px]" htmlFor={`${uid}-staff`}>02 · Specialist</label>
              <select
                id={`${uid}-staff`}
                value={preferredStaffId}
                onChange={(event) => setPreferredStaffId(event.target.value)}
                className="og-select mt-3"
              >
                <option value="">Any available specialist</option>
                {data.staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}{member.role ? ` — ${member.role}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <p className="og-eyebrow !text-[9px]">03 · Date & Time</p>
              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="mt-3 flex w-full items-center justify-between rounded-sm border border-[#D4AF37]/25 bg-[#0E0E0E] px-4 py-3 text-left text-xs text-white/65 transition-colors hover:border-[#D4AF37]/60"
              >
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#D4AF37]" /> Browse available slots</span>
                <ArrowUpRight className="h-4 w-4 text-[#D4AF37]" />
              </button>
            </div>

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#D4AF37]/20 pt-5">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Your selection</p>
                <p className="mt-1 truncate text-sm text-white">
                  {selectedServices.length > 0
                    ? `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} · ${formatPrice(totalPrice)}`
                    : 'No services selected yet'}
                </p>
              </div>
              {selectedServices.length > 0 && <span className="font-playfair text-xl text-[#F5D77A]">{totalDuration} min</span>}
            </div>

            <button
              type="button"
              onClick={() => handleBook(selectedServices, { staffId: preferredStaffId || undefined })}
              className="og-btn og-btn-primary mt-5 w-full"
            >
              Continue to Booking <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-4 text-center text-[10px] leading-relaxed text-white/35">
              Service selection, specialist choice, live dates and time slots continue on the next step.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ 16 — OPENING HOURS ══════════ */}
      {hasHoursData && (
        <section id={sectionId('hours')} className={`border-b border-white/5 py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto grid max-w-[1100px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-12">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-7 bg-[#D4AF37]/60" />
                <span className="og-eyebrow">When To Visit</span>
              </div>
              <h2 className="text-[clamp(2rem,4vw,3.2rem)] leading-tight text-white">Opening Hours</h2>
              {(data.hours.opening || data.hours.closing) && (
                <p className="mt-6 font-playfair text-2xl text-[#F5D77A] sm:text-3xl">
                  {data.hours.opening} – {data.hours.closing}
                </p>
              )}
              {data.hours.weeklyOff && (
                <div className="mt-6 inline-flex items-center gap-2.5 rounded-sm border border-[#D4AF37]/25 bg-[#1C1C1C] px-4 py-2.5 text-xs text-white/70">
                  <CalendarDays className="h-4 w-4 text-[#D4AF37]" /> Weekly off: <span className="font-semibold text-[#F5D77A]">{data.hours.weeklyOff}</span>
                </div>
              )}
              <button type="button" onClick={() => setCalendarOpen(true)} className="og-btn og-btn-ghost mt-8">
                <CalendarDays className="h-4 w-4" /> Check Availability
              </button>
            </div>

            <div className="og-frame bg-[#141414] p-5 sm:p-7">
              <div className="space-y-px">
                {data.hours.days.map((day, dayIndex) => (
                  <div
                    key={day.day || `day-${dayIndex}`}
                    className={`flex items-center justify-between gap-3 border-b border-white/5 py-3 last:border-0 ${
                      day.closed ? 'opacity-55' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75 sm:text-sm">{day.day}</span>
                    <span className={`text-xs sm:text-sm ${day.closed ? 'text-[#D4AF37]/80' : 'text-[#A1A1AA]'}`}>
                      {day.label || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════ 17 — CONTACT & LOCATION ══════════ */}
      {hasContactData && (
        <section id={sectionId('contact')} className={`border-b border-white/5 bg-[#101010] py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading eyebrow="Find Us" title="Contact & Location" description="Reach the salon directly or open directions in Google Maps." />
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3.5">
                {(data.contact.address || data.contact.city) && (
                  <div className="og-card flex items-start gap-4 p-5">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-[#D4AF37]/25 bg-[#1C1C1C] text-[#D4AF37]">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="og-eyebrow !text-[9px]">Address</p>
                      <p className="mt-1.5 break-words text-sm leading-relaxed text-white/80">
                        {[data.contact.address, data.contact.city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                {data.contact.phone && (
                  <a href={`tel:${data.contact.phone}`} className="og-card og-card-hover flex items-start gap-4 p-5">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-[#D4AF37]/25 bg-[#1C1C1C] text-[#D4AF37]">
                      <Phone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="og-eyebrow !text-[9px]">Phone</p>
                      <p className="mt-1.5 break-words text-sm text-white/80">{data.contact.phone}</p>
                    </div>
                  </a>
                )}
                {data.contact.whatsappUrl && (
                  <a href={data.contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="og-card og-card-hover flex items-start gap-4 p-5">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-[#D4AF37]/25 bg-[#1C1C1C] text-[#D4AF37]">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="og-eyebrow !text-[9px]">WhatsApp</p>
                      <p className="mt-1.5 break-words text-sm text-white/80">{data.contact.whatsapp || 'Message the salon'}</p>
                    </div>
                  </a>
                )}
                {data.contact.email && (
                  <a href={`mailto:${data.contact.email}`} className="og-card og-card-hover flex items-start gap-4 p-5">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-[#D4AF37]/25 bg-[#1C1C1C] text-[#D4AF37]">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="og-eyebrow !text-[9px]">Email</p>
                      <p className="mt-1.5 break-all text-sm text-white/80">{data.contact.email}</p>
                    </div>
                  </a>
                )}

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <a href={data.contact.mapsUrl} target="_blank" rel="noopener noreferrer" className="og-btn og-btn-primary">
                    <Navigation className="h-4 w-4" /> Get Directions
                  </a>
                  {data.contact.socials.map((social) => {
                    const Icon = socialIcon(social.kind);
                    return (
                      <a
                        key={`${social.kind}-${social.href}`}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        title={social.label}
                        className="flex h-[46px] w-[46px] items-center justify-center rounded-sm border border-[#D4AF37]/30 text-[#F5D77A] transition-colors hover:bg-[#D4AF37]/10"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {(data.contact.address || data.contact.city) && (
                <div className="og-frame relative min-h-[320px] overflow-hidden bg-[#141414]">
                  <iframe
                    title={`Map to ${data.name}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      [data.contact.address, data.contact.city].filter(Boolean).join(', ')
                    )}&output=embed`}
                    className="h-full min-h-[320px] w-full border-0 grayscale-[0.65] contrast-[1.1]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="pointer-events-none absolute inset-0 border border-[#D4AF37]/10" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ 18 — PREMIUM FOOTER ══════════ */}
      <footer className="relative overflow-hidden bg-[#0A0A0A] pb-24 pt-16 sm:pb-10 sm:pt-20">
        <div className="og-glow left-1/2 top-0 h-72 w-[600px] -translate-x-1/2 opacity-60" />
        <div className="relative mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                {data.logoUrl ? (
                  <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-sm border border-[#D4AF37]/35 bg-[#141414] p-1">
                    <img src={data.logoUrl} alt={`${data.name} logo`} className="h-full w-full object-contain" />
                  </span>
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-[#D4AF37]/45 bg-[#D4AF37]/8 font-playfair text-lg font-bold text-[#D4AF37]">
                    {initials(data.name) || 'N'}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-playfair text-sm font-bold uppercase tracking-[0.14em] text-white">{data.name}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]/70">{data.category || 'Luxury Salon'}</p>
                </div>
              </div>
              {data.tagline && <p className="mt-5 max-w-xs font-playfair text-sm italic leading-relaxed text-white/50">“{data.tagline}”</p>}
              {data.contact.socials.length > 0 && (
                <div className="mt-6 flex gap-2">
                  {data.contact.socials.map((social) => {
                    const Icon = socialIcon(social.kind);
                    return (
                      <a
                        key={`footer-${social.kind}-${social.href}`}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/10 text-white/50 transition-colors hover:border-[#D4AF37]/50 hover:text-[#F5D77A]"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <p className="og-eyebrow">Navigate</p>
              <nav className="mt-5 flex flex-col items-start gap-3" aria-label="Footer navigation">
                {navItems.map((item) => (
                  <a
                    key={item.key}
                    href={`#${sectionId(item.key)}`}
                    onClick={(event) => { event.preventDefault(); scrollTo(item.key); }}
                    className="text-xs text-white/55 transition-colors hover:text-[#F5D77A]"
                  >
                    {item.label}
                  </a>
                ))}
                <button type="button" onClick={() => handleBook(selectedServices)} className="text-xs text-[#F5D77A] transition-colors hover:text-white">
                  Book Appointment
                </button>
              </nav>
            </div>

            <div>
              <p className="og-eyebrow">Services</p>
              <div className="mt-5 flex flex-col items-start gap-3">
                {data.services.slice(0, 6).map((service) => (
                  <button
                    key={`footer-${service.id}`}
                    type="button"
                    onClick={() => { setActiveCategory('All'); scrollTo('services'); }}
                    className="max-w-full truncate text-left text-xs text-white/55 transition-colors hover:text-[#F5D77A]"
                  >
                    {service.name}
                  </button>
                ))}
                {data.services.length === 0 && <p className="text-xs text-white/35">Service menu available soon.</p>}
              </div>
            </div>

            <div>
              <p className="og-eyebrow">Contact</p>
              <div className="mt-5 space-y-3 text-xs leading-relaxed text-white/55">
                {(data.contact.address || data.contact.city) && (
                  <p className="break-words">{[data.contact.address, data.contact.city].filter(Boolean).join(', ')}</p>
                )}
                {data.contact.phone && (
                  <a href={`tel:${data.contact.phone}`} className="block break-words transition-colors hover:text-[#F5D77A]">{data.contact.phone}</a>
                )}
                {data.contact.email && (
                  <a href={`mailto:${data.contact.email}`} className="block break-all transition-colors hover:text-[#F5D77A]">{data.contact.email}</a>
                )}
                {(data.hours.opening || data.hours.closing) && (
                  <p className="text-[#F5D77A]/80">{data.hours.opening} – {data.hours.closing}</p>
                )}
              </div>
              <button type="button" onClick={() => setCalendarOpen(true)} className="og-btn og-btn-ghost mt-6 !min-h-[40px] !px-4">
                <CalendarDays className="h-3.5 w-3.5" /> Book Now
              </button>
            </div>
          </div>

          <div className="og-hairline mt-14" />
          <div className="mt-6 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-[10px] tracking-[0.12em] text-white/35">
              © {new Date().getFullYear()} {data.name}. All rights reserved.
            </p>
            <button
              type="button"
              onClick={() => { if (!isPreview) navigate('/'); }}
              className="text-[10px] tracking-[0.14em] text-[#D4AF37]/70 transition-colors hover:text-[#F5D77A]"
            >
              Powered by Nexora Salonos
            </button>
          </div>
        </div>
      </footer>

      {/* ── Mobile sticky booking CTA ────────────────── */}
      <div
        className={`fixed bottom-0 z-30 transition-all duration-300 md:hidden ${
          stickyVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
        } ${constrainedWidth ? 'left-1/2 w-full max-w-[430px] -translate-x-1/2' : 'left-0 right-0'}`}
      >
        <div className="border-t border-[#D4AF37]/35 bg-[#101010]/96 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="og-eyebrow !text-[8px]">Reservations</p>
              <p className="mt-1 truncate text-xs text-white/80">
                {selectedServices.length > 0
                  ? `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} · ${formatPrice(totalPrice)}`
                  : data.name}
              </p>
            </div>
            <button type="button" onClick={() => handleBook(selectedServices)} className="og-btn og-btn-primary !min-h-[42px] !px-5">
              <CalendarDays className="h-4 w-4" /> Book
            </button>
          </div>
        </div>
      </div>

      {/* ── Reusable gallery lightbox ────────────────── */}
      {lightboxIndex !== null && data.photos.length > 0 && (
        <Lightbox
          images={data.photos}
          currentIndex={lightboxIndex}
          isOpen
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          title={`${data.name} — Portfolio`}
        />
      )}

      {/* ── Existing live booking calendar ───────────── */}
      <MultiViewBookingCalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        shopId={data.shopId}
        shopName={data.name}
        openingTime={shop?.opening_time}
        closingTime={shop?.closing_time}
        onConfirm={isPreview ? handleCalendarConfirm : undefined}
      />
    </div>
  );
}

export default ObsidianGoldLuxury;
