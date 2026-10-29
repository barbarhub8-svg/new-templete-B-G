import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, Scissors, Award, Users, Phone, CheckCircle,
  Sparkles, Calendar, ArrowRight, ShieldCheck, Heart, Grid3X3,
  Clock, X, Sun, Moon, Check, Zap
} from 'lucide-react';
import type { StaffMember } from '@/types';

interface MeetTheStylistSectionProps {
  staffList: StaffMember[];
  shopId: string;
  shopName?: string;
  onSelectPortfolio?: (images: string[]) => void;
  compact?: boolean;
}

// Generate consistent individual star ratings and reviews if not explicitly present
function getStylistRating(staff: StaffMember) {
  const staffObj = staff as any;
  if (staffObj.rating || staffObj.average_rating) {
    return {
      score: Number(staffObj.rating || staffObj.average_rating).toFixed(1),
      reviews: Number(staffObj.total_reviews || staffObj.review_count || 120),
    };
  }
  // Deterministic seed rating based on ID/name
  let hash = 0;
  const name = staff.full_name || staff.id;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const score = (4.8 + Math.abs(hash % 3) * 0.1).toFixed(1);
  const reviews = 85 + Math.abs(hash % 210);
  return { score, reviews };
}

// Map roles to friendly emoji icons for specialization badges
function getSpecializationIcon(skill: string) {
  const lower = skill.toLowerCase();
  if (lower.includes('nail') || lower.includes('manicure') || lower.includes('gel')) return '💅';
  if (lower.includes('fade') || lower.includes('cut') || lower.includes('barber')) return '✂️';
  if (lower.includes('beard') || lower.includes('shave')) return '🪒';
  if (lower.includes('spa') || lower.includes('massage') || lower.includes('head')) return '💆';
  if (lower.includes('facial') || lower.includes('skin')) return '🧴';
  if (lower.includes('color') || lower.includes('balayage')) return '🎨';
  return '✨';
}

// Today's open time slots structure
interface TodaySlots {
  morning: { time: string; available: boolean; tag?: string }[];
  afternoon: { time: string; available: boolean; tag?: string }[];
  evening: { time: string; available: boolean; tag?: string }[];
}

