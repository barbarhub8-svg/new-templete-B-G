import React, { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { addReview } from '../../lib/api';

interface ReviewsSectionProps {
  shopId: string;
  reviews: any[];
  onReviewAdded: () => void;
  /** Opt-in: display the actual shop reviews alongside the post-a-review form. */
  displayReviews?: boolean;
  /** Opt-in: hide the submission form (used by read-only template previews). */
  hideForm?: boolean;
}

function reviewDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ReviewsSection({
  shopId,
  reviews,
  onReviewAdded,
  displayReviews = false,
  hideForm = false,
}: ReviewsSectionProps) {
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

  const reviewList = Array.isArray(reviews) ? reviews : [];

  return (
    <div className="space-y-6">
      {displayReviews && reviewList.length > 0 && (
        <div>
          <h3 className="font-playfair font-bold text-white text-xl">What Our Clients Say</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviewList.map((review: any, index: number) => (
              <div
                key={review?.id || `review-${index}`}
                className="rounded-sm border border-[#D4AF37]/20 bg-[#1C1C1C] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 font-playfair text-sm font-bold text-[#D4AF37]">
                      {(review?.customer_name || review?.name || 'G').charAt(0).toUpperCase()}
                    </div>
                    <p className="truncate text-sm font-semibold text-white">
                      {review?.customer_name || review?.name || 'Guest'}
                    </p>
                  </div>
                  {reviewDate(review?.created_at || review?.date) && (
                    <span className="flex-shrink-0 text-[10px] text-white/35">
                      {reviewDate(review?.created_at || review?.date)}
                    </span>
                  )}
                </div>
                {Number(review?.rating) > 0 && (
                  <div className="mt-3 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i <= Number(review.rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-white/20'}`}
                      />
                    ))}
                  </div>
                )}
                {(review?.comment || review?.review) && (
                  <p className="mt-3 text-xs leading-relaxed text-[#A1A1AA]">{review?.comment || review?.review}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hideForm && (
        <div className={displayReviews && reviewList.length > 0 ? 'border-t border-[#D4AF37]/20 pt-8' : ''}>
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
      )}
    </div>
  );
}
