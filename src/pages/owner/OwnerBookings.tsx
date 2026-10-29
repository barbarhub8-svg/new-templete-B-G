import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, User, Phone,
  Home, Loader2, IndianRupee, Scissors, Sun, Sunset, Moon,
  ChevronRight, X, Store, Check, ArrowRight, Star, Users
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../hooks/use-toast';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import {
  getShopBookings,
  acceptBooking,
  rejectBooking,
  suggestBookingTime,
  completeBooking,
  getBookingsForSlotCheck,
  getShopStaff,
} from '../../lib/api';
import { generateTimeSlots, type TimeSlot } from '../../lib/slotManagement';
import { generateWhatsAppReminderUrl } from '../../lib/whatsappService';
import type { StaffMember } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayOption {
  label: string;
  sublabel: string;
  value: string;
  isToday: boolean;
  isOff: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDateReadable(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function buildNext14Days(weeklyOff: string): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const fullName = dayNames[d.getDay()];
    days.push({
      label: shortNames[d.getDay()],
      sublabel: d.getDate().toString(),
      value: d.toISOString().split('T')[0],
      isToday: i === 0,
      isOff: fullName === weeklyOff,
    });
  }
  return days;
}

function groupSlots(slots: TimeSlot[]) {
  const morning: TimeSlot[] = [];
  const afternoon: TimeSlot[] = [];
  const evening: TimeSlot[] = [];

  for (const slot of slots) {
    const m = timeToMinutes(slot.time);
    if (m < 12 * 60) morning.push(slot);
    else if (m < 17 * 60) afternoon.push(slot);
    else evening.push(slot);
  }
  return { morning, afternoon, evening };
}

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed':  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'pending':    return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'suggested':  return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'completed':  return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'cancelled':  return 'bg-red-100 text-red-600 border-red-200';
    default:           return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pending', confirmed: 'Confirmed', suggested: 'Time Suggested',
    completed: 'Completed', cancelled: 'Cancelled',
  };
  return map[status] || status;
}

function calcOwnerEarning(total: number) {
  return Math.floor(total * 0.9);
}

/**
 * Returns true if the booking's appointment date is today or in the past.
 * Uses final_date if confirmed, otherwise falls back to requested_date.
 */
function isAppointmentDue(booking: any): boolean {
  const dateStr = booking.final_date || booking.requested_date;
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(dateStr + 'T00:00:00');
  return apptDate <= today;
}

// ─── Slot Group Sub-Component ─────────────────────────────────────────────────

