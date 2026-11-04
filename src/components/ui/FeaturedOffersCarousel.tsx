import { useToast } from '@/hooks/use-toast';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight,Check,ChevronLeft,ChevronRight,Copy,Gift,Sparkles,Tag,Users } from 'lucide-react';
import { useCallback,useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OfferItem {
  id: number;
  badge: string;
  discount: string;
  title: string;
  desc: string;
  code: string;
  icon: typeof Sparkles;
  category: string;
}

const OFFERS: OfferItem[] = [
  {
    id: 1,
    badge: 'DIWALI DARBAR',
    discount: '20% OFF',
    title: 'Diwali Festive Glow Rituals',
    desc: 'Light up the season — 20% off Ayurvedic champi therapy, ubtan glow facials and signature grooming rituals.',
    code: 'DIWALI20',
    icon: Sparkles,
    category: 'Festive Wellness',
  },
  {
    id: 2,
    badge: 'SHAADI SEASON',
    discount: '30% OFF',
    title: 'Pre-Wedding Royal Groom Package',
    desc: 'Big day, royal look — 30% off the complete groom transformation: cut, shahi beard sculpt and gold leaf glow.',
    code: 'SHAADI30',
    icon: Gift,
    category: 'Wedding Privilege',
  },
  {
    id: 3,
    badge: 'FESTIVE PAIRING',
    discount: 'FREE UBTAN GLOW',
    title: 'Cut & Champi Pairing Treat',
    desc: 'Pair any designer cut with champi therapy and receive a complimentary ubtan glow ritual — our festive gift to you.',
    code: 'FESTIVEGLOW',
    icon: Users,
    category: 'Festive Pairing',
  },
];

export function FeaturedOffersCarousel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: 'Coupon Copied!',
      description: `Code "${code}" is copied to clipboard. Apply at checkout.`,
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="relative w-full my-1">
      {/* Header title & controls */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-gold" />
          <span className="text-gold text-[11px] font-semibold tracking-[0.2em] uppercase font-inter">
            Featured Packages & Promotions
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous offer"
            className="w-7 h-7 rounded-lg bg-[#141414]/90 border border-white/10 hover:border-gold/40 text-white/50 hover:text-gold flex items-center justify-center transition-all duration-200"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next offer"
            className="w-7 h-7 rounded-lg bg-[#141414]/90 border border-white/10 hover:border-gold/40 text-white/50 hover:text-gold flex items-center justify-center transition-all duration-200"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embla Viewport */}
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex -ml-3">
          {OFFERS.map((offer) => {
            const Icon = offer.icon;
            return (
              <div
                key={offer.id}
                className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-3 min-w-0"
              >
                {/* Compact Luxury Dark & Gold Card with Gold-Glow Tactile Hover Effect */}
                <div className="group relative bg-gradient-to-br from-[#181612]/95 via-[#141414]/95 to-[#0D0D0D]/95 backdrop-blur-md border border-gold/25 hover:border-gold/70 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:gold-glow overflow-hidden cursor-pointer">
                  {/* Subtle Background Glow */}
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gold/5 rounded-full blur-xl pointer-events-none group-hover:bg-gold/15 transition-all duration-500" />

                  {/* Top Row: Badge & Discount Pill */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-gold/10 text-gold border border-gold/30">
                        <Icon className="w-2.5 h-2.5 text-gold" />
                        {offer.badge}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-gold text-[#0A0A0A] shadow-gold">
                        {offer.discount}
                      </span>
                    </div>

                    <h3 className="font-playfair font-bold text-white text-sm sm:text-base mb-1 leading-snug group-hover:text-gold-light transition-colors">
                      {offer.title}
                    </h3>
                    <p className="text-white/60 text-[11px] sm:text-xs font-inter leading-relaxed line-clamp-2 mb-2.5">
                      {offer.desc}
                    </p>
                  </div>

                  {/* Bottom Row: Coupon Code & Claim CTA */}
                  <div className="relative z-10 pt-2.5 border-t border-white/8 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleCopyCode(offer.code, e)}
                      title="Click to copy coupon code"
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0A0A0A]/80 border border-white/12 hover:border-gold/40 text-[10px] sm:text-xs text-white/70 font-mono transition-all group/code"
                    >
                      <span className="text-white/40 text-[9px] uppercase font-inter font-semibold">Code:</span>
                      <span className="text-gold font-bold">{offer.code}</span>
                      {copiedCode === offer.code ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-white/40 group-hover/code:text-gold transition-colors" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/salons')}
                      className="px-3 py-1.5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-[11px] rounded-lg shadow-gold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1 font-inter whitespace-nowrap"
                    >
                      Claim Offer <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
