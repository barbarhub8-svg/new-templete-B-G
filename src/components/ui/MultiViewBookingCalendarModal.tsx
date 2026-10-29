import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X,
  Check, ArrowRight, Sun, Moon, Zap, Users, Sparkles, CheckCircle,
  BarChart2, Layers
} from 'lucide-react';

interface MultiViewBookingCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  openingTime?: string;
  closingTime?: string;
}

type CalendarViewMode = 'day' | 'week';

// Helper to format Date to YYYY-MM-DD
function toIsoDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

// Generate a 7-day array starting from a given date
function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// Deterministic availability generator for days & slots
function getSlotAvailabilityData(dateStr: string) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const openCount = 4 + (Math.abs(hash) % 7); // 4 to 10 open slots
  const status: 'available' | 'filling' | 'busy' =
    openCount >= 8 ? 'available' : openCount >= 5 ? 'filling' : 'busy';

  const timeSlots = [
    { time: '09:00 AM', status: Math.abs(hash) % 3 === 0 ? 'booked' : 'open' },
    { time: '10:15 AM', status: 'open', tag: 'Morning' },
    { time: '11:30 AM', status: 'open' },
    { time: '01:00 PM', status: Math.abs(hash) % 2 === 0 ? 'open' : 'booked' },
    { time: '02:15 PM', status: 'open', tag: 'Next Open' },
    { time: '03:30 PM', status: 'open' },
    { time: '05:00 PM', status: Math.abs(hash) % 4 === 0 ? 'booked' : 'open', tag: 'Prime' },
    { time: '06:15 PM', status: 'open' },
    { time: '07:30 PM', status: 'open' },
  ];

  return { openCount, status, timeSlots };
}

