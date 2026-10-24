import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Button } from '@/components/ui/button';

const OFFERS = [
  { id: 1, title: 'Seasonal Glow Package', desc: 'Get 20% off on premium facial & hair spa services.', color: 'from-amber-500 to-amber-700' },
  { id: 2, title: 'New User Special', desc: 'First booking? Get flat ₹100 off on your first salon visit.', color: 'from-blue-500 to-blue-700' },
  { id: 3, title: 'Referral Bonus', desc: 'Invite friends and earn ₹50 cashback on every successful booking.', color: 'from-emerald-500 to-emerald-700' },
];

export function FeaturedOffersCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-4">
        {OFFERS.map((offer) => (
          <div key={offer.id} className="flex-[0_0_100%] sm:flex-[0_0_80%] md:flex-[0_0_60%] lg:flex-[0_0_40%]">
            <div className={`rounded-3xl p-6 bg-gradient-to-r ${offer.color} text-white`}>
              <h3 className="font-playfair font-bold text-2xl mb-2">{offer.title}</h3>
              <p className="text-white/80 text-sm mb-6">{offer.desc}</p>
              <Button variant="secondary" size="sm" className="bg-white text-black font-bold">
                Claim Offer
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
