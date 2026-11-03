import React, { useEffect, useState } from 'react';
import { X, Monitor, Smartphone, Sparkles, ArrowRight, MapPin, Clock, Phone, Star, Copy, Check, Crown, Tag } from 'lucide-react';
import { SalonTemplate } from './TemplateShowcaseModal';
import { MeetTheStylistSection } from './MeetTheStylistSection';
import { ReviewsSection } from './ReviewsSection';
import { MultiViewBookingCalendarModal } from './MultiViewBookingCalendarModal';
import { SocialPortfolioSection } from './SocialPortfolioSection';
import { ObsidianGoldLuxury, OBSIDIAN_GOLD_TEMPLATE_ID } from '../templates/ObsidianGoldLuxury';
import {
  OBSIDIAN_GOLD_PREVIEW_SHOP,
  OBSIDIAN_GOLD_PREVIEW_STAFF,
} from '../templates/obsidianGoldPreviewData';
import {
  TEMPLATE_PREVIEW_BRANDS,
  TEMPLATE_PREVIEW_THEMES,
  formatINR,
  type TemplatePreviewBrand,
  type TemplatePreviewTheme,
} from '../templates/templatePreviewData';
import { useToast } from '../../hooks/use-toast';

interface TemplateLivePreviewModalProps {
  isOpen: boolean;
  template: SalonTemplate | null;
  onClose: () => void;
  onSelectAndRegister: (templateId: string) => void;
}

