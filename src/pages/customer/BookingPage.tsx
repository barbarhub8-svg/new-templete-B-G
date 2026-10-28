import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Home, Store, Clock, IndianRupee, CheckCircle,
  Loader2, Scissors, Sun, Sunset, Moon, ChevronRight,
  Phone, Mail, User, MapPin, AlertCircle, Check, Users, Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../hooks/use-toast';
import { getShopById, getBookingsForSlotCheck, createBooking, getShopStaff } from '../../lib/api';
import { generateTimeSlots, calculateTotalDuration, type TimeSlot } from '../../lib/slotManagement';
import type { StaffMember } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayOption {
  label: string;       // "Mon"
  sublabel: string;    // "21"
  value: string;       // "2024-04-21"
  isToday: boolean;
  isOff: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildNextSevenDays(weeklyOff: string): DayOption[] {
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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Split slots into groups
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

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
      done ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
    }`}>
      {done ? <Check className="w-4 h-4" /> : n}
    </div>
  );
}

// ─── Slot Group ───────────────────────────────────────────────────────────────

function SlotGroup({
  label, icon: Icon, slots, selected, onSelect, iconClass,
}: {
  label: string;
  icon: any;
  slots: TimeSlot[];
  selected: string;
  onSelect: (time: string) => void;
  iconClass: string;
}) {
  if (slots.length === 0) return null;
  const available = slots.filter((s) => s.available).length;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">
          ({available} available)
        </span>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {slots.map((slot) => {
          const isSelected = selected === slot.time;
          return (
            <button
              key={slot.time}
              type="button"
              onClick={() => slot.available && onSelect(slot.time)}
              disabled={!slot.available}
              title={slot.reason}
              className={`
                relative py-2.5 px-1 rounded-xl text-xs font-semibold border-2 transition-all duration-150
                ${isSelected
                  ? 'border-primary bg-primary text-white shadow-md scale-105'
                  : slot.available
                  ? 'border-border bg-white hover:border-primary/60 hover:bg-primary/5 text-foreground'
                  : 'border-border/40 bg-muted/40 text-muted-foreground cursor-not-allowed opacity-50'
                }
              `}
            >
              {formatTime12h(slot.time)}
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-2 h-2 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  service, selected, onToggle,
}: { service: any; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-150 text-left ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-white hover:border-primary/40 hover:bg-secondary/30'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Custom checkbox */}
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          selected ? 'bg-primary border-primary' : 'border-muted-foreground/40'
        }`}>
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
        <div>
          <p className="font-semibold text-sm">{service.name}</p>
          <p className="text-xs text-muted-foreground">{service.duration_minutes} mins</p>
        </div>
      </div>
      <div className={`flex items-center gap-0.5 font-bold text-base transition-colors ${
        selected ? 'text-primary' : 'text-muted-foreground'
      }`}>
        <IndianRupee className="w-4 h-4" />
        {service.price}
      </div>
    </button>
  );
}

// ─── Success Overlay ──────────────────────────────────────────────────────────

function SuccessOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Booking Sent!</h2>
        <p className="text-muted-foreground">Redirecting to confirmation…</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingPage() {
  const { shopId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Staff state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Step tracking: 1=services, 2=datetime, 3=details
  const [step, setStep] = useState(1);

  // Booking state
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [serviceType, setServiceType] = useState<'in-shop' | 'home'>('in-shop');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState(() => {
    return localStorage.getItem('nexora_customer_email') || '';
  });
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ─── Load Shop and Staff ───────────────────────────────────────────────────

  useEffect(() => {
    if (shopId) {
      loadShopData();
      loadStaffData();
    }
  }, [shopId]);

  async function loadShopData() {
    try {
      setLoading(true);
      const data = await getShopById(shopId!);
      if (!data) throw new Error('Shop not found');
      setShop(data);

      // Handle AI Recommendation pre-selection or router state
      const state = location.state as any;
      if (state?.preSelectedServices && state.preSelectedServices.length > 0) {
        setSelectedServices(state.preSelectedServices);
      } else if (state?.preSelectedServiceName && data.services) {
        const query = state.preSelectedServiceName.toLowerCase();
        const found = data.services.find(
          (s: any) => s.name?.toLowerCase().includes(query) || query.includes(s.name?.toLowerCase())
        );
        if (found) {
          setSelectedServices([found]);
        } else if (data.services.length > 0) {
          setSelectedServices([data.services[0]]);
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function loadStaffData() {
    try {
      setLoadingStaff(true);
      const staffData = await getShopStaff(shopId!, true);
      setStaffList(staffData || []);

      const preselectId = searchParams.get('staffId');
      if (preselectId) {
        const found = staffData.find((s) => s.id === preselectId);
        if (found) setSelectedStaff(found);
      }
    } catch (err) {
      console.error('Failed to load shop staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  }

  // ─── Staff Schedule Check on Selected Date ─────────────────────────────────

  const selectedDayName = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate + 'T00:00:00');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    return dayNames[d.getDay()];
  }, [selectedDate]);

  const staffScheduleForSelectedDay = useMemo(() => {
    if (!selectedStaff || !selectedDayName) return null;
    return selectedStaff.weekly_schedule?.[selectedDayName] || null;
  }, [selectedStaff, selectedDayName]);

  const isStaffOffOnSelectedDay = useMemo(() => {
    if (!selectedStaff || !staffScheduleForSelectedDay) return false;
    return !staffScheduleForSelectedDay.is_working;
  }, [selectedStaff, staffScheduleForSelectedDay]);

  // Filter staff who can perform the selected services
  const eligibleStaff = useMemo(() => {
    if (selectedServices.length === 0) return staffList;
    return staffList.filter((s) => {
      if (!s.assigned_services || s.assigned_services.length === 0) return true;
      return selectedServices.some((svc) =>
        s.assigned_services.some(
          (as) => as.toLowerCase().trim() === svc.name.toLowerCase().trim() || as === svc.id
        )
      );
    });
  }, [staffList, selectedServices]);

  // ─── Load Slots ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (selectedDate && shop && selectedServices.length > 0) {
      if (isStaffOffOnSelectedDay) {
        setAvailableSlots([]);
        setSelectedTime('');
      } else {
        loadSlots();
      }
    } else {
      setAvailableSlots([]);
      setSelectedTime('');
    }
  }, [selectedDate, shop, selectedServices, selectedStaff, isStaffOffOnSelectedDay]);

  async function loadSlots() {
    try {
      setLoadingSlots(true);
      setSelectedTime('');
      const existing = await getBookingsForSlotCheck(shop.id, selectedDate);
      
      // If a specific staff is selected, only bookings involving this staff (or generic) conflict
      const relevantBookings = selectedStaff
        ? existing.filter((b: any) => !b.staff_id || b.staff_id === selectedStaff.id)
        : existing;

      const totalDuration = calculateTotalDuration(selectedServices);

      // Determine hours based on shop + staff schedule
      let openTime = shop.opening_time;
      let closeTime = shop.closing_time;

      if (staffScheduleForSelectedDay && staffScheduleForSelectedDay.is_working) {
        if (staffScheduleForSelectedDay.start_time) openTime = staffScheduleForSelectedDay.start_time;
        if (staffScheduleForSelectedDay.end_time) closeTime = staffScheduleForSelectedDay.end_time;
      }

      const slots = generateTimeSlots({
        openingTime: openTime,
        closingTime: closeTime,
        serviceDurationMinutes: totalDuration,
        existingBookings: relevantBookings,
        selectedDate,
        bufferMinutes: 15,
      });
      setAvailableSlots(slots);
    } catch {
      toast({ title: 'Error', description: 'Failed to load time slots', variant: 'destructive' });
    } finally {
      setLoadingSlots(false);
    }
  }

  // ─── Derived values ─────────────────────────────────────────────────────────

  const days = useMemo(() => (shop ? buildNextSevenDays(shop.weekly_off) : []), [shop]);

  const slotGroups = useMemo(() => groupSlots(availableSlots), [availableSlots]);

  const servicesTotal = selectedServices.reduce((s, svc) => s + svc.price, 0);
  const homeCharge = serviceType === 'home' ? (shop?.home_service_charge || 0) : 0;
  const totalAmount = servicesTotal + homeCharge;
  const totalDuration = calculateTotalDuration(selectedServices);

  // Step completion checks
  const step1Done = selectedServices.length > 0;
  const step2Done = !!(selectedDate && selectedTime);
  const step3Done = !!(customerName.trim() && customerEmail.trim());
  const canSubmit = step1Done && step2Done && step3Done;

  // ─── Toggle service ─────────────────────────────────────────────────────────

  function toggleService(service: any) {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
    // Reset time slots when service selection changes
    setSelectedTime('');
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) {
      toast({ title: 'Incomplete', description: 'Please complete all steps', variant: 'destructive' });
      return;
    }

    if (serviceType === 'home' && !customerAddress.trim()) {
      toast({ title: 'Address Required', description: 'Enter your address for home service', variant: 'destructive' });
      return;
    }

    const slot = availableSlots.find((s) => s.time === selectedTime);
    if (!slot?.available) {
      toast({ title: 'Slot Unavailable', description: 'Choose a different time slot', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const booking = await createBooking({
        shop_id: shop.id,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim().toLowerCase(),
        customer_phone: customerPhone || undefined,
        customer_address: serviceType === 'home' ? customerAddress : undefined,
        service_type: serviceType,
        requested_date: selectedDate,
        requested_time: selectedTime,
        services: selectedServices.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration_minutes: s.duration_minutes,
        })),
        service_amount: servicesTotal,
        home_service_charge: homeCharge,
        total_amount: totalAmount,
        referral_code_used: referralCode.trim().toUpperCase() || undefined,
        staff_id: selectedStaff?.id || undefined,
        staff_name: selectedStaff?.full_name || undefined,
        staff_role: selectedStaff?.primary_role || undefined,
        staff_avatar: selectedStaff?.profile_photo_url || undefined,
      });

      // Save to localStorage for AI personalized grooming cycle suggestions
      try {
        const cleanEmail = customerEmail.trim().toLowerCase();
        localStorage.setItem('nexora_customer_email', cleanEmail);
        const existing = JSON.parse(localStorage.getItem('nexora_recent_bookings') || '[]');
        const newBookingRecord = {
          serviceName: selectedServices.map((s) => s.name).join(' + '),
          category: selectedServices[0]?.category || 'Hair Cut',
          date: selectedDate,
          price: totalAmount,
          salonName: shop.name,
          serviceType: serviceType,
        };
        const updated = [newBookingRecord, ...existing].slice(0, 5);
        localStorage.setItem('nexora_recent_bookings', JSON.stringify(updated));
      } catch (storageErr) {
        console.warn('LocalStorage save error:', storageErr);
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/booking/confirmation/${booking.id}`);
      }, 1800);
    } catch (err: any) {
      toast({ title: 'Booking Failed', description: err.message, variant: 'destructive' });
      setSubmitting(false);
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading shop details…</p>
      </div>
    );
  }

  if (!shop) return null;

  const activeServices = shop.services?.filter((s: any) => s.is_active !== false) || [];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {showSuccess && <SuccessOverlay />}

      {/* Sticky header */}
      <div className="bg-[#0A0A0A] border-b border-white/8 sticky top-[57px] z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/shop/${shopId}`)}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </button>
          <div className="text-center">
            <p className="text-sm font-playfair font-semibold text-white">{shop.name}</p>
            <p className="text-xs text-white/30 font-inter">Booking Appointment</p>
          </div>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 pb-20 bg-[#0A0A0A] min-h-screen">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: 'Services', done: step1Done },
            { n: 2, label: 'Date & Time', done: step2Done },
            { n: 3, label: 'Your Details', done: step3Done },
          ].map(({ n, label, done }, i) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => n <= step || done ? setStep(n) : null}
                className="flex items-center gap-2 flex-shrink-0"
              >
                <StepBadge n={n} active={step === n} done={done} />
                <span className={`text-sm font-medium hidden sm:block ${
                  step === n ? 'text-primary' : done ? 'text-emerald-600' : 'text-muted-foreground'
                }`}>
                  {label}
                </span>
              </button>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${done ? 'bg-emerald-400' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* ── Left / Main Column ──────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* ── STEP 1: Services & Type ─────────────────────────────── */}
              <Card className={`overflow-hidden transition-all ${step !== 1 && step1Done ? 'opacity-80' : ''}`}>
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setStep(1)}
                >
                  <div className="flex items-center gap-3">
                    <StepBadge n={1} active={step === 1} done={step1Done} />
                    <div>
                      <p className="font-semibold">Select Services</p>
                      {step1Done && step !== 1 && (
                        <p className="text-xs text-muted-foreground">
                          {selectedServices.map((s) => s.name).join(', ')} · ₹{servicesTotal}
                        </p>
                      )}
                    </div>
                  </div>
                  {step1Done && step !== 1 && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs">
                      Done
                    </Badge>
                  )}
                </div>

                {step === 1 && (
                  <div className="px-5 pb-5">
                    {/* Service Type Toggle */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {[
                        {
                          type: 'in-shop' as const,
                          icon: Store,
                          label: 'In-Shop',
                          sub: 'Visit the shop',
                          disabled: false,
                        },
                        {
                          type: 'home' as const,
                          icon: Home,
                          label: 'Home Service',
                          sub: shop.home_service_available
                            ? `+₹${shop.home_service_charge} extra`
                            : 'Not available',
                          disabled: !shop.home_service_available,
                        },
                      ].map(({ type, icon: Icon, label, sub, disabled }) => (
                        <button
                          key={type}
                          type="button"
                          disabled={disabled}
                          onClick={() => setServiceType(type)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            serviceType === type
                              ? type === 'in-shop'
                                ? 'border-primary bg-primary/5'
                                : 'border-emerald-500 bg-emerald-50'
                              : disabled
                              ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <Icon className={`w-6 h-6 mb-2 ${
                            serviceType === type
                              ? type === 'in-shop' ? 'text-primary' : 'text-emerald-600'
                              : 'text-muted-foreground'
                          }`} />
                          <p className="font-semibold text-sm">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                        </button>
                      ))}
                    </div>

                    {/* Home service radius note */}
                    {serviceType === 'home' && shop.home_service_available && (
                      <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4 text-xs text-emerald-700">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        Home service available within {shop.service_radius_km} km radius
                      </div>
                    )}

                    {/* Services list */}
                    <div className="space-y-2.5">
                      {activeServices.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-6">
                          No services available at this shop
                        </p>
                      ) : (
                        activeServices.map((svc: any) => (
                          <ServiceCard
                            key={svc.id}
                            service={svc}
                            selected={!!selectedServices.find((s) => s.id === svc.id)}
                            onToggle={() => toggleService(svc)}
                          />
                        ))
                      )}
                    </div>

                    {step1Done && (
                      <Button
                        type="button"
                        className="w-full mt-5"
                        onClick={() => setStep(2)}
                      >
                        Continue to Date & Time
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </Card>

              {/* ── STEP 2: Date & Time ─────────────────────────────────── */}
              <Card className={`overflow-hidden transition-all ${step < 2 && !step1Done ? 'opacity-40 pointer-events-none' : ''}`}>
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => step1Done && setStep(2)}
                >
                  <div className="flex items-center gap-3">
                    <StepBadge n={2} active={step === 2} done={step2Done} />
                    <div>
                      <p className="font-semibold">Date, Time & Specialist</p>
                      {step2Done && step !== 2 && (
                        <p className="text-xs text-muted-foreground">
                          {selectedDate} at {formatTime12h(selectedTime)} · {selectedStaff ? selectedStaff.full_name : 'Any Specialist'}
                        </p>
                      )}
                    </div>
                  </div>
                  {step2Done && step !== 2 && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs">Done</Badge>
                  )}
                </div>

                {step === 2 && (
                  <div className="px-5 pb-5">
                    {/* Choose Specialist */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-primary" />
                          Select Specialist
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {selectedStaff ? selectedStaff.full_name : 'Any Available Specialist'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {/* Option 1: Any Available Specialist */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaff(null);
                            setSelectedTime('');
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            selectedStaff === null
                              ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                              : 'border-border bg-white hover:border-primary/40'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            selectedStaff === null ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-xs truncate">Any Specialist</p>
                              {selectedStaff === null && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">Fastest booking</p>
                          </div>
                        </button>

                        {/* Specific Staff Cards */}
                        {eligibleStaff.map((staff) => {
                          const isSelected = selectedStaff?.id === staff.id;
                          return (
                            <button
                              key={staff.id}
                              type="button"
                              onClick={() => {
                                setSelectedStaff(staff);
                                setSelectedTime('');
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left relative ${
                                isSelected
                                  ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                                  : 'border-border bg-white hover:border-primary/40'
                              }`}
                            >
                              {staff.profile_photo_url ? (
                                <img
                                  src={staff.profile_photo_url}
                                  alt={staff.full_name}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-border"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                                  {staff.full_name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-xs truncate">{staff.full_name}</p>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{staff.primary_role}</p>
                                {staff.specializations && staff.specializations.length > 0 && (
                                  <span className="text-[10px] text-primary/80 truncate block">
                                    {staff.specializations.slice(0, 2).join(', ')}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date selector — pill strip */}
                    <p className="text-sm font-medium mb-3">
                      Choose a Date
                      {!step1Done && (
                        <span className="text-xs text-muted-foreground ml-2">(select services first)</span>
                      )}
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      {days.map((day) => {
                        const isSelected = selectedDate === day.value;
                        return (
                          <button
                            key={day.value}
                            type="button"
                            disabled={day.isOff || !step1Done}
                            onClick={() => {
                              setSelectedDate(day.value);
                              setSelectedTime('');
                            }}
                            className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border-2 min-w-[52px] transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-white shadow-md'
                                : day.isOff
                                ? 'border-border bg-muted/30 opacity-40 cursor-not-allowed'
                                : 'border-border bg-white hover:border-primary/50 hover:bg-primary/5'
                            }`}
                          >
                            <span className={`text-xs font-medium ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                              {day.label}
                            </span>
                            <span className={`text-base font-bold leading-tight ${isSelected ? 'text-white' : ''}`}>
                              {day.sublabel}
                            </span>
                            {day.isToday && (
                              <span className={`text-[9px] font-medium mt-0.5 ${isSelected ? 'text-white/80' : 'text-primary'}`}>
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

                    {/* Staff Off Warning */}
                    {selectedDate && isStaffOffOnSelectedDay && selectedStaff && (
                      <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl my-4 text-xs text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">{selectedStaff.full_name} is scheduled off on {selectedDayName ? selectedDayName.charAt(0).toUpperCase() + selectedDayName.slice(1) : 'this day'}.</p>
                          <p className="mt-0.5 text-amber-700">Please choose a different date or select <strong>Any Specialist</strong> above to view available appointments.</p>
                        </div>
                      </div>
                    )}

                    {/* Time Slots */}
                    {selectedDate && !isStaffOffOnSelectedDay && (
                      <div className="mt-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium">Available Time Slots</p>
                          {loadingSlots && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Loading…
                            </div>
                          )}
                        </div>

                        {loadingSlots ? (
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />
                            ))}
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <Clock className="w-10 h-10 mb-2 opacity-30" />
                            <p className="text-sm">No available slots for this date</p>
                            <p className="text-xs mt-1">Try another day</p>
                          </div>
                        ) : (
                          <>
                            <SlotGroup
                              label="Morning"
                              icon={Sun}
                              iconClass="text-amber-500"
                              slots={slotGroups.morning}
                              selected={selectedTime}
                              onSelect={setSelectedTime}
                            />
                            <SlotGroup
                              label="Afternoon"
                              icon={Sunset}
                              iconClass="text-orange-500"
                              slots={slotGroups.afternoon}
                              selected={selectedTime}
                              onSelect={setSelectedTime}
                            />
                            <SlotGroup
                              label="Evening"
                              icon={Moon}
                              iconClass="text-indigo-500"
                              slots={slotGroups.evening}
                              selected={selectedTime}
                              onSelect={setSelectedTime}
                            />
                            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded border-2 border-border bg-white" />
                                Available
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded border-2 border-primary bg-primary" />
                                Selected
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded border-2 border-border bg-muted/40 opacity-50" />
                                Booked
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Duration info */}
                    {selectedServices.length > 0 && (
                      <div className="flex items-center gap-2 mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-primary">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        Estimated duration: <strong>{totalDuration} mins</strong> for {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
                      </div>
                    )}

                    {step2Done && (
                      <Button
                        type="button"
                        className="w-full mt-5"
                        onClick={() => setStep(3)}
                      >
                        Continue to Your Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </Card>

              {/* ── STEP 3: Customer Details ─────────────────────────────── */}
              <Card className={`overflow-hidden transition-all ${!step1Done ? 'opacity-40 pointer-events-none' : ''}`}>
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => step1Done && setStep(3)}
                >
                  <div className="flex items-center gap-3">
                    <StepBadge n={3} active={step === 3} done={step3Done} />
                    <div>
                      <p className="font-semibold">Your Details</p>
                      {step3Done && step !== 3 && (
                        <p className="text-xs text-muted-foreground">{customerName} · {customerEmail}</p>
                      )}
                    </div>
                  </div>
                  {step3Done && step !== 3 && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs">Done</Badge>
                  )}
                </div>

                {step === 3 && (
                  <div className="px-5 pb-5 space-y-4">
                    {/* Name */}
                    <div>
                      <Label htmlFor="cname" className="flex items-center gap-1.5 mb-1.5">
                        <User className="w-3.5 h-3.5" /> Full Name *
                      </Label>
                      <Input
                        id="cname"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="cemail" className="flex items-center gap-1.5 mb-1.5">
                        <Mail className="w-3.5 h-3.5" /> Email Address *
                      </Label>
                      <Input
                        id="cemail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Booking confirmation will be sent to this email
                      </p>
                    </div>

                    {/* Phone */}
                    <div>
                      <Label htmlFor="cphone" className="flex items-center gap-1.5 mb-1.5">
                        <Phone className="w-3.5 h-3.5" /> Phone Number
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="cphone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    {/* Referral Code */}
                    <div>
                      <Label htmlFor="cref" className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-base">🎁</span> Referral Code
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="cref"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="e.g., ABC12DEF"
                        className="uppercase tracking-widest font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Have a friend's referral code? Enter it and both of you earn ₹20 Nexora Rewards!
                      </p>
                    </div>

                    {/* Home address — smooth toggle */}
                    {serviceType === 'home' && (
                      <div className="border-t border-dashed border-border pt-4">
                        <Label htmlFor="caddress" className="flex items-center gap-1.5 mb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Service Address *</span>
                        </Label>
                        <Input
                          id="caddress"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Flat/House no., Street, Landmark, Area"
                          required
                        />
                        <div className="flex items-start gap-1.5 mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          Service within {shop.service_radius_km} km radius · ₹{shop.home_service_charge} extra charge
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Submit Button (mobile) */}
              <div className="lg:hidden">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Request…
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4 mr-2" />
                      Confirm Booking · ₹{totalAmount}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* ── Right / Sticky Summary ───────────────────────────────── */}
            <div className="hidden lg:block">
              <div className="sticky top-28 space-y-4">
                {/* Price summary card */}
                <Card className="p-5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-primary" />
                    Booking Summary
                  </h3>

                  {/* Selected services */}
                  {selectedServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No services selected
                    </p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {selectedServices.map((svc) => (
                        <div key={svc.id} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{svc.name}</p>
                            <p className="text-xs text-muted-foreground">{svc.duration_minutes} mins</p>
                          </div>
                          <p className="font-semibold text-primary ml-2">₹{svc.price}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Date/time */}
                  {step2Done && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2.5 mb-2">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      {selectedDate} at {formatTime12h(selectedTime)}
                    </div>
                  )}

                  {/* Specialist */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2.5 mb-3">
                    <Users className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    <span>Specialist: <strong className="text-foreground">{selectedStaff ? selectedStaff.full_name : 'Any Specialist'}</strong></span>
                  </div>

                  {/* Service type */}
                  {serviceType === 'home' && (
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground">Home Service Charge</span>
                      <span className="font-semibold text-emerald-600">+₹{homeCharge}</span>
                    </div>
                  )}

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <div className="flex items-center gap-0.5 text-xl font-bold text-primary">
                      <IndianRupee className="w-5 h-5" />
                      <span>{totalAmount}</span>
                    </div>
                  </div>

                  {selectedServices.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      ~{totalDuration} mins total
                    </p>
                  )}
                </Card>

                {/* Shop info */}
                <Card className="p-5 bg-secondary/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {shop.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{shop.name}</p>
                      <p className="text-xs text-muted-foreground">{shop.city}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {shop.opening_time?.slice(0, 5)} – {shop.closing_time?.slice(0, 5)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" />
                      Off on {shop.weekly_off}
                    </div>
                  </div>
                </Card>

                {/* CTA */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Scissors className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
                {!canSubmit && (
                  <p className="text-xs text-center text-muted-foreground">
                    Complete all steps to confirm
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
