import React, { useEffect, useState } from 'react';
import { X, Monitor, Smartphone, Sparkles, ArrowRight } from 'lucide-react';
import { SalonTemplate } from './TemplateShowcaseModal';
import { MeetTheStylistSection } from './MeetTheStylistSection';
import { ReviewsSection } from './ReviewsSection';
import { ClientTestimonialsSection } from './ClientTestimonialsSection';
import { MultiViewBookingCalendarModal } from './MultiViewBookingCalendarModal';
import { SocialPortfolioSection } from './SocialPortfolioSection';
import { ObsidianGoldLuxury, OBSIDIAN_GOLD_TEMPLATE_ID } from '../templates/ObsidianGoldLuxury';
import {
  OBSIDIAN_GOLD_PREVIEW_SHOP,
  OBSIDIAN_GOLD_PREVIEW_STAFF,
} from '../templates/obsidianGoldPreviewData';

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
                Full website · Demo data
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

  // ── Remaining templates: existing generic showcase preview (unchanged) ──
  const sampleServices = [
    { id: 's1', name: 'Signature Haircut', price: 1200, duration_minutes: 45, is_active: true },
    { id: 's2', name: 'Beard Sculpting', price: 800, duration_minutes: 30, is_active: true },
  ];

  const sampleStaff = [
    {
      id: 'st1',
      full_name: 'Alexander Vance',
      primary_role: 'Master Stylist',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      status: 'Available',
      specializations: ['Cuts', 'Fade'],
    },
  ] as any;

  const sampleReviews = [
    { id: 'r1', customer_name: 'Karan M.', rating: 5, comment: 'Excellent!', created_at: new Date().toISOString() },
  ];

  const legacyStyle = {
    bg: 'bg-[#2E1A2E]',
    text: 'text-white',
    accent: 'text-pink-300',
    border: 'border-pink-500/30',
    font: 'font-sans',
    card: 'bg-[#3d243d] border border-pink-500/50 shadow-2xl rounded-3xl',
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${legacyStyle.bg} ${legacyStyle.text} overflow-y-auto animate-in fade-in duration-200 ${legacyStyle.font}`}>
      {/* Promotional Top Banner */}
      <div className={`bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 border-b ${legacyStyle.border} text-gold text-xs font-semibold py-2 px-4 text-center`}>
        🎉 Special Offer: Use promo code GLOW20 for 20% OFF!
      </div>

      {/* Navigation */}
      <div className={`sticky top-0 z-50 ${legacyStyle.bg}/95 backdrop-blur-xl border-b ${legacyStyle.border} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-bold text-lg">N</div>
          <div>
            <div className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30">Live Preview: {template.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onSelectAndRegister(template.id)} className="px-6 py-2.5 rounded-xl bg-gold text-[#0A0A0A] font-bold text-sm shadow-gold transition-all hover:scale-105">Use This Template</button>
          <button onClick={onClose} className="p-2.5 rounded-xl text-white/60 hover:text-white border border-white/15">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 space-y-16">
        {/* Hero Section */}
        <section className={`rounded-3xl p-12 ${legacyStyle.card} flex flex-col items-center text-center`}>
          <h1 className={`text-5xl font-bold mb-4`}>Welcome to {template.name}</h1>
          <p className={`text-xl mb-8`}>The ultimate dark luxury experience for your salon.</p>
          <button onClick={() => setShowCalendarModal(true)} className="px-8 py-4 bg-gold text-black font-bold rounded-xl">Book Now</button>
        </section>

        <MeetTheStylistSection staffList={sampleStaff} shopId="preview" />
        <ReviewsSection shopId="preview" reviews={sampleReviews} onReviewAdded={() => {}} />
        <SocialPortfolioSection shopName={template.name} portfolioPhotos={[]} />
      </div>

      <MultiViewBookingCalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        shopId="preview"
        shopName={template.name}
      />
    </div>
  );
}
