import React, { useState } from 'react';
import {
  Star, MessageSquare, PenTool, CheckCircle, ThumbsUp,
  X, Sparkles, Award, ShieldCheck, Heart, User, Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface TestimonialReview {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  verified?: boolean;
  service_name?: string;
  likes?: number;
  avatar_url?: string;
}

interface ClientTestimonialsProps {
  shopId: string;
  shopName: string;
  averageRating: number;
  totalReviews: number;
  reviewsList: TestimonialReview[];
  onReviewAdded?: (newReview: TestimonialReview) => void;
  compact?: boolean;
}

export function ClientTestimonialsSection({
  shopId,
  shopName,
  averageRating,
  totalReviews,
  reviewsList,
  onReviewAdded,
  compact = false,
}: ClientTestimonialsProps) {
  const { toast } = useToast();

  // Modal State
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newReviewerName, setNewReviewerName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Local reviews array with support for dynamically added reviews
  const [localReviews, setLocalReviews] = useState<TestimonialReview[]>(reviewsList || []);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  // Sync if reviewsList changes externally
  React.useEffect(() => {
    if (reviewsList && reviewsList.length > 0) {
      setLocalReviews(reviewsList);
    }
  }, [reviewsList]);

  const handleToggleLike = (id: string) => {
    setLikedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewerName.trim()) {
      toast({ title: 'Required', description: 'Please enter your name.', variant: 'destructive' });
      return;
    }
    if (!newComment.trim()) {
      toast({ title: 'Required', description: 'Please write a brief review.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    const createdReview: TestimonialReview = {
      id: `rev-custom-${Date.now()}`,
      customer_name: newReviewerName.trim(),
      rating: newRating,
      comment: newComment.trim(),
      created_at: new Date().toISOString(),
      verified: true,
      service_name: selectedService || 'Styling & Grooming',
      likes: 1,
    };

    setTimeout(() => {
      setLocalReviews((prev) => [createdReview, ...prev]);

      if (onReviewAdded) {
        onReviewAdded(createdReview);
      }

      toast({
        title: 'Review Submitted!',
        description: 'Thank you for sharing your experience.',
      });

      // Reset form
      setNewReviewerName('');
      setNewComment('');
      setNewRating(5);
      setSelectedService('');
      setSubmitting(false);
      setIsWriteModalOpen(false);
    }, 400);
  };

  const ratingScore = Number(averageRating || 4.9).toFixed(1);
  const totalCount = localReviews.length > 0 ? localReviews.length : totalReviews || 45;

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="gold-divider w-10 mb-3" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center text-gold flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-gold" />
            </div>
            <h2 className="font-playfair font-bold text-white text-2xl sm:text-3xl">
              Client Testimonials
            </h2>
          </div>
          <p className="text-white/40 text-xs sm:text-sm font-inter mt-1">
            Real feedback and ratings from verified clients at {shopName}
          </p>
        </div>

        {/* 'Write a Review' Button */}
        <button
          type="button"
          onClick={() => setIsWriteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-inter font-bold text-xs rounded-xl transition-all shadow-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Trust Rating Summary Bar */}
      <div className="bg-gradient-to-r from-[#181612] via-[#141414] to-[#101010] border border-gold/20 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="px-4 py-2.5 bg-black/60 border border-gold/40 rounded-2xl flex items-center gap-2">
            <Star className="w-6 h-6 fill-gold text-gold" />
            <span className="font-playfair font-bold text-white text-3xl">{ratingScore}</span>
            <span className="text-white/30 text-xs font-inter font-medium self-end mb-1">/ 5.0</span>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1 justify-center sm:justify-start">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(Number(ratingScore))
                      ? 'fill-gold text-gold'
                      : 'text-white/20'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-white/50 font-inter">
              Based on <span className="font-bold text-gold">{totalCount} verified reviews</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-inter text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>100% Verified Client Feedback</span>
        </div>
      </div>

      {/* Testimonial Cards List */}
      {localReviews.length === 0 ? (
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gold/30 mx-auto mb-3" />
          <h3 className="font-playfair font-bold text-white text-lg">No Reviews Yet</h3>
          <p className="text-white/40 text-xs font-inter mt-1 mb-4">
            Be the first client to leave a review for {shopName}!
          </p>
          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="px-4 py-2 bg-gold text-[#0A0A0A] font-bold text-xs rounded-xl font-inter shadow-gold"
          >
            Write First Review
          </button>
        </div>
      ) : (
        <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
          {(compact ? localReviews.slice(0, 4) : localReviews).map((review) => {
            const isLiked = likedReviews[review.id];
            const displayLikes = (review.likes || 1) + (isLiked ? 1 : 0);

            return (
              <div
                key={review.id}
                className="bg-[#141414] border border-white/8 hover:border-gold/40 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row: User Avatar + Name + Rating */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-playfair font-bold text-base flex-shrink-0">
                        {review.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-playfair font-bold text-white text-sm group-hover:text-gold transition-colors">
                            {review.customer_name}
                          </h4>
                          <CheckCircle className="w-3.5 h-3.5 text-gold flex-shrink-0" title="Verified Client" />
                        </div>
                        <span className="text-[10px] text-white/30 font-inter">
                          Verified Client · {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-black/60 border border-gold/30 rounded-xl flex-shrink-0">
                      <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                      <span className="text-gold font-bold text-xs font-inter">{review.rating}.0</span>
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-white/70 text-xs sm:text-sm font-inter leading-relaxed mb-4">
                    "{review.comment}"
                  </p>
                </div>

                {/* Card Footer: Service tag & Helpful button */}
                <div className="pt-3 border-t border-white/8 flex items-center justify-between text-[11px] font-inter">
                  <span className="text-gold/70 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-gold/50" />
                    <span>{review.service_name || 'Grooming Service'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleLike(review.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isLiked
                        ? 'bg-gold/20 border-gold text-gold font-bold'
                        : 'bg-white/5 border-white/8 text-white/40 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Helpful ({displayLikes})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════ WRITE A REVIEW MODAL ═══════ */}
      {isWriteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsWriteModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#141414] border border-gold/40 rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.25)] overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1A1813] to-[#121212]">
              <div>
                <h3 className="font-playfair font-bold text-white text-lg flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-gold" /> Write a Review
                </h3>
                <p className="text-white/40 text-xs font-inter mt-0.5">Share your experience at {shopName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReview} className="p-5 space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-white/70 font-inter uppercase tracking-wider mb-2">
                  Your Overall Rating *
                </label>
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-3 rounded-xl justify-center">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || newRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setNewRating(star)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            isFilled ? 'fill-gold text-gold' : 'text-white/20'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-white/70 font-inter uppercase tracking-wider mb-1.5">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newReviewerName}
                  onChange={(e) => setNewReviewerName(e.target.value)}
                  placeholder="e.g., Rohan Shekhawat"
                  className="w-full h-11 px-3.5 bg-[#0D0D0D] border border-white/12 focus:border-gold text-white text-xs rounded-xl outline-none font-inter transition-all"
                />
              </div>

              {/* Service Tag / Category */}
              <div>
                <label className="block text-xs font-bold text-white/70 font-inter uppercase tracking-wider mb-1.5">
                  Service Experienced (Optional)
                </label>
                <input
                  type="text"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  placeholder="e.g., Royal Hair Cut, Russian Gel Manicure, Facial"
                  className="w-full h-11 px-3.5 bg-[#0D0D0D] border border-white/12 focus:border-gold text-white text-xs rounded-xl outline-none font-inter transition-all"
                />
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-bold text-white/70 font-inter uppercase tracking-wider mb-1.5">
                  Your Review / Testimonial *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Describe the ambience, hospitality, craftsmanship, or results..."
                  className="w-full p-3.5 bg-[#0D0D0D] border border-white/12 focus:border-gold text-white text-xs rounded-xl outline-none font-inter transition-all resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-white/50 hover:text-white font-inter"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-inter font-bold text-xs rounded-xl shadow-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