function SlotGroup({
  label, icon: Icon, slots, selected, onSelect, iconClass,
}: {
  label: string; icon: any; slots: TimeSlot[];
  selected: string; onSelect: (t: string) => void; iconClass: string;
}) {
  if (slots.length === 0) return null;
  const available = slots.filter((s) => s.available).length;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">({available} open)</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot) => {
          const isSelected = selected === slot.time;
          return (
            <button
              key={slot.time}
              type="button"
              onClick={() => slot.available && onSelect(slot.time)}
              disabled={!slot.available}
              title={slot.reason}
              className={`py-2.5 px-1 rounded-xl text-xs font-semibold border-2 transition-all duration-150 relative
                ${isSelected
                  ? 'border-gold bg-gold text-[#0A0A0A] font-bold shadow-gold scale-105'
                  : slot.available
                  ? 'border-white/10 bg-[#181818] hover:border-gold/60 hover:bg-gold/10 text-white'
                  : 'border-white/5 bg-white/5 text-white/30 cursor-not-allowed opacity-40 line-through'
                }`}
            >
              {formatTime12h(slot.time)}
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold rounded-full flex items-center justify-center border border-[#0A0A0A]">
                  <Check className="w-2 h-2 text-[#0A0A0A]" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Suggest Time Modal ───────────────────────────────────────────────────────

function SuggestTimeModal({
  booking,
  shopWeeklyOff,
  shopId,
  onClose,
  onConfirm,
  processing,
}: {
  booking: any;
  shopWeeklyOff: string;
  shopId: string;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
  processing: boolean;
}) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const days = useMemo(() => buildNext14Days(shopWeeklyOff), [shopWeeklyOff]);
  const slotGroups = useMemo(() => groupSlots(slots), [slots]);

  // Total service duration for this booking
  const serviceDuration = useMemo(() => {
    const services = booking.services || [];
    return services.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) || 30;
  }, [booking.services]);

  // Load slots when date changes
  useEffect(() => {
    if (!selectedDate || !shopId) {
      setSlots([]);
      setSelectedTime('');
      return;
    }
    loadSlots();
  }, [selectedDate]);

  async function loadSlots() {
    try {
      setLoadingSlots(true);
      setSelectedTime('');

      // Fetch shop hours
      const { data: shopData, error } = await supabase
        .from('shops')
        .select('opening_time, closing_time')
        .eq('id', shopId)
        .single();

      if (error || !shopData) {
        console.error('Failed to fetch shop hours:', error);
        setSlots([]);
        return;
      }

      // Get existing bookings for conflict detection
      const existing = await getBookingsForSlotCheck(shopId, selectedDate);

      const generated = generateTimeSlots({
        openingTime: shopData.opening_time,
        closingTime: shopData.closing_time,
        serviceDurationMinutes: serviceDuration,
        existingBookings: existing,
        selectedDate,
        bufferMinutes: 15,
      });

      setSlots(generated);
    } catch (err) {
      console.error('Error loading slots:', err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleConfirm() {
    if (!selectedDate || !selectedTime) {
      toast({ title: 'Select Date & Time', description: 'Please pick a date and a time slot.', variant: 'destructive' });
      return;
    }
    onConfirm(selectedDate, selectedTime);
  }

  const availableCount = slots.filter((s) => s.available).length;
  const noSlotsOnDate = !loadingSlots && selectedDate && slots.length > 0 && availableCount === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#141414] border border-gold/30 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-white">

        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">Suggest New Time</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Proposing an alternative for <strong>{booking.customer_name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Content ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Customer's original request */}
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-amber-600 font-semibold mb-0.5">Customer Requested</p>
              <p className="font-semibold text-amber-900">
                {formatDateReadable(booking.requested_date)} at {formatTime12h(booking.requested_time)}
              </p>
            </div>
          </div>

          {/* Date selector */}
          <div>
            <p className="text-sm font-semibold mb-2.5">Select New Date</p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {days.map((day) => {
                const isSelected = selectedDate === day.value;
                return (
                  <button
                    key={day.value}
                    type="button"
                    disabled={day.isOff}
                    onClick={() => {
                      setSelectedDate(day.value);
                      setSelectedTime('');
                    }}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border-2 min-w-[52px] transition-all ${
                      isSelected
                        ? 'border-gold bg-gold text-[#0A0A0A] font-bold shadow-gold scale-105'
                        : day.isOff
                        ? 'border-white/5 bg-white/5 opacity-30 cursor-not-allowed text-white/30'
                        : 'border-white/10 bg-[#181818] text-white hover:border-gold/50 hover:bg-gold/10'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isSelected ? 'text-[#0A0A0A]' : 'text-white/60'}`}>
                      {day.label}
                    </span>
                    <span className={`text-base font-bold leading-tight ${isSelected ? 'text-[#0A0A0A]' : 'text-white'}`}>
                      {day.sublabel}
                    </span>
                    {day.isToday && (
                      <span className={`text-[9px] font-bold mt-0.5 ${isSelected ? 'text-[#0A0A0A]' : 'text-gold'}`}>
                        TODAY
                      </span>
                    )}
                    {day.isOff && (
                      <span className="text-[9px] text-muted-foreground mt-0.5">OFF</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slot grid */}
          {selectedDate && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Available Time Slots</p>
                {loadingSlots && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking conflicts…
                  </div>
                )}
              </div>

              {loadingSlots ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : noSlotsOnDate ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <Clock className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No available slots on this date</p>
                  <p className="text-xs mt-1">All slots are fully booked — try another day</p>
                </div>
              ) : (
                <>
                  <SlotGroup
                    label="Morning" icon={Sun} iconClass="text-amber-500"
                    slots={slotGroups.morning} selected={selectedTime} onSelect={setSelectedTime}
                  />
                  <SlotGroup
                    label="Afternoon" icon={Sunset} iconClass="text-orange-500"
                    slots={slotGroups.afternoon} selected={selectedTime} onSelect={setSelectedTime}
                  />
                  <SlotGroup
                    label="Evening" icon={Moon} iconClass="text-indigo-500"
                    slots={slotGroups.evening} selected={selectedTime} onSelect={setSelectedTime}
                  />

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs text-white/50 mt-1 font-inter">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border border-white/20 bg-[#181818]" />
                      Available
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border border-gold bg-gold" />
                      Selected
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded border border-white/10 bg-white/5 opacity-50" />
                      Booked
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Comparison preview */}
          {selectedDate && selectedTime && (
            <div className="p-4 bg-gold/10 border border-gold/30 rounded-xl">
              <p className="text-xs text-gold font-bold mb-3 uppercase tracking-wide font-inter">
                Suggestion Preview
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#181818] rounded-xl border border-white/10">
                  <p className="text-[10px] text-white/40 font-medium mb-1">Was Requested</p>
                  <p className="font-semibold text-xs text-white">{formatDateReadable(booking.requested_date)}</p>
                  <p className="text-xs text-white/60">{formatTime12h(booking.requested_time)}</p>
                </div>
                <div className="p-3 bg-gold/15 rounded-xl border-2 border-gold">
                  <p className="text-[10px] text-gold font-bold mb-1 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-gold" /> New Suggestion
                  </p>
                  <p className="font-bold text-xs text-white">{formatDateReadable(selectedDate)}</p>
                  <p className="text-xs text-gold font-medium">{formatTime12h(selectedTime)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer ──────────────────────────────────────────────── */}
        <div className="p-5 border-t border-border flex-shrink-0 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime || processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Send Suggestion
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Filter Tabs ───────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: 'all',       label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'suggested', label: 'Suggested' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerBookings() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Suggest modal state
  const [suggestBooking, setSuggestBooking] = useState<any>(null);

  // Filter state
  const [activeTab, setActiveTab] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');

  // ─── Data Loading ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!user?.shopId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [bookingsData, shopData, staffData] = await Promise.all([
        getShopBookings(user.shopId),
        supabase.from('shops').select('id, weekly_off, opening_time, closing_time').eq('id', user.shopId).single(),
        getShopStaff(user.shopId),
      ]);
      setBookings(bookingsData || []);
      if (shopData.data) setShop(shopData.data);
      setStaffList(staffData || []);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      toast({ title: 'Error', description: err.message || 'Failed to load bookings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.shopId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async function handleConfirm(bookingId: string) {
    setProcessing(bookingId + '_confirm');
    try {
      await acceptBooking(bookingId);
      toast({ title: 'Booking Confirmed', description: 'Customer has been notified.' });
      await loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setProcessing(null); }
  }

  async function handleReject(bookingId: string) {
    setProcessing(bookingId + '_reject');
    try {
      await rejectBooking(bookingId);
      toast({ title: 'Booking Rejected', description: 'Booking has been cancelled.' });
      await loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setProcessing(null); }
  }

  async function handleComplete(bookingId: string) {
    setProcessing(bookingId + '_complete');
    try {
      await completeBooking(bookingId);
      toast({ title: 'Booking Completed', description: 'Earnings added to wallet.' });
      await loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setProcessing(null); }
  }

  async function handleSuggestConfirm(date: string, time: string) {
    if (!suggestBooking) return;
    setProcessing(suggestBooking.id + '_suggest');
    try {
      await suggestBookingTime(suggestBooking.id, date, time);
      toast({ title: 'Suggestion Sent', description: 'Waiting for customer response.' });
      setSuggestBooking(null);
      await loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setProcessing(null); }
  }

  // ─── Filtered list ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = bookings;
    if (activeTab !== 'all') {
      list = list.filter((b) => b.status === activeTab);
    }
    if (staffFilter !== 'all') {
      if (staffFilter === 'unassigned') {
        list = list.filter((b) => !b.staff_id);
      } else {
        list = list.filter((b) => b.staff_id === staffFilter);
      }
    }
    return list;
  }, [bookings, activeTab, staffFilter]);

  // Counts for tab badges
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: bookings.length };
    for (const b of bookings) {
      map[b.status] = (map[b.status] || 0) + 1;
    }
    return map;
  }, [bookings]);

  // ─── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading bookings…</p>
      </div>
    );
  }

  const pendingCount = counts['pending'] || 0;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Suggest Time Modal */}
      {suggestBooking && shop && (
        <SuggestTimeModal
          booking={suggestBooking}
          shopWeeklyOff={shop.weekly_off || 'Sunday'}
          shopId={shop.id}
          onClose={() => setSuggestBooking(null)}
          onConfirm={handleSuggestConfirm}
          processing={processing === suggestBooking.id + '_suggest'}
        />
      )}

      <div className="space-y-6">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bookings</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-amber-800">{pendingCount} need action</span>
            </div>
          )}
        </div>

        {/* ── Status Tabs & Staff Filter ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 overflow-x-auto">
            {STATUS_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === value
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                {counts[value] > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {counts[value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {staffList.length > 0 && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="text-xs bg-white border border-border rounded-xl px-3 py-2 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                <option value="all">All Specialists ({bookings.length})</option>
                <option value="unassigned">Unassigned / General</option>
                {staffList.map((s) => {
                  const sCount = bookings.filter((b) => b.staff_id === s.id).length;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.primary_role}) {sCount > 0 ? `(${sCount})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* ── Empty State ───────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <Card className="p-16 text-center">
            <Calendar className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-1">No Bookings</h3>
            <p className="text-muted-foreground text-sm">
              {activeTab === 'all'
                ? 'No booking requests yet. Share your shop page to attract customers!'
                : `No ${activeTab} bookings`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const isProcessingConfirm = processing === booking.id + '_confirm';
              const isProcessingReject  = processing === booking.id + '_reject';
              const isProcessingComplete = processing === booking.id + '_complete';
              const isProcessingSuggest  = processing === booking.id + '_suggest';
              const anyProcessing = isProcessingConfirm || isProcessingReject || isProcessingComplete || isProcessingSuggest;

              return (
                <Card key={booking.id} className="p-6 transition-all hover:shadow-md">
                  {/* ── Booking Header ──────────────────────────────────── */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-base">{booking.customer_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                        {booking.service_type === 'home' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1">
                            <Home className="w-3 h-3" /> Home
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {booking.customer_email}
                        </span>
                        {booking.customer_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {booking.customer_phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-primary">₹{booking.total_amount}</p>
                      <p className="text-xs text-muted-foreground">
                        Your cut: <span className="font-semibold text-emerald-600">₹{calcOwnerEarning(booking.total_amount)}</span>
                      </p>
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  {/* ── Details Grid ────────────────────────────────────── */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {/* Times */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 bg-secondary/40 rounded-lg text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Requested</p>
                          <p className="font-semibold">{formatDateReadable(booking.requested_date)} · {formatTime12h(booking.requested_time)}</p>
                        </div>
                      </div>
                      {booking.suggested_date && (
                        <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                          <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-blue-600 font-semibold">Suggested by You</p>
                            <p className="font-semibold text-blue-800">{formatDateReadable(booking.suggested_date)} · {formatTime12h(booking.suggested_time)}</p>
                          </div>
                        </div>
                      )}
                      {booking.final_date && (
                        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-emerald-700 font-semibold">Confirmed</p>
                            <p className="font-bold text-emerald-800">{formatDateReadable(booking.final_date)} · {formatTime12h(booking.final_time)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Services */}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">Services</p>
                      <div className="space-y-1.5">
                        {(booking.services || []).map((svc: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm p-2 bg-secondary/40 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Scissors className="w-3 h-3 text-primary" />
                              <span className="font-medium">{svc.name}</span>
                              {svc.duration_minutes && (
                                <span className="text-xs text-muted-foreground">({svc.duration_minutes}m)</span>
                              )}
                            </div>
                            <span className="font-semibold text-primary">₹{svc.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Home address */}
                  {booking.service_type === 'home' && booking.customer_address && (
                    <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm mb-4">
                      <Home className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-emerald-800">Home Service Address</p>
                        <p className="text-emerald-700 text-xs mt-0.5">{booking.customer_address}</p>
                      </div>
                    </div>
                  )}

                  {/* ── Actions ─────────────────────────────────────────── */}
                  {booking.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="flex-1 min-w-[120px] bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleConfirm(booking.id)}
                        disabled={anyProcessing}
                      >
                        {isProcessingConfirm
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <><CheckCircle className="w-4 h-4 mr-1.5" />Confirm</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 min-w-[120px] border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => setSuggestBooking(booking)}
                        disabled={anyProcessing}
                      >
                        <Clock className="w-4 h-4 mr-1.5" />
                        Suggest Time
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 min-w-[120px] border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(booking.id)}
                        disabled={anyProcessing}
                      >
                        {isProcessingReject
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <><XCircle className="w-4 h-4 mr-1.5" />Reject</>}
                      </Button>
                    </div>
                  )}

                  {booking.status === 'confirmed' && (() => {
                    const due = isAppointmentDue(booking);
                    const apptDate = booking.final_date || booking.requested_date;
                    const daysLeft = apptDate
                      ? Math.ceil((new Date(apptDate + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) / 86400000)
                      : null;

                    return due ? (
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 active:scale-[0.98] transition-all"
                          onClick={() => handleComplete(booking.id)}
                          disabled={anyProcessing}
                        >
                          {isProcessingComplete ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Marking as Completed…</>
                          ) : (
                            <><Star className="w-4 h-4 mr-2 fill-white" />Mark as Completed · Earn ₹{calcOwnerEarning(booking.total_amount)}</>
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          90% earnings credited to wallet after marking complete
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-secondary/60 border border-border rounded-lg text-xs text-muted-foreground">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Appointment in <strong className="text-foreground">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>
                          {apptDate ? ` — ${formatDateReadable(apptDate)}` : ''}.
                          Completion available on the appointment day.
                        </span>
                      </div>
                    );
                  })()}

                  {booking.status === 'confirmed' && booking.customer_phone && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Reminder (2 hours before)
                      </span>
                      <a
                        href={generateWhatsAppReminderUrl({
                          bookingId: booking.id,
                          customerName: booking.customer_name,
                          customerPhone: booking.customer_phone,
                          shopName: shop?.name || 'Salon',
                          serviceName: (booking.services || []).map((s: any) => s.name).join(', ') || 'Service',
                          appointmentDate: booking.final_date || booking.requested_date,
                          appointmentTime: booking.final_time || booking.requested_time,
                          staffName: booking.staff_name,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                      >
                        <span>📱 Send WhatsApp Reminder</span>
                      </a>
                    </div>
                  )}

                  {booking.status === 'suggested' && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      Waiting for customer to accept or reject your suggested time.
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