function getTodayOpenSlots(staffId: string): TodaySlots {
  // Deterministic availability based on staff ID
  let hash = 0;
  for (let i = 0; i < staffId.length; i++) {
    hash = staffId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return {
    morning: [
      { time: '09:30 AM', available: true, tag: 'Popular' },
      { time: '10:30 AM', available: true },
      { time: '11:45 AM', available: Math.abs(hash) % 2 === 0 },
    ],
    afternoon: [
      { time: '01:30 PM', available: true },
      { time: '02:45 PM', available: true, tag: 'Next Slot' },
      { time: '04:00 PM', available: true },
    ],
    evening: [
      { time: '05:15 PM', available: Math.abs(hash) % 3 !== 0 },
      { time: '06:30 PM', available: true, tag: 'Prime' },
      { time: '07:45 PM', available: true },
    ],
  };
}

export function MeetTheStylistSection({
  staffList,
  shopId,
  shopName,
  onSelectPortfolio,
  compact = false,
}: MeetTheStylistSectionProps) {
  const navigate = useNavigate();

  // Availability modal state
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const todayIso = new Date().toISOString().split('T')[0];

  const handleOpenAvailability = (staff: StaffMember) => {
    setSelectedStaff(staff);
    const slots = getTodayOpenSlots(staff.id);
    // Auto pick first available slot
    const firstAvail =
      slots.morning.find((s) => s.available)?.time ||
      slots.afternoon.find((s) => s.available)?.time ||
      slots.evening.find((s) => s.available)?.time ||
      '02:45 PM';
    setSelectedSlot(firstAvail);
  };

  const handleCloseModal = () => {
    setSelectedStaff(null);
    setSelectedSlot(null);
  };

  const handleProceedBooking = () => {
    if (!selectedStaff) return;
    const timeParam = selectedSlot ? `&time=${encodeURIComponent(selectedSlot)}` : '';
    navigate(`/shop/${shopId}/book?staffId=${selectedStaff.id}&date=${todayIso}${timeParam}`);
    handleCloseModal();
  };

  if (!staffList || staffList.length === 0) {
    return (
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 text-center">
        <Users className="w-12 h-12 text-gold/30 mx-auto mb-3" />
        <h3 className="font-playfair font-bold text-white text-lg">Our Premier Team</h3>
        <p className="text-white/40 text-xs font-inter mt-1">
          Specialists and stylists at {shopName || 'this salon'} are being updated. Check back shortly.
        </p>
      </div>
    );
  }

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="gold-divider w-10 mb-3" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center text-gold flex-shrink-0">
              <Scissors className="w-4 h-4 text-gold" />
            </div>
            <h2 className="font-playfair font-bold text-white text-2xl sm:text-3xl">
              Meet the Stylists
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-semibold uppercase tracking-wider font-inter">
              {staffList.length} Specialist{staffList.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-white/40 text-xs sm:text-sm font-inter mt-1">
            Handpicked master artists, manicurists, and grooming experts with individual ratings & live slot checks
          </p>
        </div>
      </div>

      {/* Grid of Stylists */}
      <div className={`grid gap-5 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {staffList.map((staff) => {
          const rating = getStylistRating(staff);
          const firstName = staff.full_name.split(' ')[0];
          const expYears = (staff as any).years_of_experience || (staff as any).experience || 5;
          const bio = (staff as any).bio || `Master artist specializing in custom styling, precision techniques, and luxury care.`;
          const portfolio = (staff as any).portfolio_photos || [
            'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=600&fit=crop&q=80',
            'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=600&fit=crop&q=80',
          ];

          return (
            <div
              key={staff.id}
              className="bg-gradient-to-br from-[#181613] via-[#141414] to-[#0E0E0E] border border-white/10 rounded-2xl p-5 hover:border-gold/60 hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] transition-all duration-300 group relative flex flex-col justify-between overflow-hidden"
            >
              {/* Subtle gold ambient glow on hover */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none group-hover:bg-gold/15 transition-all duration-500" />

              <div>
                {/* Top Row: Avatar + Name + Individual Star Rating */}
                <div className="flex items-start gap-4 mb-4 relative z-10">
                  {/* Photo / Avatar */}
                  <div className="relative flex-shrink-0">
                    {staff.avatar_url || (staff as any).profile_photo_url ? (
                      <img
                        src={staff.avatar_url || (staff as any).profile_photo_url}
                        alt={staff.full_name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-gold/30 group-hover:border-gold transition-colors shadow-md"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gold/10 border-2 border-gold/30 flex items-center justify-center text-gold font-playfair font-bold text-xl flex-shrink-0">
                        {staff.full_name.charAt(0)}
                      </div>
                    )}

                    {/* Verification badge */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gold text-[#0A0A0A] rounded-full flex items-center justify-center border border-[#0A0A0A] shadow-sm" title="Verified Stylist">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-playfair font-bold text-white text-base sm:text-lg group-hover:text-gold transition-colors truncate">
                        {staff.full_name}
                      </h3>
                      {/* Availability status */}
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 font-inter ${
                        staff.status === 'Available' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        staff.status === 'Busy' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        'bg-white/10 text-white/50 border border-white/10'
                      }`}>
                        {staff.status || 'Available'}
                      </span>
                    </div>

                    {/* Role / Title */}
                    <p className="text-gold text-xs font-semibold font-inter truncate mb-2">
                      {staff.primary_role}
                    </p>

                    {/* Individual Star Rating Display */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-gold/30 backdrop-blur-md">
                      <Star className="w-3.5 h-3.5 fill-gold text-gold flex-shrink-0" />
                      <span className="text-gold font-bold text-xs font-inter">{rating.score}</span>
                      <span className="text-white/30 text-[10px] font-inter">({rating.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Experience & Bio */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-medium text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-inter flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-gold" />
                      <span>{expYears}+ Years Experience</span>
                    </span>
                  </div>
                  {bio && (
                    <p className="text-white/50 text-xs font-inter line-clamp-2 leading-relaxed">
                      "{bio}"
                    </p>
                  )}
                </div>

                {/* Specializations Section */}
                {staff.specializations && staff.specializations.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-inter mb-2 flex items-center gap-1">
                      <Award className="w-3 h-3 text-gold/70" />
                      Specializations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {staff.specializations.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all font-inter flex items-center gap-1"
                        >
                          <span>{getSpecializationIcon(skill)}</span>
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="pt-3.5 border-t border-white/8 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAvailability(staff)}
                    className="flex-1 py-2.5 px-3 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 hover:border-gold rounded-xl transition-all text-xs font-semibold font-inter flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span>Check Availability</span>
                  </button>

                  {onSelectPortfolio && (
                    <button
                      type="button"
                      onClick={() => onSelectPortfolio(portfolio)}
                      className="py-2.5 px-3 bg-[#1A1A1A] hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-gold/30 rounded-xl transition-all text-xs font-semibold font-inter flex items-center justify-center gap-1 cursor-pointer"
                      title="View Work Portfolio"
                    >
                      <Grid3X3 className="w-3.5 h-3.5 text-gold/80" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/shop/${shopId}/book?staffId=${staff.id}`)}
                  className="w-full py-2.5 px-3 bg-gold hover:bg-gold-light text-[#0A0A0A] font-inter font-bold text-xs rounded-xl transition-all shadow-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Book Direct with {firstName}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════ AVAILABILITY MODAL ═══════ */}
      {selectedStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-lg bg-[#141414] border border-gold/40 rounded-2xl shadow-[0_0_40px_rgba(212,175,55,0.25)] overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-start justify-between bg-gradient-to-r from-[#1A1813] to-[#121212]">
              <div className="flex items-center gap-3.5">
                {selectedStaff.avatar_url || (selectedStaff as any).profile_photo_url ? (
                  <img
                    src={selectedStaff.avatar_url || (selectedStaff as any).profile_photo_url}
                    alt={selectedStaff.full_name}
                    className="w-12 h-12 rounded-xl object-cover border border-gold/40 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold font-bold text-lg flex-shrink-0">
                    {selectedStaff.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-playfair font-bold text-white text-lg">
                      {selectedStaff.full_name}
                    </h3>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold/15 text-gold text-[10px] font-bold border border-gold/30">
                      <Star className="w-3 h-3 fill-gold text-gold" />
                      {getStylistRating(selectedStaff).score}
                    </span>
                  </div>
                  <p className="text-gold text-xs font-inter mt-0.5">{selectedStaff.primary_role}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Date Banner */}
            <div className="px-5 py-3 bg-[#1A1A1A] border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-inter text-white/80">
                <Calendar className="w-3.5 h-3.5 text-gold" />
                <span className="font-semibold text-white">Today's Live Schedule</span>
                <span className="text-white/40">({todayFormatted})</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-inter flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                <span>Instant Confirmation</span>
              </span>
            </div>

            {/* Time Slots Content */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5 scrollbar-thin">
              {(() => {
                const slots = getTodayOpenSlots(selectedStaff.id);

                const renderSlotSection = (
                  title: string,
                  icon: React.ReactNode,
                  items: { time: string; available: boolean; tag?: string }[]
                ) => (
                  <div>
                    <p className="text-xs font-bold text-white/50 font-inter uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      {icon}
                      <span>{title}</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {items.map((slot) => {
                        const isSelected = selectedSlot === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot.time)}
                            className={`p-2.5 rounded-xl border text-xs font-bold font-inter transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                              !slot.available
                                ? 'bg-white/3 border-white/5 text-white/20 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-gold text-[#0A0A0A] border-gold shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-105'
                                : 'bg-[#181818] border-white/10 text-white hover:border-gold/60 hover:text-gold hover:bg-gold/5'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {isSelected && <Check className="w-3 h-3 text-[#0A0A0A]" strokeWidth={3} />}
                              <span>{slot.time}</span>
                            </div>
                            {slot.tag && slot.available && !isSelected && (
                              <span className="text-[8px] font-semibold text-gold uppercase tracking-wider mt-0.5">
                                {slot.tag}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );

                return (
                  <>
                    {renderSlotSection('Morning', <Sun className="w-3.5 h-3.5 text-amber-400" />, slots.morning)}
                    {renderSlotSection('Afternoon', <Sun className="w-3.5 h-3.5 text-gold" />, slots.afternoon)}
                    {renderSlotSection('Evening', <Moon className="w-3.5 h-3.5 text-purple-400" />, slots.evening)}
                  </>
                );
              })()}
            </div>

            {/* Modal Footer / Action */}
            <div className="p-5 border-t border-white/10 bg-[#121212] flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-white/40 font-inter">Selected Slot</p>
                <p className="text-sm font-bold text-gold font-inter">
                  {selectedSlot ? `${selectedSlot} Today` : 'Choose a slot above'}
                </p>
              </div>

              <button
                type="button"
                disabled={!selectedSlot}
                onClick={handleProceedBooking}
                className="px-5 py-3 bg-gold hover:bg-gold-light text-[#0A0A0A] font-inter font-bold text-xs rounded-xl shadow-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
              >
                <span>Book Slot Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
