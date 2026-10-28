import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Star, Clock, Home, Store, ArrowRight, RefreshCw,
  SlidersHorizontal, Check, Zap, ShieldCheck, Heart, User, ChevronRight,
  TrendingUp, Award, Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface RecommendationItem {
  id: string;
  title: string;
  category: string;
  matchReason: string;
  cycleInsight?: string;
  estimatedPrice: number;
  estimatedDuration: string;
  suggestedSalon: string;
  suggestedShopId: string;
  matchScore: number;
  tags: string[];
  homeServiceEligible?: boolean;
  serviceName?: string;
}

const PREFERENCE_OPTIONS = [
  { id: 'skin-fade', label: '✂️ Sharp Fade & Cut', category: 'Hair Cut' },
  { id: 'beard-sculpt', label: '🧔 Beard Sculpting', category: 'Beard Styling' },
  { id: 'hair-spa', label: '💆 Hair Spa & Scalp', category: 'Hair Spa' },
  { id: 'detox-facial', label: '🧴 De-Tan & Facial', category: 'Facial' },
  { id: 'home-service', label: '🏠 Doorstep Service', category: 'Home Service' },
];

export function RecommendedForYou() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([
    'skin-fade',
    'beard-sculpt',
  ]);
  const [serviceSetting, setServiceSetting] = useState<'any' | 'in-shop' | 'home'>('any');
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string>(() => {
    return localStorage.getItem('nexora_customer_email') || 'barbarhub8@gmail.com';
  });
  const [tempEmail, setTempEmail] = useState(customerEmail);

  // Load recommendations from AI endpoint
  const fetchRecommendations = useCallback(async (prefs = selectedPreferences, setting = serviceSetting) => {
    try {
      setLoading(true);

      // Retrieve local booking history if present
      let bookingHistory: any[] = [];
      try {
        const stored = localStorage.getItem('nexora_recent_bookings');
        if (stored) {
          bookingHistory = JSON.parse(stored);
        } else {
          // Provide realistic starter history for personalized cold-start
          bookingHistory = [
            {
              serviceName: 'Modern Skin Fade & Razor Detailing',
              category: 'Hair Cut',
              date: '3 weeks ago',
              price: 450,
              salonName: 'The Royal Barberia',
              serviceType: 'in-shop',
            },
            {
              serviceName: 'Traditional Straight Razor Shave',
              category: 'Beard Styling',
              date: '3 weeks ago',
              price: 350,
              salonName: 'The Royal Barberia',
              serviceType: 'in-shop',
            },
          ];
        }
      } catch (e) {
        console.warn('Could not read stored bookings', e);
      }

      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingHistory,
          preferences: prefs,
          serviceType: setting,
          city: 'Mumbai',
          customerEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.warn('Recommendation fetch notice:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPreferences, serviceSetting, customerEmail]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const togglePreference = (prefId: string) => {
    const updated = selectedPreferences.includes(prefId)
      ? selectedPreferences.filter((p) => p !== prefId)
      : [...selectedPreferences, prefId];
    setSelectedPreferences(updated);
    fetchRecommendations(updated, serviceSetting);
  };

  const handleBookService = (item: RecommendationItem) => {
    // Navigate to salon with service pre-selected
    navigate(`/shop/${item.suggestedShopId}/book`, {
      state: {
        preSelectedServiceName: item.serviceName || item.title,
        recommendedFromAI: true,
      },
    });
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempEmail.trim()) {
      const cleanEmail = tempEmail.trim().toLowerCase();
      setCustomerEmail(cleanEmail);
      localStorage.setItem('nexora_customer_email', cleanEmail);
      setIsPreferenceModalOpen(false);
      fetchRecommendations(selectedPreferences, serviceSetting);
    }
  };

  // Filter items by category tab
  const filteredItems = recommendations.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'hair') return item.category === 'Hair Cut' || item.category === 'Skin Fade';
    if (activeTab === 'beard') return item.category === 'Beard Styling';
    if (activeTab === 'spa') return item.category === 'Hair Spa' || item.category === 'Facial';
    return true;
  });

  return (
    <section className="relative py-16 px-4 sm:px-8 lg:px-12 w-full overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gold/4 rounded-full blur-[100px] pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 border border-gold/30 bg-gold/10 rounded-full px-3.5 py-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
            <span className="text-gold text-xs font-semibold tracking-wider uppercase">
              AI Personal Grooming Concierge
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-playfair font-bold text-white tracking-tight mb-2">
            Recommended <span className="text-gold-gradient italic">for You</span>
          </h2>
          <p className="text-white/60 text-sm max-w-xl font-inter">
            {summary || 'Services curated by AI analyzing your grooming frequency, recent haircuts, and style goals.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPreferenceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181818] border border-white/10 hover:border-gold/40 text-xs text-white/80 hover:text-white transition-all font-inter"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-gold" />
            <span>Preferences</span>
            {customerEmail && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Profile connected" />
            )}
          </button>

          <button
            type="button"
            onClick={() => fetchRecommendations()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-xs font-semibold transition-all font-inter disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>
      </div>

      {/* Grooming Goal Quick Chips */}
      <div className="relative z-10 flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        <span className="text-xs text-white/40 uppercase tracking-widest font-inter whitespace-nowrap mr-1">
          Your Goals:
        </span>
        {PREFERENCE_OPTIONS.map((pref) => {
          const isSelected = selectedPreferences.includes(pref.id);
          return (
            <button
              key={pref.id}
              type="button"
              onClick={() => togglePreference(pref.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-gold text-[#0A0A0A] border-gold font-bold shadow-gold/20 shadow-md'
                  : 'bg-[#141414] text-white/70 border-white/10 hover:border-gold/40 hover:text-white'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              <span>{pref.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-3">
        {[
          { id: 'all', label: 'All Curated Matches' },
          { id: 'hair', label: 'Haircuts & Fades' },
          { id: 'beard', label: 'Beard Sculpting' },
          { id: 'spa', label: 'Spa & Wellness' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all font-inter ${
              activeTab === tab.id
                ? 'bg-gold/15 text-gold border border-gold/30 font-semibold'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-[#121212] border border-white/10 rounded-2xl p-6 h-80 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-6 bg-white/15 rounded w-3/4" />
                <div className="h-16 bg-white/5 rounded-xl w-full" />
              </div>
              <div className="h-10 bg-gold/20 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-[#121212] rounded-2xl border border-white/10">
          <Sparkles className="w-8 h-8 text-gold/40 mx-auto mb-3" />
          <h3 className="text-lg font-playfair font-semibold text-white mb-1">
            No specific matches found in this category
          </h3>
          <p className="text-xs text-white/50 mb-4">
            Try switching to "All Curated Matches" or toggle more grooming preferences above.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('all')}
            className="border-gold/40 text-gold hover:bg-gold/10"
          >
            Show All Suggestions
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative bg-gradient-to-br from-[#161616] via-[#121212] to-[#0D0D0D] border border-gold/25 hover:border-gold/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-gold/10"
            >
              {/* Top Accent Ribbon */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 bg-gold/15 border border-gold/30 text-gold text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-gold" />
                    {item.matchScore}% AI Match
                  </span>
                  {item.homeServiceEligible && (
                    <span className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
                      <Home className="w-2.5 h-2.5" /> Doorstep
                    </span>
                  )}
                </div>

                <Badge variant="outline" className="text-[10px] border-white/15 text-white/50">
                  {item.category}
                </Badge>
              </div>

              {/* Title & Salon */}
              <div className="mb-4">
                <h3 className="text-xl font-playfair font-bold text-white group-hover:text-gold transition-colors leading-snug mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-white/40 flex items-center gap-1.5">
                  <Store className="w-3 h-3 text-gold/70" />
                  <span>Available at:</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/shop/${item.suggestedShopId}`);
                    }}
                    className="text-gold/90 hover:underline cursor-pointer font-medium"
                  >
                    {item.suggestedSalon}
                  </span>
                </p>
              </div>

              {/* AI Why You Need This Box */}
              <div className="bg-[#1C1A16] border border-gold/15 rounded-xl p-3.5 mb-5 relative">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-gold" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gold font-semibold uppercase tracking-wider mb-0.5">
                      Why It Fits You
                    </p>
                    <p className="text-xs text-white/80 leading-relaxed font-inter">
                      {item.matchReason}
                    </p>
                    {item.cycleInsight && (
                      <div className="flex items-center gap-1 text-[11px] text-white/45 mt-2 pt-2 border-t border-white/8">
                        <Clock className="w-3 h-3 text-gold/60 shrink-0" />
                        <span>{item.cycleInsight}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-white/60 border border-white/8"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Price, Duration & Book Action */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 mt-auto">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-white/40 font-inter">From</span>
                    <span className="text-xl font-bold font-playfair text-white">
                      ₹{item.estimatedPrice}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.estimatedDuration}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleBookService(item)}
                  className="bg-gold hover:bg-gold-light active:bg-gold-dark text-[#0A0A0A] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-gold flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Book Slot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preferences & Profile Modal */}
      <Dialog open={isPreferenceModalOpen} onOpenChange={setIsPreferenceModalOpen}>
        <DialogContent className="bg-[#141414] border-gold/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              AI Recommendation Settings
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs">
              Personalize how your AI Grooming Concierge calculates service matches and grooming cycle reminders.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEmail} className="space-y-5 pt-2">
            <div>
              <Label className="text-xs text-white/80 font-medium mb-1.5 block">
                Your Email (for Booking History Sync)
              </Label>
              <div className="relative">
                <Input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="bg-[#1C1C1C] border-white/15 text-white placeholder-white/30 focus-visible:ring-gold"
                />
              </div>
              <p className="text-[11px] text-white/40 mt-1">
                We use your booking history to predict hair growth cycles and recommend timely touchups.
              </p>
            </div>

            <div>
              <Label className="text-xs text-white/80 font-medium mb-2 block">
                Preferred Grooming Setting
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'any', label: 'Any Setting' },
                  { id: 'in-shop', label: 'In-Salon' },
                  { id: 'home', label: 'Doorstep' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServiceSetting(s.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      serviceSetting === s.id
                        ? 'bg-gold/20 border-gold text-gold font-bold'
                        : 'bg-[#1C1C1C] border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-white/80 font-medium mb-2 block">
                Your Focus Styles
              </Label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCE_OPTIONS.map((pref) => {
                  const isChecked = selectedPreferences.includes(pref.id);
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => {
                        const updated = isChecked
                          ? selectedPreferences.filter((p) => p !== pref.id)
                          : [...selectedPreferences, pref.id];
                        setSelectedPreferences(updated);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        isChecked
                          ? 'bg-gold/20 border-gold text-gold font-semibold'
                          : 'bg-[#1C1C1C] border-white/10 text-white/60'
                      }`}
                    >
                      {pref.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPreferenceModalOpen(false)}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold"
              >
                Save & Update Suggestions
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
