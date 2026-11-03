import React, { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { addReview } from '../../lib/api';

interface ReviewsSectionProps {
  shopId: string;
  reviews: any[];
  onReviewAdded: () => void;
}

export function ReviewsSection({ shopId, reviews, onReviewAdded }: ReviewsSectionProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName || !comment) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      await addReview({
        shop_id: shopId,
        booking_id: 'temp-booking-id', // Assuming booking_id is required, ideally this should come from a context
        customer_name: customerName,
        rating,
        comment,
      });
      setComment('');
      setCustomerName('');
      setRating(5);
      toast({ title: 'Success', description: 'Review posted!' });
      onReviewAdded();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="font-playfair font-bold text-white text-xl">Post a Review</h3>
      <form onSubmit={handleSubmit} className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => setRating(i)} className="focus:outline-none">
              <Star className={`w-6 h-6 ${i <= rating ? 'fill-gold text-gold' : 'text-white/20'}`} />
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Your name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
        />
        <textarea
          placeholder="Your review"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white text-sm h-24"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Post Review</span>
        </button>
      </form>
    </div>
  );
}