export function MultiViewBookingCalendarModal({
  isOpen,
  onClose,
  shopId,
  shopName,
}: MultiViewBookingCalendarModalProps) {
  const navigate = useNavigate();

  // View state: 'day' | 'week'
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  
  // Selected date object
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Selected slot string e.g. "02:15 PM"
  const [selectedSlot, setSelectedSlot] = useState<string | null>('02:15 PM');

  // Week view start anchor date (defaults to today)
  const [weekAnchorDate, setWeekAnchorDate] = useState<Date>(new Date());

  const weekDays = useMemo(() => getWeekDays(weekAnchorDate), [weekAnchorDate]);

  if (!isOpen) return null;

  const selectedIsoDate = toIsoDateStr(selectedDate);
  const selectedDateAvailability = getSlotAvailabilityData(selectedIsoDate);

  // Week navigation
  const handlePrevWeek = () => {
    const prev = new Date(weekAnchorDate);
    prev.setDate(prev.getDate() - 7);
    setWeekAnchorDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(weekAnchorDate);
    next.setDate(next.getDate() + 7);
    setWeekAnchorDate(next);
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setWeekAnchorDate(today);
    setSelectedDate(today);
  };

  // Day navigation
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleConfirmBooking = () => {
    if (!selectedSlot) return;
    const timeParam = `&time=${encodeURIComponent(selectedSlot)}`;
    navigate(`/shop/${shopId}/book?date=${selectedIsoDate}${timeParam}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#141414] border border-gold/40 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.25)] overflow-hidden text-left flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1B1914] via-[#141414] to-[#121212] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold flex-shrink-0">
              <CalendarIcon className="w-5 h-5 text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-playfair font-bold text-white text-lg sm:text-xl">
                  Live Booking Calendar
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-bold uppercase tracking-wider font-inter">
                  Real-Time
                </span>
              </div>
              <p className="text-white/40 text-xs font-inter mt-0.5">
                Explore availability for <span className="text-gold font-semibold">{shopName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Toggle Bar & Navigation */}
        <div className="px-4 sm:px-5 py-3 bg-[#181818] border-b border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          {/* Day / Week View Mode Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-inter transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-gold text-[#0A0A0A] shadow-gold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Day View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold font-inter transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-gold text-[#0A0A0A] shadow-gold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Week View</span>
            </button>
          </div>

          {/* Date Range Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gold text-xs font-semibold rounded-lg font-inter transition-all cursor-pointer flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-gold" />
              <span>Today</span>
            </button>

            <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-0.5">
              <button
                type="button"
                onClick={viewMode === 'week' ? handlePrevWeek : handlePrevDay}
                className="w-7 h-7 text-white/60 hover:text-gold hover:bg-white/5 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-white px-2 font-inter min-w-[120px] text-center">
                {viewMode === 'week' ? (
                  `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                ) : (
                  selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                )}
              </span>

              <button
                type="button"
                onClick={viewMode === 'week' ? handleNextWeek : handleNextDay}
                className="w-7 h-7 text-white/60 hover:text-gold hover:bg-white/5 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 scrollbar-thin">
          {/* ═══════ VIEW MODE 1: WEEK VIEW ═══════ */}
          {viewMode === 'week' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-white/50 font-inter uppercase tracking-wider">
                  7-Day Availability Overview
                </p>
                <span className="text-[11px] text-gold font-inter">
                  Tap any day column to focus & view open time slots
                </span>
              </div>

              {/* 7 Columns Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {weekDays.map((day) => {
                  const dayIso = toIsoDateStr(day);
                  const isSelected = selectedIsoDate === dayIso;
                  const isToday = toIsoDateStr(new Date()) === dayIso;
                  const dayData = getSlotAvailabilityData(dayIso);

                  return (
                    <button
                      key={dayIso}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day);
                      }}
                      className={`p-3 rounded-2xl border text-center font-inter transition-all duration-300 flex flex-col justify-between min-h-[120px] relative cursor-pointer group ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#221D12] to-[#161410] border-gold ring-1 ring-gold shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-[1.02]'
                          : 'bg-[#181818] border-white/8 hover:border-gold/50 hover:bg-[#1E1C16]'
                      }`}
                    >
                      {/* Top Day Label */}
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-gold' : 'text-white/60'}`}>
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          {isToday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Today" />
                          )}
                        </div>

                        <p className={`font-playfair font-bold text-lg ${isSelected ? 'text-white' : 'text-white/90'}`}>
                          {day.getDate()}
                        </p>
                      </div>

                      {/* Middle Status Indicator */}
                      <div className="my-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border block truncate font-inter ${
                          dayData.status === 'available'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : dayData.status === 'filling'
                            ? 'bg-gold/15 text-gold border-gold/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}>
                          {dayData.openCount} Open
                        </span>
                      </div>

                      {/* Bottom Quick Indicator */}
                      <p className="text-[9px] text-white/30 font-inter group-hover:text-gold transition-colors">
                        {isSelected ? 'Active Day' : 'Tap to View'}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Time Slots Preview for Currently Selected Date in Week View */}
              <div className="mt-6 pt-5 border-t border-white/10 bg-black/40 p-4 rounded-2xl border border-gold/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold" />
                    <span className="text-xs font-bold text-white font-inter">
                      Available Time Slots for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-inter">
                    {selectedDateAvailability.openCount} Open Slots
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                  {selectedDateAvailability.timeSlots.map((slot) => {
                    const isOpen = slot.status === 'open';
                    const isSelectedSlot = selectedSlot === slot.time;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!isOpen}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold font-inter transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          !isOpen
                            ? 'bg-white/3 border-white/5 text-white/20 cursor-not-allowed line-through'
                            : isSelectedSlot
                            ? 'bg-gold text-[#0A0A0A] border-gold shadow-gold scale-105'
                            : 'bg-[#181818] border-white/10 text-white hover:border-gold/60 hover:text-gold'
                        }`}
                      >
                        {isSelectedSlot && <Check className="w-3 h-3 text-[#0A0A0A]" strokeWidth={3} />}
                        <span>{slot.time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ VIEW MODE 2: DAY TIMELINE VIEW ═══════ */}
          {viewMode === 'day' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-black/40 p-3.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-xs font-bold text-white font-inter">
                    Day Timeline: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <span className="text-xs text-gold font-semibold font-inter">
                  {selectedDateAvailability.openCount} Slots Available
                </span>
              </div>

              {/* Hourly Timeline Schedule */}
              <div className="space-y-2.5">
                {selectedDateAvailability.timeSlots.map((slot, idx) => {
                  const isOpen = slot.status === 'open';
                  const isSelectedSlot = selectedSlot === slot.time;

                  return (
                    <div
                      key={slot.time}
                      onClick={() => {
                        if (isOpen) setSelectedSlot(slot.time);
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                        !isOpen
                          ? 'bg-white/3 border-white/5 opacity-40 cursor-not-allowed'
                          : isSelectedSlot
                          ? 'bg-gold/15 border-gold ring-1 ring-gold shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                          : 'bg-[#181818] border-white/10 hover:border-gold/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border font-bold text-xs font-inter ${
                          isSelectedSlot
                            ? 'bg-gold text-[#0A0A0A] border-gold'
                            : 'bg-black/50 text-gold border-gold/30'
                        }`}>
                          {idx + 1}
                        </div>

                        <div>
                          <p className="font-playfair font-bold text-white text-base leading-tight">
                            {slot.time}
                          </p>
                          <p className="text-[11px] text-white/40 font-inter mt-0.5">
                            {isOpen ? 'Available for instant reservation' : 'Occupied by existing booking'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {slot.tag && isOpen && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gold/10 text-gold border border-gold/30 uppercase tracking-wider font-inter hidden sm:inline">
                            {slot.tag}
                          </span>
                        )}

                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold font-inter ${
                          !isOpen
                            ? 'bg-white/5 text-white/30 border border-white/10'
                            : isSelectedSlot
                            ? 'bg-gold text-[#0A0A0A] shadow-gold'
                            : 'bg-gold/10 text-gold border border-gold/30 hover:bg-gold hover:text-[#0A0A0A]'
                        }`}>
                          {!isOpen ? 'Booked' : isSelectedSlot ? 'Selected' : 'Pick Slot'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#121212] flex items-center justify-between gap-3 flex-shrink-0">
          <div>
            <p className="text-[11px] text-white/40 font-inter">Chosen Slot Reservation</p>
            <p className="text-sm font-bold text-gold font-inter">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} @ {selectedSlot || 'Select a time slot'}
            </p>
          </div>

          <button
            type="button"
            disabled={!selectedSlot}
            onClick={handleConfirmBooking}
            className="px-6 py-3 bg-gold hover:bg-gold-light text-[#0A0A0A] font-inter font-bold text-xs rounded-xl shadow-gold hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <span>Proceed to Booking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
