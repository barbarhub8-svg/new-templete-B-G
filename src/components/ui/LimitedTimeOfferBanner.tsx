import { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight, Tag, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OFFERS = [
  {
    code: 'FESTIVE20',
    title: 'Festive Luxury Offer',
    description: 'Flat 20% OFF on all Jaipur Palace & Premier Salon Bookings',
    tag: '20% OFF',
  },
  {
    code: 'ROYALSPA',
    title: 'Royal Grooming Combo',
    description: 'Complimentary Hair Spa with any Skin Fade & Beard Trim package',
    tag: 'FREE SPA',
  },
  {
    code: 'BRIDAL15',
    title: 'Festive Wedding Special',
    description: '15% Cashback on Bridal & Groom pre-wedding makeover packages',
    tag: '15% CASHBACK',
  },
];

export function LimitedTimeOfferBanner() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Auto rotate offers every 6 seconds
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setCurrentOfferIndex((prev) => (prev + 1) % OFFERS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const currentOffer = OFFERS[currentOfferIndex];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="relative z-50 bg-gradient-to-r from-[#0d0d0d] via-[#1c170b] to-[#0d0d0d] border-b border-gold/30 text-white shadow-2xl transition-all duration-500 animate-in slide-in-from-top-full">
      {/* Decorative Gold Shimmer Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />

      <div className="w-full px-4 sm:px-8 lg:px-12 py-2.5 sm:py-3 flex items-center justify-between gap-3 text-xs sm:text-sm font-inter">
        
        {/* Left Side: Festive Badge & Offer Info */}
        <div className="flex items-center gap-2.5 sm:gap-4 overflow-hidden">
          {/* Animated Gold Sparkle Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[11px] font-semibold uppercase tracking-wider flex-shrink-0 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Limited Time</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gold/20 text-gold font-bold text-[11px] sm:hidden flex-shrink-0">
            <Tag className="w-3 h-3" />
            <span>{currentOffer.tag}</span>
          </div>

          {/* Offer Details with subtle transition */}
          <div className="flex items-center gap-2 truncate">
            <span className="hidden md:inline font-playfair font-bold text-gold text-sm">
              {currentOffer.title}:
            </span>
            <span className="text-white/90 truncate font-medium">
              {currentOffer.description}
            </span>
          </div>
        </div>

        {/* Right Side: Promo Code CTA & Close */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
          {/* Promo code badge button */}
          <button
            type="button"
            onClick={() => handleCopyCode(currentOffer.code)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-gold/30 hover:border-gold text-white text-xs font-mono transition-all group"
            title="Click to copy promo code"
          >
            <span className="text-white/50 text-[10px]">CODE:</span>
            <span className="font-bold text-gold tracking-wider group-hover:scale-105 transition-transform">
              {copiedCode === currentOffer.code ? 'COPIED! ✓' : currentOffer.code}
            </span>
          </button>

          {/* CTA Link */}
          <button
            type="button"
            onClick={() => navigate('/salons')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-lg bg-gold/10 hover:bg-gold/20 border border-gold/40 hover:border-gold text-gold font-semibold text-xs transition-all whitespace-nowrap"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Close Banner */}
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
