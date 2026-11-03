import React, { useState } from 'react';
import { X, ArrowRight, Star, MapPin, Clock, Scissors, Tag } from 'lucide-react';
import { SalonTemplate } from './TemplateShowcaseModal';
import { MeetTheStylistSection } from './MeetTheStylistSection';
import { ReviewsSection } from './ReviewsSection';
import { ClientTestimonialsSection } from './ClientTestimonialsSection';
import { MultiViewBookingCalendarModal } from './MultiViewBookingCalendarModal';
import { SocialPortfolioSection } from './SocialPortfolioSection';

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

  if (!isOpen || !template) return null;

  // Mock data for preview
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
    }
  ] as any;

  const sampleReviews = [
    { id: 'r1', customer_name: 'Karan M.', rating: 5, comment: 'Excellent!', created_at: new Date().toISOString() }
  ];

  // Template-specific styles
  const styles = {
    obsidian: {
      bg: 'bg-[#0A0A0A]',
      text: 'text-white',
      accent: 'text-gold',
      border: 'border-gold/30',
      font: 'font-serif',
      card: 'bg-[#141414] border border-gold/20 shadow-xl'
    },
    minimalist: {
      bg: 'bg-white',
      text: 'text-black',
      accent: 'text-black',
      border: 'border-black',
      font: 'font-sans',
      card: 'bg-white border-2 border-black shadow-none'
    },
    velvet: {
      bg: 'bg-[#2E1A2E]',
      text: 'text-white',
      accent: 'text-pink-300',
      border: 'border-pink-500/30',
      font: 'font-sans',
      card: 'bg-[#3d243d] border border-pink-500/50 shadow-2xl rounded-3xl'
    }
  };

  const currentStyle = (template.id === 'obsidian' ? styles.obsidian : 
                        template.id === 'minimalist' ? styles.minimalist : 
                        styles.velvet);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${currentStyle.bg} ${currentStyle.text} overflow-y-auto animate-in fade-in duration-200 ${currentStyle.font}`}>
      {/* Promotional Top Banner */}
      <div className={`bg-gradient-to-r from-gold/20 via-gold/30 to-gold/20 border-b ${currentStyle.border} text-gold text-xs font-semibold py-2 px-4 text-center`}>
        🎉 Special Offer: Use promo code GLOW20 for 20% OFF!
      </div>

      {/* Navigation */}
      <div className={`sticky top-0 z-50 ${currentStyle.bg}/95 backdrop-blur-xl border-b ${currentStyle.border} px-6 py-4 flex items-center justify-between`}>
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
        <section className={`rounded-3xl p-12 ${currentStyle.card} flex flex-col items-center text-center`}>
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
