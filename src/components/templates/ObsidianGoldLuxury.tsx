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
  Eye,
  Facebook,
  Gem,
  Globe,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  Navigation,
  Palette,
  Phone,
  Play,
  PlayCircle,
  Quote,
  Scissors,
  Search,
  Send,
  Sparkles,
  Star,
  Tag,
  User,
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
  filterServices,
  formatPrice,
  formatReviewDate,
  type OGCategory,
  type OGOffer,
  type OGPackage,
  type OGService,
  type OGSiteData,
  type OGStaff,
  type OGVideo,
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

type OGSectionKey =
  | 'home'
  | 'categories'
  | 'services'
  | 'about'
  | 'offers'
  | 'team'
  | 'gallery'
  | 'transformations'
  | 'testimonials'
  | 'reviews'
  | 'membership'
  | 'booking'
  | 'hours'
  | 'contact';

interface OGSection {
  key: OGSectionKey;
  label: string;
  /** Where the link lives: primary desktop strip, "More" menu, or both. */
  group: 'primary' | 'more';
}

/**
 * Every visible section of the public website, in page order.
 * Navigation is generated from this list and filtered by the data that
 * actually exists for the current salon, so a hidden section can never
 * leave a dead nav link behind.
 */
const OG_SECTIONS: OGSection[] = [
  { key: 'home', label: 'Home', group: 'primary' },
  { key: 'categories', label: 'Categories', group: 'primary' },
  { key: 'services', label: 'Services', group: 'primary' },
  { key: 'about', label: 'About', group: 'primary' },
  { key: 'offers', label: 'Offers', group: 'more' },
  { key: 'team', label: 'Our Team', group: 'primary' },
  { key: 'gallery', label: 'Portfolio', group: 'primary' },
  { key: 'transformations', label: 'Before & After', group: 'more' },
  { key: 'testimonials', label: 'Testimonials', group: 'more' },
  { key: 'reviews', label: 'Reviews', group: 'more' },
  { key: 'membership', label: 'Membership', group: 'more' },
  { key: 'booking', label: 'Booking', group: 'more' },
  { key: 'hours', label: 'Opening Hours', group: 'more' },
  { key: 'contact', label: 'Contact', group: 'primary' },
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
  const [activeCategory, setActiveCategory] = useState('all');
  const [serviceQuery, setServiceQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<OGService[]>([]);
  const [preferredStaffId, setPreferredStaffId] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [beforeAfterIndex, setBeforeAfterIndex] = useState(0);
  const [revealValue, setRevealValue] = useState(50);
  const [copiedCode, setCopiedCode] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [portfolioStaff, setPortfolioStaff] = useState<OGStaff | null>(null);
  const [portfolioIndex, setPortfolioIndex] = useState(0);
  const [inquiryStaff, setInquiryStaff] = useState<OGStaff | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [videoIndex, setVideoIndex] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ from: 'bot' | 'user'; text: string }[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const sectionMargin = previewOffset ? 'scroll-mt-[8.5rem]' : 'scroll-mt-[5.5rem]';
  const sectionId = (key: string) => `${uid}-${key}`;

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
  const hasOwnerData = Boolean(
    data.owner.name || data.owner.photo || data.owner.bio || data.owner.designation || data.owner.specialties.length
  );

  // ── Section availability — navigation is derived from real data only ──
  const sectionAvailability: Record<OGSectionKey, boolean> = {
    home: true,
    categories: data.categories.length > 0,
    services: data.services.length > 0,
    about: Boolean(data.aboutText || data.aboutStory || data.specialties.length || hasOwnerData),
    offers: data.offers.length > 0,
    team: data.staff.length > 0,
    gallery: data.photos.length > 0 || data.videos.length > 0,
    transformations: data.beforeAfter.length > 0,
    testimonials: data.testimonials.length > 0,
    reviews: true,
    membership: data.packages.length > 0,
    booking: true,
    hours: hasHoursData,
    contact: hasContactData,
  };
  const navItems = OG_SECTIONS.filter((section) => sectionAvailability[section.key]);
  const primaryNav = navItems.filter((section) => section.group === 'primary');
  const moreNav = navItems.filter((section) => section.group === 'more');
  const navSignature = navItems.map((section) => section.key).join('|');

  const activeCategoryEntry = data.categories.find((category) => category.key === activeCategory) || null;
  const filteredServices = useMemo(
    () => filterServices(data.services, activeCategory, serviceQuery),
    [data.services, activeCategory, serviceQuery]
  );
  const isFiltering = activeCategory !== 'all' || serviceQuery.trim().length > 0;

  const scrollTo = useCallback(
    (key: string) => {
      const element = document.getElementById(`${uid}-${key}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileOpen(false);
      setMoreOpen(false);
    },
    [uid]
  );

  const selectCategory = useCallback(
    (categoryKey: string) => {
      setActiveCategory(categoryKey);
      window.setTimeout(() => scrollTo('services'), 40);
    },
    [scrollTo]
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

  // ── Scroll spy for the sticky navigation ──────────────────────────────
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(`section[id^="${uid}-"]`));
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) {
          const key = visible.target.id.slice(uid.length + 1);
          setActiveSection(key);
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [uid, navSignature]);

  // ── Close the "More" menu on outside click / Escape ───────────────────
  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [moreOpen]);

  const toggleService = useCallback((service: OGService) => {
    setSelectedServices((prev) =>
      prev.some((item) => item.id === service.id)
        ? prev.filter((item) => item.id !== service.id)
        : [...prev, service]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedServices([]), []);

  /** Matches an offer's published service labels to real service records. */
  const servicesForOffer = useCallback(
    (offer: OGOffer) => {
      if (offer.services.length === 0) return [] as OGService[];
      const labels = offer.services.map((label) => label.toLowerCase().trim());
      return data.services.filter((service) =>
        labels.some(
          (label) =>
            label === service.id.toLowerCase() ||
            label === service.name.toLowerCase() ||
            service.name.toLowerCase().includes(label) ||
            label.includes(service.name.toLowerCase())
        )
      );
    },
    [data.services]
  );

  const handleBook = useCallback(
    (
      services: OGService[] = [],
      options: { staffId?: string; offer?: OGOffer; pkg?: OGPackage; packageName?: string } = {}
    ) => {
      if (isPreview) {
        if (services.length) setSelectedServices(services);
        if (options.staffId) setPreferredStaffId(options.staffId);
        setCalendarOpen(true);
        toast({
          title: 'Demo booking calendar',
          description: 'Preview data only — published salons open their real booking flow.',
        });
        return;
      }
      const params = new URLSearchParams();
      if (options.staffId) params.set('staffId', options.staffId);
      if (options.offer?.code) params.set('offer', options.offer.code);
      if (options.pkg) params.set('packageId', options.pkg.id);
      const query = params.toString();
      navigate(`/shop/${data.shopId}/book${query ? `?${query}` : ''}`, {
        state: {
          preSelectedServices: services.map((svc) => svc.raw ?? svc),
          offer: options.offer
            ? { id: options.offer.id, title: options.offer.title, code: options.offer.code }
            : undefined,
          pkg: options.pkg
            ? {
                id: options.pkg.id,
                name: options.pkg.name,
                sessions: options.pkg.sessions,
                validity: options.pkg.validity,
                price: options.pkg.price,
              }
            : undefined,
        },
      });
    },
    [isPreview, navigate, data.shopId, toast]
  );

  /** Availability requests on the live site always continue into the real
   *  booking flow, which uses getBookingsForSlotCheck() as the source of
   *  truth. The simulated calendar is only ever shown in template preview. */
  const checkAvailability = useCallback(() => {
    if (isPreview) {
      setCalendarOpen(true);
      return;
    }
    handleBook(selectedServices, { staffId: preferredStaffId || undefined });
  }, [handleBook, isPreview, selectedServices, preferredStaffId]);

  const handleCalendarConfirm = useCallback(
    (date: string, time: string) => {
      setCalendarOpen(false);
      toast({
        title: 'Preview reservation selected',
        description: `${formatReviewDate(date) || date} · ${time} — this calendar is demo data inside the template preview.`,
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

  const openStylistPortfolio = useCallback((member: OGStaff) => {
    setPortfolioStaff(member);
    setPortfolioIndex(0);
  }, []);

  const openStylistInquiry = useCallback((member: OGStaff) => {
    setInquiryStaff(member);
    setInquiryMessage(
      `Hi ${member.name.split(' ')[0]}, I would like to know more about your services and availability at ${data.name}.`
    );
  }, [data.name]);

  const stylistInquiryWhatsApp = useCallback(
    (member: OGStaff) => {
      const target = member.whatsappUrl || data.contact.whatsappUrl;
      if (!target) return '';
      const base = target.split('?')[0];
      return `${base}?text=${encodeURIComponent(inquiryMessage)}`;
    },
    [data.contact.whatsappUrl, inquiryMessage]
  );

  const copyInquiry = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inquiryMessage);
      toast({ title: 'Message copied', description: 'Paste it into WhatsApp or SMS.' });
    } catch {
      toast({ title: 'Copy not available', description: 'Select the message text and copy it manually.' });
    }
  }, [inquiryMessage, toast]);

  // ── Simulated concierge (clearly automated, real salon data only) ─────
  const chatReply = useCallback(
    (raw: string) => {
      const text = raw.toLowerCase();
      if (/price|cost|service|menu|rate/.test(text)) {
        if (data.services.length === 0) return 'The salon has not published its service menu yet. Please use the contact options to ask for prices.';
        const list = data.services
          .slice(0, 4)
          .map((service) => `${service.name} — ${formatPrice(service.price)}${service.duration > 0 ? ` (${service.duration} min)` : ''}`)
          .join('\n');
        return `Here are a few published services:\n${list}\nThe full menu is in the Services section.`;
      }
      if (/hour|open|close|timing|time|off/.test(text)) {
        if (!hasHoursData) return 'Opening hours are not published yet. Please call the salon to confirm timings.';
        const days = data.hours.days.filter((day) => day.label).slice(0, 7).map((day) => `${day.day}: ${day.label}`).join('\n');
        return `${data.hours.opening && data.hours.closing ? `Open ${data.hours.opening} – ${data.hours.closing}.\n` : ''}${days}${
          data.hours.weeklyOff ? `\nWeekly off: ${data.hours.weeklyOff}` : ''
        }`;
      }
      if (/book|appoint|slot|reserve|availab/.test(text)) {
        return 'Use the Book Appointment button to choose services, a specialist, a date and a live time slot. The booking page confirms availability from the salon calendar.';
      }
      if (/where|location|address|direction|map|reach/.test(text)) {
        const place = [data.contact.address, data.contact.city].filter(Boolean).join(', ');
        return place ? `${data.name} is at ${place}. Get Directions in the Contact section opens Google Maps.` : 'The address is not published yet. Please call the salon for directions.';
      }
      if (/offer|discount|coupon|deal/.test(text)) {
        if (data.offers.length === 0) return 'No offers are published right now.';
        return `Current offers: ${data.offers.map((offer) => `${offer.title || 'Offer'}${offer.code ? ` (${offer.code})` : ''}`).join(', ')}. See the Offers section for validity.`;
      }
      if (/staff|stylist|team|who|expert/.test(text)) {
        if (data.staff.length === 0) return 'The team has not been published yet.';
        return `The team includes ${data.staff.map((member) => `${member.name}${member.role ? ` (${member.role})` : ''}`).join(', ')}.`;
      }
      if (/cancel|resched/.test(text)) {
        return data.contact.phone
          ? `For cancellations or rescheduling please call ${data.contact.phone}.`
          : 'For cancellations please use the salon contact options.';
      }
      const fallback = [
        data.contact.phone ? `call ${data.contact.phone}` : '',
        data.contact.whatsappUrl ? 'message on WhatsApp' : '',
        data.contact.email ? `email ${data.contact.email}` : '',
      ].filter(Boolean);
      return fallback.length
        ? `I could not match that question. You can ${fallback.join(' or ')}.`
        : 'I could not match that question. Please use the contact section for direct help.';
    },
    [data, hasHoursData]
  );

  const sendChat = useCallback(
    (raw: string) => {
      const message = raw.trim();
      if (!message) return;
      setChatMessages((prev) => [...prev, { from: 'user', text: message }, { from: 'bot', text: chatReply(message) }]);
      setChatInput('');
    },
    [chatReply]
  );

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);

  const currentPair = data.beforeAfter[beforeAfterIndex] || data.beforeAfter[0];
  const nameWords = data.name.split(/\s+/).filter(Boolean);
  let nameAccent = nameWords.length > 1 ? nameWords.pop() || '' : '';
  // Keep short trailing fragments together as the accent (e.g. "& Co.", "& Spa").
  if (nameAccent && nameAccent.length <= 3 && nameWords.length > 1) {
    nameAccent = `${nameWords.pop()} ${nameAccent}`;
  }
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

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            {primaryNav.map((item) => (
              <a
                key={item.key}
                href={`#${sectionId(item.key)}`}
                aria-current={activeSection === item.key ? 'true' : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  scrollTo(item.key);
                }}
                className={`relative px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] transition-colors ${
                  activeSection === item.key ? 'text-[#F5D77A]' : 'text-white/60 hover:text-[#F5D77A]'
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-2.5 -bottom-0.5 h-px bg-[#D4AF37] transition-opacity ${
                    activeSection === item.key ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </a>
            ))}

            {moreNav.length > 0 && (
              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((open) => !open)}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-1 px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] transition-colors ${
                    moreNav.some((item) => item.key === activeSection)
                      ? 'text-[#F5D77A]'
                      : 'text-white/60 hover:text-[#F5D77A]'
                  }`}
                >
                  More
                  <ChevronRight className={`h-3 w-3 transition-transform ${moreOpen ? 'rotate-90' : ''}`} />
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-[#D4AF37]/30 bg-[#0F0F0F]/98 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                    {moreNav.map((item) => (
                      <a
                        key={item.key}
                        href={`#${sectionId(item.key)}`}
                        aria-current={activeSection === item.key ? 'true' : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          scrollTo(item.key);
                        }}
                        className={`flex items-center justify-between px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                          activeSection === item.key
                            ? 'bg-[#D4AF37]/10 text-[#F5D77A]'
                            : 'text-white/60 hover:bg-white/5 hover:text-[#F5D77A]'
                        }`}
                      >
                        {item.label}
                        <ArrowUpRight className="h-3 w-3 text-[#D4AF37]/60" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleBook(selectedServices, { staffId: preferredStaffId || undefined })}
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
          <div className="absolute left-0 right-0 top-full max-h-[75vh] overflow-y-auto border-b border-[#D4AF37]/25 bg-[#0F0F0F]/98 px-4 py-4 shadow-2xl backdrop-blur-xl lg:hidden">
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={`#${sectionId(item.key)}`}
                  aria-current={activeSection === item.key ? 'true' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollTo(item.key);
                  }}
                  className={`flex items-center justify-between border-b border-white/5 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                    activeSection === item.key ? 'text-[#F5D77A]' : 'text-white/75 hover:text-[#F5D77A]'
                  }`}
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
                handleBook(selectedServices, { staffId: preferredStaffId || undefined });
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
              <button
                type="button"
                onClick={() => selectCategory('all')}
                aria-pressed={activeCategory === 'all'}
                className={`og-card og-card-hover og-image-zoom group relative flex h-56 flex-col justify-between overflow-hidden p-5 text-left ${
                  activeCategory === 'all' ? '!border-[#D4AF37]/70 shadow-gold' : ''
                }`}
              >
                {data.photos.length > 0 && (
                  <img src={data.photos[0]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.22]" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/75 to-[#141414]/20" />
                <div className="relative flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-[#D4AF37]/45 bg-[#D4AF37]/12 text-[#F5D77A]">
                    <Diamond className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#D4AF37]/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="relative">
                  <h3 className="font-playfair text-xl text-white sm:text-[1.35rem]">All Services</h3>
                  <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/80">
                    {data.services.length} {data.services.length === 1 ? 'service' : 'services'}
                  </p>
                </div>
              </button>

              {data.categories.map((category: OGCategory, index) => {
                if (category.count === 0) return null;
                const Icon = categoryIcon(category.name);
                const isActive = activeCategory === category.key;
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => selectCategory(category.key)}
                    aria-pressed={isActive}
                    className={`og-card og-card-hover og-image-zoom group relative flex h-56 flex-col justify-between overflow-hidden p-5 text-left ${
                      isActive ? '!border-[#D4AF37]/70 shadow-gold' : ''
                    }`}
                  >
                    {data.photos.length > 0 && (
                      <img
                        src={data.photos[(index + 1) % data.photos.length]}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
                        loading="lazy"
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
                        {isActive ? ' · viewing' : ''}
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
              description="The complete treatment menu of this salon. Search, filter and select every service you would like to book."
              action={
                <button type="button" onClick={checkAvailability} className="og-btn og-btn-quiet">
                  <CalendarDays className="h-4 w-4" /> Check Availability
                </button>
              }
            />

            {/* Search + active category indicator */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4AF37]/70" />
                <input
                  type="search"
                  value={serviceQuery}
                  onChange={(event) => setServiceQuery(event.target.value)}
                  placeholder="Search services by name"
                  aria-label="Search services by name"
                  className="og-input w-full rounded-sm border border-[#D4AF37]/25 bg-[#141414] py-2.5 pl-10 pr-9 text-xs text-white placeholder:text-white/35 focus:border-[#D4AF37]/70 focus:outline-none"
                />
                {serviceQuery && (
                  <button
                    type="button"
                    onClick={() => setServiceQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-white/50 transition-colors hover:text-[#F5D77A]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45" aria-live="polite">
                Showing <span className="font-bold text-[#F5D77A]">{filteredServices.length}</span>{' '}
                {isFiltering ? `of ${data.services.length} available` : 'Available'}{' '}
                {data.services.length === 1 ? 'Service' : 'Services'}
              </p>
            </div>

            {/* Category filters with counts */}
            <div className="og-scroll mb-4 flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                aria-pressed={activeCategory === 'all'}
                className={`flex-shrink-0 rounded-sm border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all ${
                  activeCategory === 'all'
                    ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0A]'
                    : 'border-[#D4AF37]/25 bg-[#141414] text-white/60 hover:border-[#D4AF37]/60 hover:text-[#F5D77A]'
                }`}
              >
                All Services <span className="ml-1 opacity-70">({data.services.length})</span>
              </button>
              {data.categories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setActiveCategory(category.key)}
                  aria-pressed={activeCategory === category.key}
                  className={`flex-shrink-0 rounded-sm border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all ${
                    activeCategory === category.key
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0A]'
                      : 'border-[#D4AF37]/25 bg-[#141414] text-white/60 hover:border-[#D4AF37]/60 hover:text-[#F5D77A]'
                  }`}
                >
                  {category.name} <span className="ml-1 opacity-70">({category.count})</span>
                </button>
              ))}
            </div>

            {isFiltering && (
              <div className="mb-7 flex flex-wrap items-center gap-3 text-[11px] text-white/50">
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#D4AF37]/30 bg-[#1C1C1C] px-3 py-1.5 uppercase tracking-[0.14em] text-[#F5D77A]">
                  <Tag className="h-3 w-3" />
                  {activeCategoryEntry ? activeCategoryEntry.name : 'All Services'}
                  {serviceQuery ? ` · “${serviceQuery}”` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('all');
                    setServiceQuery('');
                  }}
                  className="inline-flex items-center gap-1 uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-[#F5D77A]"
                >
                  <X className="h-3 w-3" /> Clear filters
                </button>
              </div>
            )}

            {filteredServices.length === 0 ? (
              <div className="og-frame bg-[#141414] px-6 py-14 text-center">
                <Search className="mx-auto h-8 w-8 text-[#D4AF37]/50" />
                <p className="mt-4 font-playfair text-xl text-white">No services match your search</p>
                <p className="mt-2 text-xs text-white/45">Try another name or reset the filters to see the full menu.</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('all');
                    setServiceQuery('');
                  }}
                  className="og-btn og-btn-ghost mx-auto mt-6"
                >
                  Show all {data.services.length} services
                </button>
              </div>
            ) : (
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
                          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.16),transparent_65%),linear-gradient(150deg,#161513,#0E0E0E)]">
                            <span className="flex h-14 w-14 items-center justify-center rounded-sm border border-[#D4AF37]/35 bg-[#0A0A0A]/60">
                              <Scissors className="h-6 w-6 text-[#D4AF37]/70" />
                            </span>
                            <span className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]/55">Signature Service</span>
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
                        <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#D4AF37]/15 pt-4">
                          <div>
                            <p className="font-playfair text-xl text-[#F5D77A]">{formatPrice(service.price)}</p>
                            {service.duration > 0 && (
                              <p className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/40">
                                <Clock className="h-3 w-3" /> {service.duration} min
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => toggleService(service)}
                              aria-pressed={selected}
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
                              onClick={() => handleBook([service], { staffId: preferredStaffId || undefined })}
                              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-sm bg-[#D4AF37]/10 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5D77A] transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0A]"
                            >
                              Book This Service <ArrowUpRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════ 07 — ABOUT OUR SALON & OWNER INTRODUCTION ══════════ */}
      {(data.aboutText || data.aboutStory || data.specialties.length > 0 || hasOwnerData) && (
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

          {hasOwnerData && (
            <div className="mx-auto mt-14 max-w-[1320px] px-4 sm:px-8 lg:px-12">
              <div className="og-frame grid gap-7 bg-[#141414] p-6 sm:p-8 lg:grid-cols-[220px_1fr] lg:gap-10 lg:p-10">
                <div className="relative mx-auto w-full max-w-[220px]">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-[#D4AF37]/25 bg-[#0E0E0E]">
                    {data.owner.photo ? (
                      <img
                        src={data.owner.photo}
                        alt={data.owner.name ? `${data.owner.name}, owner of ${data.name}` : `Owner of ${data.name}`}
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.2),transparent_65%),#101010]">
                        <span className="font-playfair text-4xl text-[#D4AF37]/60">
                          {initials(data.owner.name || data.name)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/70 via-transparent to-transparent" />
                  </div>
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-[#D4AF37]/40 bg-[#0A0A0A]/90 px-3 py-1 text-[8px] uppercase tracking-[0.24em] text-[#F5D77A] backdrop-blur-sm">
                    Owner
                  </span>
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="h-px w-7 bg-[#D4AF37]/60" />
                    <span className="og-eyebrow">The Owner</span>
                  </div>
                  {data.owner.name ? (
                    <h3 className="font-playfair text-2xl text-white sm:text-3xl">{data.owner.name}</h3>
                  ) : (
                    <h3 className="font-playfair text-2xl text-white sm:text-3xl">Meet the owner</h3>
                  )}
                  {data.owner.designation && (
                    <p className="mt-1.5 text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]/85">{data.owner.designation}</p>
                  )}
                  {data.owner.bio && (
                    <p className="mt-5 max-w-2xl text-sm leading-[1.9] text-[#A1A1AA] sm:text-[15px]">{data.owner.bio}</p>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {data.owner.experience && (
                      <span className="inline-flex items-center gap-2 rounded-sm border border-[#D4AF37]/25 bg-[#1C1C1C] px-3.5 py-2 text-[11px] text-white/75">
                        <Award className="h-3.5 w-3.5 text-[#D4AF37]" /> {data.owner.experience} of experience
                      </span>
                    )}
                    {data.owner.specialties.map((specialty) => (
                      <span
                        key={`owner-${specialty}`}
                        className="inline-flex items-center gap-2 rounded-sm border border-[#D4AF37]/25 bg-[#1C1C1C] px-3.5 py-2 text-[11px] text-white/75"
                      >
                        <Diamond className="h-3 w-3 text-[#D4AF37]" /> {specialty}
                      </span>
                    ))}
                  </div>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleBook(selectedServices, { staffId: preferredStaffId || undefined })}
                      className="og-btn og-btn-primary"
                    >
                      <CalendarDays className="h-4 w-4" /> Book an appointment
                    </button>
                    {data.contact.whatsappUrl && (
                      <a
                        href={data.contact.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="og-btn og-btn-ghost"
                      >
                        <MessageCircle className="h-4 w-4" /> Message the salon
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ══════════ 08 — EXCLUSIVE OFFERS ══════════ */}
      {data.offers.length > 0 && (
        <section id={sectionId('offers')} className={`relative border-b border-white/5 py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading
              eyebrow="Privileges"
              title="Exclusive Offers"
              description="Current offers published by this salon, with the services and validity exactly as listed."
            />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.offers.map((offer: OGOffer) => {
                const applicable = servicesForOffer(offer);
                const bookingServices = applicable.length > 0 ? applicable : selectedServices;
                return (
                  <article key={offer.id} className="og-card og-card-hover relative flex flex-col overflow-hidden p-6 sm:p-7">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#D4AF37]/8 blur-2xl" />
                    <div className="relative flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <Tag className="h-5 w-5 text-[#D4AF37]" />
                        {(offer.badge || offer.discountLabel) && (
                          <span className="rounded-sm border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#F5D77A]">
                            {offer.discountLabel || offer.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-6 font-playfair text-xl text-white">{offer.title || 'Special Offer'}</h3>
                      {offer.description && (
                        <p className="mt-2.5 text-[13px] leading-relaxed text-[#A1A1AA]">{offer.description}</p>
                      )}

                      {(offer.price > 0 || offer.originalPrice > 0) && (
                        <p className="mt-4 flex flex-wrap items-baseline gap-2 font-playfair text-2xl text-[#F5D77A]">
                          {offer.price > 0 && <span>{formatPrice(offer.price)}</span>}
                          {offer.originalPrice > offer.price && (
                            <span className="font-inter text-xs text-white/35 line-through">
                              {formatPrice(offer.originalPrice)}
                            </span>
                          )}
                        </p>
                      )}

                      {offer.services.length > 0 && (
                        <div className="mt-5">
                          <p className="og-eyebrow !text-[8px]">Applicable services</p>
                          <ul className="mt-2.5 space-y-1.5">
                            {offer.services.slice(0, 4).map((label) => {
                              const matched = applicable.find(
                                (service) =>
                                  service.id.toLowerCase() === label.toLowerCase() ||
                                  service.name.toLowerCase() === label.toLowerCase()
                              );
                              return (
                                <li key={`${offer.id}-${label}`} className="flex items-start gap-2 text-[11px] text-white/65">
                                  <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#D4AF37]" />
                                  <span className="min-w-0 break-words">
                                    {matched ? matched.name : label}
                                    {matched && matched.price > 0 && (
                                      <span className="ml-1 text-white/35">· {formatPrice(matched.price)}</span>
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                            {offer.services.length > 4 && (
                              <li className="text-[11px] text-white/35">+{offer.services.length - 4} more services</li>
                            )}
                          </ul>
                        </div>
                      )}

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
                            Valid until {formatReviewDate(offer.validUntil)}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                        <button
                          type="button"
                          onClick={() => handleBook(bookingServices, { offer })}
                          className="og-btn og-btn-primary !min-h-[40px] !px-4"
                        >
                          <CalendarDays className="h-3.5 w-3.5" /> Book with this offer
                        </button>
                        {offer.code && (
                          <span className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                            Code kept with your booking
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ 09 — MEET OUR EXPERTS ══════════ */}
      {data.staff.length > 0 && (
        <section id={sectionId('team')} className={`border-b border-white/5 bg-[#101010] py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading
              eyebrow="The Artisans"
              title="Meet Our Experts"
              description="The professionals behind every appointment at this salon. Browse their own work or book directly with them."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.staff.map((member) => (
                <article key={member.id} className="og-card og-card-hover group flex flex-col overflow-hidden">
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
                    {member.portfolioPhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openStylistPortfolio(member)}
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-sm border border-[#D4AF37]/45 bg-[#0A0A0A]/75 text-[#F5D77A] backdrop-blur-sm transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0A]"
                        aria-label={`View ${member.name}'s portfolio`}
                        title="View portfolio"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
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

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                      <button
                        type="button"
                        onClick={() => openStylistPortfolio(member)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-white/15 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/70 transition-colors hover:border-[#D4AF37]/60 hover:text-[#F5D77A]"
                      >
                        <Eye className="h-3.5 w-3.5" /> Portfolio
                      </button>
                      <button
                        type="button"
                        onClick={() => openStylistInquiry(member)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-white/15 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/70 transition-colors hover:border-[#D4AF37]/60 hover:text-[#F5D77A]"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBook(selectedServices, { staffId: member.id })}
                        className="col-span-2 inline-flex items-center justify-center gap-2 rounded-sm border border-[#D4AF37]/35 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5D77A] transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0A]"
                      >
                        Book with {member.name.split(' ')[0]} <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ 10 — LUXURY PORTFOLIO & VIDEO ══════════ */}
      {(data.photos.length > 0 || data.videos.length > 0) && (
        <section id={sectionId('gallery')} className={`border-b border-white/5 py-20 sm:py-28 ${sectionMargin}`}>
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading
              eyebrow="The Portfolio"
              title="Luxury Portfolio"
              description="A look inside the salon and the work shared by the business."
              action={
                data.photos.length > 0 ? (
                  <button type="button" onClick={() => openLightbox(0)} className="og-btn og-btn-quiet">
                    <ZoomIn className="h-4 w-4" /> View All ({data.photos.length})
                  </button>
                ) : undefined
              }
            />

            {data.photos.length > 0 && (
              <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-3 lg:grid-cols-4">
                {data.photos.map((photo, index) => (
                  <button
                    key={`${photo}-${index}`}
                    type="button"
                    onClick={() => openLightbox(index)}
                    aria-label={`Open gallery photo ${index + 1} of ${data.photos.length}`}
                    className={`og-image-zoom group relative overflow-hidden rounded-sm border border-[#D4AF37]/20 bg-[#141414] ${
                      index === 0 ? 'col-span-2 row-span-2' : ''
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`${data.name} portfolio ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        (event.currentTarget.parentElement as HTMLElement | null)?.style.setProperty('display', 'none');
                      }}
                    />
                    <div className="absolute inset-0 bg-[#0A0A0A]/0 transition-colors group-hover:bg-[#0A0A0A]/40" />
                    <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#D4AF37]/50 bg-[#0A0A0A]/75 text-[#F5D77A] opacity-0 transition-opacity group-hover:opacity-100">
                      <ZoomIn className="h-4 w-4" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {data.videos.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px w-7 bg-[#D4AF37]/60" />
                  <span className="og-eyebrow">Salon films</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.videos.map((item: OGVideo, index) => {
                    const platformLabel =
                      item.kind === 'youtube'
                        ? 'YouTube'
                        : item.kind === 'instagram'
                          ? 'Instagram'
                          : item.kind === 'facebook'
                            ? 'Facebook'
                            : item.kind === 'file'
                              ? 'Uploaded video'
                              : 'External video';
                    return (
                      <div key={item.id} className="og-frame flex flex-col overflow-hidden bg-[#141414]">
                        <div className="relative aspect-video w-full overflow-hidden bg-[#0E0E0E]">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title || `${data.name} video ${index + 1}`}
                              className="h-full w-full object-cover opacity-80"
                              loading="lazy"
                              onError={(event) => {
                                (event.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.18),transparent_65%),#121212]" />
                          )}
                          {item.kind === 'file' ? (
                            <button
                              type="button"
                              onClick={() => setVideoIndex(index)}
                              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#F5D77A] transition-colors hover:text-white"
                              aria-label={`Play ${item.title || 'salon video'}`}
                            >
                              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-[#0A0A0A]/70 backdrop-blur-sm">
                                <Play className="h-6 w-6" />
                              </span>
                              <span className="text-[9px] uppercase tracking-[0.24em]">Watch video</span>
                            </button>
                          ) : item.embedUrl ? (
                            <button
                              type="button"
                              onClick={() => setVideoIndex(index)}
                              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#F5D77A] transition-colors hover:text-white"
                              aria-label={`Play ${platformLabel} video`}
                            >
                              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-[#0A0A0A]/70 backdrop-blur-sm">
                                <PlayCircle className="h-6 w-6" />
                              </span>
                              <span className="text-[9px] uppercase tracking-[0.24em]">Watch on {platformLabel}</span>
                            </button>
                          ) : (
                            <a
                              href={item.watchUrl || item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#F5D77A] transition-colors hover:text-white"
                              aria-label={`Watch this video on ${platformLabel}`}
                            >
                              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/60 bg-[#0A0A0A]/70 backdrop-blur-sm">
                                <PlayCircle className="h-6 w-6" />
                              </span>
                              <span className="text-[9px] uppercase tracking-[0.24em]">Watch on {platformLabel}</span>
                            </a>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-3 px-4 py-3">
                          <p className="min-w-0 truncate text-[11px] text-white/70">
                            {item.title || `${data.name} video ${index + 1}`}
                          </p>
                          <span className="flex-shrink-0 text-[9px] uppercase tracking-[0.18em] text-[#D4AF37]/75">
                            {platformLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
        <section
          id={sectionId('testimonials')}
          className={`border-b border-white/5 py-20 sm:py-28 ${sectionMargin}`}
        >
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12">
            <SectionHeading
              eyebrow="In Their Words"
              title="Customer Testimonials"
              description="Feedback shared by clients of this salon. Full ratings and review history appear below."
              center
            />
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
                      {[testimonial.service, formatReviewDate(testimonial.date)].filter(Boolean).join(' · ') || 'Client testimonial'}
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
            <SectionHeading
              eyebrow="The Inner Circle"
              title="Membership & Packages"
              description="Memberships and packages offered by this salon, with the included services exactly as listed."
              center
            />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.packages.map((pkg: OGPackage, index) => (
                <article
                  key={pkg.id}
                  className={`og-card og-card-hover relative flex flex-col p-6 sm:p-8 ${index === 0 ? '!border-[#D4AF37]/55' : ''}`}
                >
                  <Crown className="h-6 w-6 text-[#D4AF37]" />
                  <h3 className="mt-5 font-playfair text-xl text-white sm:text-2xl">{pkg.name || `Package ${index + 1}`}</h3>
                  {pkg.description && <p className="mt-2.5 text-[13px] leading-relaxed text-[#A1A1AA]">{pkg.description}</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.16em] text-white/45">
                    {pkg.sessions > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" /> {pkg.sessions} {pkg.sessions === 1 ? 'session' : 'sessions'}
                      </span>
                    )}
                    {pkg.validity && <span className="inline-flex items-center gap-1.5"><Clock className="h-3 w-3" /> {pkg.validity}</span>}
                  </div>

                  {pkg.price > 0 && (
                    <p className="mt-5 font-playfair text-3xl text-[#F5D77A]">
                      {formatPrice(pkg.price)}
                      {pkg.period && <span className="ml-1.5 font-inter text-xs tracking-normal text-white/45">/ {pkg.period}</span>}
                    </p>
                  )}

                  {pkg.includedServices.length > 0 && (
                    <div className="mt-5">
                      <p className="og-eyebrow !text-[8px]">Included services</p>
                      <ul className="mt-2.5 space-y-1.5">
                        {pkg.includedServices.slice(0, 6).map((service) => (
                          <li key={`${pkg.id}-${service}`} className="flex items-start gap-2 text-[11px] text-white/65">
                            <Diamond className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#D4AF37]" />
                            <span className="min-w-0 break-words">{service}</span>
                          </li>
                        ))}
                        {pkg.includedServices.length > 6 && (
                          <li className="text-[11px] text-white/35">+{pkg.includedServices.length - 6} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {pkg.benefits.length > 0 && (
                    <ul className="mt-5 space-y-2.5">
                      {pkg.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2.5 text-xs text-white/65">
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#D4AF37]" /> {benefit}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto flex flex-col gap-2 pt-7">
                    <button
                      type="button"
                      onClick={() => handleBook(selectedServices, { pkg, staffId: preferredStaffId || undefined })}
                      className="og-btn og-btn-primary w-full"
                    >
                      Book this package <ArrowUpRight className="h-4 w-4" />
                    </button>
                    {data.contact.whatsappUrl && (
                      <a
                        href={`${data.contact.whatsappUrl.split('?')[0]}?text=${encodeURIComponent(
                          `Hi ${data.name}, I would like to enquire about the ${pkg.name || 'membership'} package.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="og-btn og-btn-ghost w-full"
                      >
                        <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
                      </a>
                    )}
                  </div>
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
              <button type="button" onClick={checkAvailability} className="og-btn og-btn-ghost">
                <CalendarDays className="h-4 w-4" /> Check live availability
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
              <label className="og-eyebrow !text-[9px]" htmlFor={`${uid}-booking-services`}>
                01 · Services{' '}
                <span className="text-white/35">
                  ({selectedServices.length}/{data.services.length} selected)
                </span>
              </label>
              <div
                id={`${uid}-booking-services`}
                className="og-scroll mt-3 flex max-h-[188px] flex-wrap gap-2 overflow-y-auto pr-1"
              >
                {data.services.length > 0 ? (
                  data.services.map((service) => {
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
                onClick={checkAvailability}
                className="mt-3 flex w-full items-center justify-between rounded-sm border border-[#D4AF37]/25 bg-[#0E0E0E] px-4 py-3 text-left text-xs text-white/65 transition-colors hover:border-[#D4AF37]/60"
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#D4AF37]" />
                  {isPreview ? 'Browse demo availability' : 'Pick a date & live time slot'}
                </span>
                <ArrowUpRight className="h-4 w-4 text-[#D4AF37]" />
              </button>
              <p className="mt-2 text-[10px] leading-relaxed text-white/35">
                {isPreview
                  ? 'Template preview shows sample availability only.'
                  : 'Live availability is confirmed on the booking page from the salon calendar.'}
              </p>
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
              Your selected services and specialist are carried into the booking page, where real dates and time slots are confirmed.
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
              <button type="button" onClick={checkAvailability} className="og-btn og-btn-ghost mt-8">
                <CalendarDays className="h-4 w-4" /> {isPreview ? 'Check demo availability' : 'Check availability'}
              </button>
              <p className="mt-3 text-[10px] leading-relaxed text-white/35">
                {isPreview
                  ? 'Template preview uses sample slots.'
                  : 'Real slots are confirmed on the booking page from the salon calendar.'}
              </p>
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
                    aria-current={activeSection === item.key ? 'true' : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollTo(item.key);
                    }}
                    className={`text-xs transition-colors hover:text-[#F5D77A] ${
                      activeSection === item.key ? 'text-[#F5D77A]' : 'text-white/55'
                    }`}
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
                    onClick={() => {
                      setActiveCategory('all');
                      setServiceQuery(service.name);
                      scrollTo('services');
                    }}
                    className="max-w-full truncate text-left text-xs text-white/55 transition-colors hover:text-[#F5D77A]"
                  >
                    {service.name}
                  </button>
                ))}
                {data.services.length > 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      setServiceQuery('');
                      scrollTo('services');
                    }}
                    className="text-xs text-[#D4AF37]/80 transition-colors hover:text-[#F5D77A]"
                  >
                    All {data.services.length} services →
                  </button>
                )}
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
              <button
                type="button"
                onClick={() => handleBook(selectedServices, { staffId: preferredStaffId || undefined })}
                className="og-btn og-btn-ghost mt-6 !min-h-[40px] !px-4"
              >
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

      {/* ── Sticky selection summary ─────────────────── */}
      {selectedServices.length > 0 && (
        <div
          className={`fixed bottom-0 z-40 w-full ${
            constrainedWidth ? 'left-1/2 max-w-[430px] -translate-x-1/2' : 'left-0 right-0'
          }`}
        >
          <div className="border-t border-[#D4AF37]/40 bg-[#101010]/97 px-3 py-3 shadow-[0_-18px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:px-6">
            <div className="mx-auto flex max-w-[1320px] flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#F5D77A]">
                  <Scissors className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="og-eyebrow !text-[8px]">Selected services</p>
                  <p className="mt-1 truncate text-[11px] text-white/85 sm:text-xs">
                    {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} ·{' '}
                    {selectedServices.map((service) => service.name).join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-5">
                <div className="text-left sm:text-right">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Total price</p>
                  <p className="font-playfair text-base text-[#F5D77A]">{formatPrice(totalPrice)}</p>
                </div>
                <div className="h-8 w-px bg-[#D4AF37]/25" />
                <div className="text-left sm:text-right">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/40">Duration</p>
                  <p className="font-playfair text-base text-white">{totalDuration > 0 ? `${totalDuration} min` : '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-sm border border-white/15 text-white/60 transition-colors hover:border-[#D4AF37]/60 hover:text-[#F5D77A]"
                    aria-label="Clear selected services"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBook(selectedServices, { staffId: preferredStaffId || undefined })}
                    className="og-btn og-btn-primary !min-h-[42px] !px-4 sm:!px-5"
                  >
                    Continue Booking <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile sticky booking CTA ────────────────── */}
      {selectedServices.length === 0 && (
        <div
          className={`fixed bottom-0 z-30 transition-all duration-300 md:hidden ${
            stickyVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
          } ${constrainedWidth ? 'left-1/2 w-full max-w-[430px] -translate-x-1/2' : 'left-0 right-0'}`}
        >
          <div className="border-t border-[#D4AF37]/35 bg-[#101010]/96 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="og-eyebrow !text-[8px]">Reservations</p>
                <p className="mt-1 truncate text-xs text-white/80">{data.name}</p>
              </div>
              <button
                type="button"
                onClick={() => handleBook([], { staffId: preferredStaffId || undefined })}
                className="og-btn og-btn-primary !min-h-[42px] !px-5"
              >
                <CalendarDays className="h-4 w-4" /> Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating concierge chat ──────────────────── */}
      <div
        className={`fixed z-40 ${
          constrainedWidth ? 'right-3' : 'right-3 sm:right-5'
        } ${selectedServices.length > 0 ? 'bottom-[8.5rem] md:bottom-24' : 'bottom-[5.5rem] md:bottom-6'}`}
      >
        {chatOpen && (
          <div className="mb-3 flex h-[420px] w-[min(90vw,340px)] flex-col overflow-hidden rounded-sm border border-[#D4AF37]/35 bg-[#0F0F0F]/98 shadow-[0_30px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#D4AF37]/25 bg-[#141414] px-4 py-3">
              <div className="min-w-0">
                <p className="font-playfair text-sm text-white">Salon Concierge</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-[#D4AF37]/80">
                  Automated assistant · not a human agent
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                aria-label="Close chat"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-white/10 text-white/60 transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="og-scroll flex-1 space-y-3 overflow-y-auto px-3.5 py-3">
              <div className="rounded-sm border border-[#D4AF37]/20 bg-[#1A1A1A] px-3 py-2.5 text-[11px] leading-relaxed text-white/75">
                Namaste. I am the automated assistant for {data.name}. I can share the service menu, opening hours,
                offers and location. For anything else, use WhatsApp or call the salon.
              </div>
              {chatMessages.map((message, index) => (
                <div
                  key={`chat-${index}`}
                  className={`max-w-[85%] whitespace-pre-line rounded-sm px-3 py-2.5 text-[11px] leading-relaxed ${
                    message.from === 'user'
                      ? 'ml-auto border border-[#D4AF37]/35 bg-[#D4AF37]/12 text-[#F5D77A]'
                      : 'border border-white/10 bg-[#161616] text-white/75'
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 border-t border-white/10 px-3 py-2">
              {['Services & prices', 'Opening hours', 'Book an appointment', 'Location'].map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendChat(question)}
                  className="rounded-sm border border-[#D4AF37]/25 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-white/60 transition-colors hover:border-[#D4AF37]/60 hover:text-[#F5D77A]"
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-white/10 px-3 py-2.5">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    sendChat(chatInput);
                  }
                }}
                placeholder="Ask about services, hours…"
                aria-label="Chat message"
                className="min-w-0 flex-1 rounded-sm border border-white/10 bg-[#0A0A0A] px-3 py-2 text-[11px] text-white placeholder:text-white/30 focus:border-[#D4AF37]/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => sendChat(chatInput)}
                disabled={!chatInput.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm bg-[#D4AF37] text-[#0A0A0A] transition-opacity disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {data.contact.whatsappUrl && (
              <a
                href={`${data.contact.whatsappUrl.split('?')[0]}?text=${encodeURIComponent(`Hi ${data.name}, I have a question.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border-t border-[#D4AF37]/25 bg-[#141414] py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5D77A] transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0A]"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Continue on WhatsApp
              </a>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setChatOpen((open) => !open)}
          aria-expanded={chatOpen}
          aria-label={chatOpen ? 'Minimise live chat' : 'Open live chat'}
          className="ml-auto flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#101010] text-[#F5D77A] shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-transform hover:scale-105"
        >
          {chatOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </button>
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

      {/* ── Stylist portfolio modal ──────────────────── */}
      {portfolioStaff && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${portfolioStaff.name} portfolio`}
          onClick={() => setPortfolioStaff(null)}
        >
          <div
            className="og-scroll max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-sm border border-[#D4AF37]/40 bg-[#0F0F0F] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.8)] sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="og-eyebrow">Stylist portfolio</p>
                <h3 className="mt-2 font-playfair text-2xl text-white">{portfolioStaff.name}</h3>
                {portfolioStaff.role && (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#D4AF37]/80">{portfolioStaff.role}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPortfolioStaff(null)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border border-white/15 text-white/65 transition-colors hover:text-white"
                aria-label="Close portfolio"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {portfolioStaff.portfolioPhotos.length === 0 ? (
              <div className="mt-6 rounded-sm border border-white/10 bg-[#151515] px-5 py-12 text-center">
                <Eye className="mx-auto h-7 w-7 text-[#D4AF37]/45" />
                <p className="mt-4 font-playfair text-lg text-white">No portfolio published yet</p>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-white/45">
                  {portfolioStaff.name} has not shared personal work on this website. Salon gallery photos are never
                  presented as this stylist&apos;s portfolio.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-5 overflow-hidden rounded-sm border border-[#D4AF37]/20 bg-[#0A0A0A]">
                  <img
                    src={portfolioStaff.portfolioPhotos[portfolioIndex]}
                    alt={`${portfolioStaff.name} work ${portfolioIndex + 1}`}
                    className="max-h-[52vh] w-full object-contain"
                  />
                </div>
                {portfolioStaff.portfolioPhotos.length > 1 && (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setPortfolioIndex(
                          (index) =>
                            (index - 1 + portfolioStaff.portfolioPhotos.length) % portfolioStaff.portfolioPhotos.length
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#D4AF37]/35 text-[#F5D77A] transition-colors hover:bg-[#D4AF37]/10"
                      aria-label="Previous portfolio image"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="og-scroll flex flex-1 justify-center gap-2 overflow-x-auto">
                      {portfolioStaff.portfolioPhotos.map((photo, index) => (
                        <button
                          key={`${photo}-${index}`}
                          type="button"
                          onClick={() => setPortfolioIndex(index)}
                          className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-sm border ${
                            index === portfolioIndex ? 'border-[#D4AF37]' : 'border-white/10 opacity-60'
                          }`}
                          aria-label={`Portfolio image ${index + 1}`}
                        >
                          <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPortfolioIndex((index) => (index + 1) % portfolioStaff.portfolioPhotos.length)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#D4AF37]/35 text-[#F5D77A] transition-colors hover:bg-[#D4AF37]/10"
                      aria-label="Next portfolio image"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-[#D4AF37]/20 pt-5">
              <button
                type="button"
                onClick={() => {
                  const member = portfolioStaff;
                  setPortfolioStaff(null);
                  handleBook(selectedServices, { staffId: member.id });
                }}
                className="og-btn og-btn-primary"
              >
                <CalendarDays className="h-4 w-4" /> Book with {portfolioStaff.name.split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => {
                  const member = portfolioStaff;
                  setPortfolioStaff(null);
                  openStylistInquiry(member);
                }}
                className="og-btn og-btn-ghost"
              >
                <MessageSquare className="h-4 w-4" /> Chat with stylist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stylist inquiry interface ────────────────── */}
      {inquiryStaff && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Message ${inquiryStaff.name}`}
          onClick={() => setInquiryStaff(null)}
        >
          <div
            className="w-full max-w-lg rounded-sm border border-[#D4AF37]/40 bg-[#0F0F0F] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.8)] sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="og-eyebrow">Direct inquiry</p>
                <h3 className="mt-2 font-playfair text-xl text-white">Message {inquiryStaff.name}</h3>
                {inquiryStaff.role && (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#D4AF37]/80">{inquiryStaff.role}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInquiryStaff(null)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm border border-white/15 text-white/65 transition-colors hover:text-white"
                aria-label="Close inquiry"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={inquiryMessage}
              onChange={(event) => setInquiryMessage(event.target.value)}
              rows={4}
              aria-label="Your message to the stylist"
              className="og-scroll mt-5 w-full rounded-sm border border-white/12 bg-[#0A0A0A] px-3.5 py-3 text-xs leading-relaxed text-white focus:border-[#D4AF37]/60 focus:outline-none"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {stylistInquiryWhatsApp(inquiryStaff) ? (
                <a
                  href={stylistInquiryWhatsApp(inquiryStaff)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="og-btn og-btn-primary"
                >
                  <MessageCircle className="h-4 w-4" /> Send on WhatsApp
                </a>
              ) : (
                <span className="rounded-sm border border-[#D4AF37]/25 bg-[#1C1C1C] px-3.5 py-2 text-[10px] uppercase tracking-[0.14em] text-white/50">
                  No direct number published
                </span>
              )}
              <button type="button" onClick={copyInquiry} className="og-btn og-btn-ghost">
                <Copy className="h-4 w-4" /> Copy message
              </button>
              {inquiryStaff.phone && (
                <a href={`tel:${inquiryStaff.phone}`} className="og-btn og-btn-quiet">
                  <Phone className="h-4 w-4" /> Call
                </a>
              )}
            </div>

            <p className="mt-4 text-[10px] leading-relaxed text-white/35">
              This opens your own WhatsApp with the message pre-filled. Replies arrive from the stylist or the salon —
              there is no separate in-app messenger.
            </p>

            <button
              type="button"
              onClick={() => {
                const member = inquiryStaff;
                setInquiryStaff(null);
                handleBook(selectedServices, { staffId: member.id });
              }}
              className="og-btn og-btn-ghost mt-4 w-full"
            >
              <CalendarDays className="h-4 w-4" /> Book with {inquiryStaff.name.split(' ')[0]}
            </button>
          </div>
        </div>
      )}

      {/* ── Video player ─────────────────────────────── */}
      {videoIndex !== null && data.videos[videoIndex] && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Salon video"
          onClick={() => setVideoIndex(null)}
        >
          <div
            className="w-full max-w-4xl rounded-sm border border-[#D4AF37]/40 bg-[#0F0F0F] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.85)] sm:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3">
              <p className="og-eyebrow">
                {data.videos[videoIndex].kind === 'youtube' ? 'YouTube' : 'Salon film'}
              </p>
              <button
                type="button"
                onClick={() => setVideoIndex(null)}
                className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/15 text-white/65 transition-colors hover:text-white"
                aria-label="Close video"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {data.videos[videoIndex].kind === 'file' ? (
              <video
                key={data.videos[videoIndex].url}
                src={data.videos[videoIndex].url}
                poster={data.videos[videoIndex].thumbnail || undefined}
                controls
                playsInline
                className="aspect-video w-full rounded-sm bg-black"
              />
            ) : data.videos[videoIndex].embedUrl ? (
              <iframe
                title={data.videos[videoIndex].title || `${data.name} video`}
                src={data.videos[videoIndex].embedUrl}
                className="aspect-video w-full rounded-sm bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-sm border border-white/10 bg-[#121212] text-center">
                <PlayCircle className="h-10 w-10 text-[#D4AF37]/60" />
                <p className="max-w-sm px-6 text-xs leading-relaxed text-white/55">
                  This video is hosted on an external platform that cannot be embedded here.
                </p>
                <a
                  href={data.videos[videoIndex].watchUrl || data.videos[videoIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="og-btn og-btn-primary"
                >
                  <ArrowUpRight className="h-4 w-4" /> Watch on the platform
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Booking calendar (template preview only) ─── */}
      {isPreview && (
        <MultiViewBookingCalendarModal
          isOpen={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          shopId={data.shopId}
          shopName={data.name}
          openingTime={shop?.opening_time}
          closingTime={shop?.closing_time}
          onConfirm={handleCalendarConfirm}
          demoMode
        />
      )}
    </div>
  );
}

export default ObsidianGoldLuxury;
