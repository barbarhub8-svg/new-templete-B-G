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
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmedName = customerName.trim();
    const trimmedComment = comment.trim();
    if (trimmedName.length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    if (trimmedComment.length < 5) {
      setError('Please write at least a few words about your experience.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setError('Please choose a rating between 1 and 5 stars.');
      return;
    }

    try {
      setLoading(true);
      await addReview({
        shop_id: shopId,
        // A review is only linked to a booking when one is passed in from the
        // booking confirmation flow. Reviews never fabricate a booking id.
        customer_name: trimmedName,
        rating,
        comment: trimmedComment,
      });
      setComment('');
      setCustomerName('');
      setRating(5);
      toast({ title: 'Review posted', description: 'Thank you for sharing your experience.' });
      onReviewAdded();
    } catch (err: any) {
      const message = err?.message || 'Your review could not be saved. Please try again.';
      setError(message);
      toast({ title: 'Review not saved', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const reviewList = Array.isArray(reviews) ? reviews : [];

  return (
    <div className="space-y-6">
      {displayReviews && reviewList.length === 0 && (
        <div className="rounded-sm border border-[#D4AF37]/20 bg-[#1C1C1C] px-5 py-8 text-center">
          <p className="font-playfair text-lg text-white">No reviews yet</p>
          <p className="mt-2 text-xs text-white/40">
            This salon has not received any published reviews. Be the first to share your experience.
          </p>
        </div>
      )}

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
            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] leading-relaxed text-red-300" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
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