export function TemplateLivePreviewModal({
  isOpen,
  template,
  onClose,
  onSelectAndRegister,
}: TemplateLivePreviewModalProps) {
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    setDevice('desktop');
  }, [template?.id]);

  if (!isOpen || !template) return null;

  // ── TEMPLATE 01: complete Obsidian Gold Luxury website preview ──────────
  if (template.id === OBSIDIAN_GOLD_TEMPLATE_ID) {
    return (
      <div className="og-scroll fixed inset-0 z-[90] overflow-y-auto bg-[#050505] font-sans animate-in fade-in duration-200">
        {/* Preview controls (kept above the website's own sticky navigation) */}
        <div className="sticky top-0 z-[45] flex h-14 w-full items-center justify-between gap-3 border-b border-[#D4AF37]/30 bg-[#0D0D0D]/96 px-3 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-playfair text-[13px] font-bold text-white sm:text-sm">
                Live Preview · {template.name}
              </p>
              <p className="hidden text-[9px] uppercase tracking-[0.24em] text-[#D4AF37]/70 sm:block">
                The Royal Turban Barber & Co. · C-Scheme, Jaipur
              </p>
            </div>
            <span className="hidden flex-shrink-0 rounded-sm border border-[#D4AF37]/35 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#F5D77A] md:inline">
              Demo Data
            </span>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <div className="hidden items-center gap-1 rounded-sm border border-white/10 bg-black/40 p-1 sm:flex">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                aria-label="Desktop layout"
                aria-pressed={device === 'desktop'}
                className={`flex h-7 w-8 items-center justify-center rounded-sm transition-colors ${
                  device === 'desktop' ? 'bg-[#D4AF37] text-[#0A0A0A]' : 'text-white/55 hover:text-white'
                }`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                aria-label="Mobile layout"
                aria-pressed={device === 'mobile'}
                className={`flex h-7 w-8 items-center justify-center rounded-sm transition-colors ${
                  device === 'mobile' ? 'bg-[#D4AF37] text-[#0A0A0A]' : 'text-white/55 hover:text-white'
                }`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onSelectAndRegister(template.id)}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-[#D4AF37] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A0A0A] transition-colors hover:bg-[#F5D77A] sm:px-5 sm:text-[11px]"
            >
              <span className="hidden sm:inline">Use This Template</span>
              <span className="sm:hidden">Use</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/15 text-white/70 transition-colors hover:border-[#D4AF37]/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* The full, scrollable website. Mobile mode simulates a phone viewport. */}
        {device === 'mobile' ? (
          <div className="flex justify-center bg-[#050505] px-0 py-0 sm:py-6">
            <div className="w-full max-w-[430px] border-x border-[#D4AF37]/20 shadow-[0_0_80px_rgba(0,0,0,0.9)]">
              <ObsidianGoldLuxury
                shop={OBSIDIAN_GOLD_PREVIEW_SHOP}
                staffList={OBSIDIAN_GOLD_PREVIEW_STAFF}
                isPreview
                previewOffset
                constrainedWidth
              />
            </div>
          </div>
        ) : (
          <ObsidianGoldLuxury
            shop={OBSIDIAN_GOLD_PREVIEW_SHOP}
            staffList={OBSIDIAN_GOLD_PREVIEW_STAFF}
            isPreview
            previewOffset
          />
        )}
      </div>
    );
  }

  // ── TEMPLATES 02–04: localized Indian luxury brand previews ─────────────
  const brand = TEMPLATE_PREVIEW_BRANDS[template.id];
  const theme = TEMPLATE_PREVIEW_THEMES[template.id];
  if (!brand || !theme) return null;

  return (
    <LocalizedTemplatePreview
      template={template}
      brand={brand}
      theme={theme}
      calendarOpen={showCalendarModal}
      setCalendarOpen={setShowCalendarModal}
      onClose={onClose}
      onSelectAndRegister={onSelectAndRegister}
    />
  );
}

// =====================================================
// Shared localized preview for Minimalist Modern Black,
// Royal Velvet Spa & Salon and Chic Bohemian Glow.
// Each theme keeps its own visual identity while the
// content stays fully synchronized: elite Indian brands,
// INR service menus and festival privilege codes.
// =====================================================
function LocalizedTemplatePreview({
  template,
  brand,
  theme,
  calendarOpen,
  setCalendarOpen,
  onClose,
  onSelectAndRegister,
}: {
  template: SalonTemplate;
  brand: TemplatePreviewBrand;
  theme: TemplatePreviewTheme;
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
  onClose: () => void;
  onSelectAndRegister: (templateId: string) => void;
}) {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState('');

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({ title: 'Coupon copied', description: `${code} — apply it when booking your ritual.` });
      window.setTimeout(() => setCopiedCode(''), 2500);
    } catch {
      toast({ title: code, description: 'Use this code when booking.' });
    }
  };

  const initials = brand.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${theme.page} text-white ${theme.bodyFont} animate-in fade-in duration-200`}>
      {/* Promotional festival banner */}
      <div className={`border-b ${theme.border} ${theme.accentSoftBg} px-4 py-2 text-center`}>
        <p className={`text-[11px] sm:text-xs font-semibold ${theme.accentText} inline-flex flex-wrap items-center justify-center gap-2`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{brand.announcement.text}</span>
          <button
            type="button"
            onClick={() => copyCode(brand.announcement.code)}
            className={`inline-flex items-center gap-1.5 rounded-md border border-dashed ${theme.accentBorder} px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] transition-opacity hover:opacity-80`}
          >
            {copiedCode === brand.announcement.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedCode === brand.announcement.code ? 'COPIED' : brand.announcement.code}
          </button>
        </p>
      </div>

      {/* Navigation */}
      <div className={`sticky top-0 z-50 ${theme.nav} backdrop-blur-xl border-b ${theme.border} px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 flex-shrink-0 ${theme.radius} ${theme.accentSoftBg} border ${theme.accentBorder} flex items-center justify-center ${theme.accentText} font-bold text-sm ${theme.headingFont}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className={`truncate text-sm sm:text-base font-bold text-white ${theme.headingFont}`}>{brand.name}</p>
            <p className={`truncate text-[10px] uppercase tracking-[0.18em] ${theme.eyebrow}`}>
              Live Preview · {template.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => onSelectAndRegister(template.id)}
            className={`px-4 sm:px-6 py-2.5 ${theme.radius} ${theme.accentBg} font-bold text-xs sm:text-sm transition-all hover:scale-105`}
          >
            Use This Template
          </button>
          <button onClick={onClose} aria-label="Close preview" className={`p-2.5 ${theme.radius} text-white/60 hover:text-white border ${theme.border}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 space-y-14 sm:space-y-16">
        {/* Hero Section */}
        <section className={`relative overflow-hidden ${theme.radius} ${theme.card}`}>
          <img src={brand.heroImage} alt={brand.name} className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className={`absolute inset-0 bg-gradient-to-t ${theme.heroGradient}`} />
          <div className="relative z-10 flex flex-col items-center text-center px-6 py-14 sm:px-12 sm:py-20">
            <p className={`text-[10px] sm:text-xs uppercase tracking-[0.3em] ${theme.eyebrow} mb-4`}>{brand.welcome}</p>
            <h1 className={`text-3xl sm:text-5xl font-bold mb-4 ${theme.headingFont} max-w-3xl`}>{brand.name}</h1>
            <p className={`text-base sm:text-xl mb-3 ${theme.accentText} ${theme.headingFont} italic`}>{brand.tagline}</p>
            <p className="text-sm text-white/60 max-w-2xl leading-relaxed mb-8">{brand.description}</p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-[11px] sm:text-xs text-white/70">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${theme.radius} ${theme.accentSoftBg} border ${theme.border}`}>
                <MapPin className={`w-3.5 h-3.5 ${theme.accentText}`} /> {brand.address}, {brand.city}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${theme.radius} ${theme.accentSoftBg} border ${theme.border}`}>
                <Star className={`w-3.5 h-3.5 fill-current ${theme.accentText}`} /> {brand.rating.toFixed(1)} · {brand.reviewCount} reviews
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${theme.radius} ${theme.accentSoftBg} border ${theme.border}`}>
                <Clock className={`w-3.5 h-3.5 ${theme.accentText}`} /> {brand.hours}
              </span>
            </div>

            <button
              onClick={() => setCalendarOpen(true)}
              className={`px-8 py-4 ${theme.radius} ${theme.accentBg} font-bold text-sm sm:text-base transition-all hover:scale-105`}
            >
              Reserve Your Royal Appointment
            </button>
          </div>
        </section>

        {/* Signature services */}
        <section>
          <div className="mb-6">
            <p className={`text-[10px] uppercase tracking-[0.28em] ${theme.eyebrow} mb-2`}>The Signature Menu</p>
            <h2 className={`text-2xl sm:text-3xl font-bold ${theme.headingFont}`}>Rituals & Privileges</h2>
            <p className="text-sm text-white/50 mt-2 max-w-2xl">
              High-end Indian grooming and wellness, curated by our master professionals. All prices in INR, inclusive of our warm hospitality.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {brand.services.map((service) => (
              <div key={service.id} className={`${theme.radius} ${theme.card} p-5 sm:p-6 flex flex-col justify-between gap-4`}>
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className={`font-bold text-white text-sm sm:text-base leading-snug ${theme.headingFont}`}>{service.name}</h3>
                    <span className={`flex-shrink-0 font-bold text-base sm:text-lg ${theme.accentText}`}>{formatINR(service.price)}</span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{service.description}</p>
                </div>
                <div className={`flex items-center justify-between pt-3 border-t ${theme.border}`}>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50">
                    <Clock className="w-3.5 h-3.5" /> {service.duration_minutes} mins · {service.category}
                  </span>
                  <button
                    onClick={() => setCalendarOpen(true)}
                    className={`px-4 py-2 ${theme.radius} ${theme.accentSoftBg} border ${theme.accentBorder} ${theme.accentText} text-xs font-bold transition-all hover:scale-105`}
                  >
                    Book Ritual
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Festival offers */}
        <section>
          <div className="mb-6">
            <p className={`text-[10px] uppercase tracking-[0.28em] ${theme.eyebrow} mb-2`}>Festive Privileges</p>
            <h2 className={`text-2xl sm:text-3xl font-bold ${theme.headingFont}`}>Season of Celebration Offers</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {brand.offers.map((offer) => (
              <div key={offer.id} className={`${theme.radius} ${theme.card} p-5 flex flex-col justify-between gap-4`}>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${theme.accentSoftBg} ${theme.accentText} border ${theme.accentBorder} mb-3`}>
                    <Tag className="w-3 h-3" /> {offer.badge}
                  </span>
                  <h3 className={`font-bold text-white text-sm mb-1.5 ${theme.headingFont}`}>{offer.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{offer.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyCode(offer.code)}
                  className={`inline-flex items-center justify-center gap-2 px-3 py-2 ${theme.radius} border border-dashed ${theme.accentBorder} text-xs font-bold tracking-[0.14em] ${theme.accentText} transition-colors hover:opacity-80`}
                >
                  {copiedCode === offer.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode === offer.code ? 'COPIED' : offer.code}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Master professionals */}
        <MeetTheStylistSection staffList={brand.staff as any} shopId="preview" shopName={brand.name} />

        {/* Guest reviews */}
        <ReviewsSection shopId="preview" reviews={brand.reviews} onReviewAdded={() => {}} displayReviews hideForm />

        {/* Portfolio */}
        <SocialPortfolioSection shopName={brand.name} portfolioPhotos={[]} />

        {/* Contact footer */}
        <footer className={`${theme.radius} ${theme.card} p-6 sm:p-8`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] ${theme.eyebrow} mb-2`}>
                <Crown className="w-3.5 h-3.5" /> Atithi Devo Bhava
              </p>
              <h3 className={`text-xl font-bold ${theme.headingFont} mb-1`}>{brand.name}</h3>
              <p className="text-xs text-white/50">{brand.category}</p>
            </div>
            <div className="space-y-2 text-xs text-white/60">
              <p className="flex items-center gap-2"><MapPin className={`w-3.5 h-3.5 ${theme.accentText}`} /> {brand.address}, {brand.city}</p>
              <p className="flex items-center gap-2"><Phone className={`w-3.5 h-3.5 ${theme.accentText}`} /> {brand.phone}</p>
              <p className="flex items-center gap-2"><Clock className={`w-3.5 h-3.5 ${theme.accentText}`} /> {brand.hours}</p>
            </div>
          </div>
          <p className={`mt-6 pt-4 border-t ${theme.border} text-[10px] text-white/35 text-center`}>
            Demo preview with sample data · Register your salon to publish this theme with your own brand, services and privileges.
          </p>
        </footer>
      </div>

      <MultiViewBookingCalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        shopId="preview"
        shopName={brand.name}
        onConfirm={(date, time) => {
          setCalendarOpen(false);
          toast({
            title: 'Preview reservation selected',
            description: `${date} · ${time} — register your salon to accept real bookings.`,
          });
        }}
      />
    </div>
  );
}
