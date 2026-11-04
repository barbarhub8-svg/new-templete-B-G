import {
AlertCircle,
ArrowLeft,
Bell,
Check,
CheckCircle,
ChevronRight,
Clock,
Copy,
Home,
IndianRupee,
Loader2,
Mail,
MapPin,
Moon,
Package as PackageIcon,
Phone,
Scissors,
Store,
Sun,Sunset,
Tag,
User,
Users,
X
} from 'lucide-react';
import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { useLocation,useNavigate,useParams,useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../hooks/use-toast';
import { createBooking,getBookingsForSlotCheck,getShopById,getShopStaff } from '../../lib/api';
import { calculateTotalDuration,generateTimeSlots,type TimeSlot } from '../../lib/slotManagement';
import { supabase } from '../../lib/supabase';
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

/** Accepts HH:mm (preferred) or a 12-hour label such as "02:15 PM". */
function normalizeTimeParam(value: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!match) return '';
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) return '';
  const suffix = (match[3] || '').toLowerCase();
  if (suffix === 'pm' && hours < 12) hours += 12;
  if (suffix === 'am' && hours === 12) hours = 0;
  if (hours > 23) return '';
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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
  label, icon: Icon, slots, selected, onSelect, iconClass, onUnavailable,
}: {
  label: string;
  icon: any;
  slots: TimeSlot[];
  selected: string;
  onSelect: (time: string) => void;
  iconClass: string;
  /** Opens the waitlist request for a slot that cannot be booked. */
  onUnavailable?: (time: string) => void;
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
              onClick={() => {
                if (slot.available) onSelect(slot.time);
                else onUnavailable?.(slot.time);
              }}
              disabled={!slot.available && !onUnavailable}
              aria-disabled={!slot.available}
              title={slot.available ? undefined : `${slot.reason || 'Unavailable'} — join the waitlist`}
              className={`
                relative py-2.5 px-1 rounded-xl text-xs font-semibold border-2 transition-all duration-150
                ${isSelected
                  ? 'border-gold bg-gold text-[#0A0A0A] font-bold shadow-gold scale-105'
                  : slot.available
                  ? 'border-white/10 bg-[#181818] hover:border-gold/60 hover:bg-gold/10 text-white font-medium'
                  : onUnavailable
                  ? 'border-white/5 bg-white/5 text-white/35 opacity-60 hover:opacity-100 hover:border-gold/30 line-through'
                  : 'border-white/5 bg-white/5 text-white/30 cursor-not-allowed opacity-40 line-through'
                }
              `}
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
          ? 'border-gold bg-gold/10 text-white shadow-gold'
          : 'border-white/10 bg-[#181818] hover:border-gold/40 hover:bg-[#222222] text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Custom checkbox */}
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          selected ? 'bg-gold border-gold' : 'border-white/20 bg-white/5'
        }`}>
          {selected && <Check className="w-3 h-3 text-[#0A0A0A]" strokeWidth={3} />}
        </div>
        <div>
          <p className={`font-semibold text-sm ${selected ? 'text-gold' : 'text-white'}`}>{service.name}</p>
          <p className="text-xs text-white/50">{service.duration_minutes} mins</p>
        </div>
      </div>
      <div className={`flex items-center gap-0.5 font-bold text-base transition-colors ${
        selected ? 'text-gold' : 'text-white/70'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/95 backdrop-blur-md">
      <div className="text-center p-8 bg-[#141414] border border-gold/40 rounded-2xl shadow-gold max-w-md">
        <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-playfair font-bold text-white mb-2">Booking Sent!</h2>
        <p className="text-white/60 text-sm font-inter">Redirecting to confirmation…</p>
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
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') || '');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Context preserved from the public website (offer / package / calendar)
  const [bookingOffer, setBookingOffer] = useState<{ code?: string; title?: string } | null>(null);
  const [bookingPackage, setBookingPackage] = useState<{ name?: string; sessions?: number; validity?: string } | null>(
    null
  );
  const [staffNotice, setStaffNotice] = useState('');

  // Waitlist request (no persistent customer waitlist API exists yet)
  const [waitlistTime, setWaitlistTime] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const requestedTimeRef = useRef(normalizeTimeParam(searchParams.get('time')));
  const requestedTimeAppliedRef = useRef(false);

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

  const loadShopData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getShopById(shopId!);
      if (!data) throw new Error('Shop not found');
      setShop(data);

      // Handle AI Recommendation pre-selection or router state
      const state = location.state as any;
      const offerParam = searchParams.get('offer');
      const packageParam = searchParams.get('packageId');
      if (state?.offer || offerParam) {
        setBookingOffer(state?.offer || { code: offerParam || undefined });
      }
      if (state?.pkg || packageParam) {
        setBookingPackage(state?.pkg || { name: packageParam || undefined });
      }

      if (state?.preSelectedServices && state.preSelectedServices.length > 0) {
        // Keep only services that still exist and are active for this shop.
        const active = (data.services || []).filter((svc: any) => svc.is_active !== false && svc.active !== false);
        const byId = new Map(active.map((svc: any) => [svc.id, svc]));
        const mapped = (state.preSelectedServices as any[])
          .map((svc) => byId.get(svc?.id) || active.find((item: any) => item.name === svc?.name))
          .filter(Boolean);
        if (mapped.length > 0) {
          setSelectedServices(mapped);
        } else if (active.length > 0) {
          setSelectedServices([]);
          toast({
            title: 'Services changed',
            description: 'The selected services are no longer offered. Please choose from the current menu.',
          });
        }
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
  }, [shopId, location.state, searchParams, toast, navigate]);

  const loadStaffData = useCallback(async () => {
    try {
      setLoadingStaff(true);
      const staffData = await getShopStaff(shopId!, true);
      setStaffList(staffData || []);

      const preselectId = searchParams.get('staffId');
      if (preselectId) {
        const found = (staffData || []).find((s) => s.id === preselectId);
        if (found) {
          setSelectedStaff(found);
        } else {
          setSelectedStaff(null);
          setStaffNotice(
            'The specialist you selected is no longer available. Please choose another specialist below.'
          );
        }
      }
    } catch (err) {
      console.error('Failed to load shop staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  }, [shopId, searchParams]);

  useEffect(() => {
    if (shopId) {
      loadShopData();
      loadStaffData();
    }
  }, [shopId, loadShopData, loadStaffData]);

  // Realtime subscription for instant staff availability & schedule sync
  useEffect(() => {
    if (!shopId || shopId.startsWith('dummy-')) return;

    const channel = supabase
      .channel(`staff-realtime-${shopId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff',
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          loadStaffData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, loadStaffData]);

  // ─── Staff Schedule Check on Selected Date ─────────────────────────────────

  const selectedDayName = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate + 'T00:00:00');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    return dayNames[d.getDay()];
  }, [selectedDate]);

  const staffScheduleForSelectedDay = useMemo(() => {
    if (!selectedStaff || !selectedDayName) return null;
    const staff = selectedStaff as any;
    const schedule = staff.schedule ?? staff.weekly_schedule;
    if (Array.isArray(schedule)) {
      const day = schedule.find(
        (entry: any) => String(entry?.day || '').toLowerCase() === selectedDayName
      );
      return day ? { is_working: day.is_working !== false, start_time: day.start_time, end_time: day.end_time } : null;
    }
    if (schedule && typeof schedule === 'object') {
      const day = schedule[selectedDayName];
      if (!day) return null;
      return {
        is_working: day.is_working !== false,
        start_time: day.start_time,
        end_time: day.end_time,
      };
    }
    return null;
  }, [selectedStaff, selectedDayName]);

  const isStaffOffOnSelectedDay = useMemo(() => {
    if (!selectedStaff || !staffScheduleForSelectedDay) return false;
    return !staffScheduleForSelectedDay.is_working;
  }, [selectedStaff, staffScheduleForSelectedDay]);

  // Filter staff who can perform the selected services
  const eligibleStaff = useMemo(() => {
    if (selectedServices.length === 0) return staffList;
    return staffList.filter((s) => {
      const assigned: string[] = ((s as any).assigned_service_ids || (s as any).assigned_services || []) as string[];
      if (assigned.length === 0) return true;
      return selectedServices.some((svc) =>
        assigned.some(
          (value) =>
            String(value).toLowerCase().trim() === String(svc.name).toLowerCase().trim() || value === svc.id
        )
      );
    });
  }, [staffList, selectedServices]);

  // A preselected stylist must still be active and eligible for the chosen services.
  useEffect(() => {
    if (!selectedStaff || loadingStaff || staffList.length === 0) return;
    const stillActive = staffList.some((member) => member.id === selectedStaff.id);
    if (!stillActive) {
      setStaffNotice(`${selectedStaff.full_name} is no longer listed as an active specialist. Please choose another specialist.`);
      setSelectedStaff(null);
      return;
    }
    if (selectedServices.length > 0 && !eligibleStaff.some((member) => member.id === selectedStaff.id)) {
      setStaffNotice(
        `${selectedStaff.full_name} does not handle the selected services. Choose another specialist or "Any Specialist".`
      );
      setSelectedStaff(null);
    }
  }, [selectedStaff, staffList, eligibleStaff, selectedServices.length, loadingStaff]);

  // ─── Load Slots ─────────────────────────────────────────────────────────────

  const loadSlots = useCallback(async () => {
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

      // A date/time may arrive from an availability check. Only accept it when
      // the salon calendar confirms that slot is really open.
      if (requestedTimeRef.current && !requestedTimeAppliedRef.current) {
        requestedTimeAppliedRef.current = true;
        const requested = slots.find((slot) => slot.time === requestedTimeRef.current);
        if (requested?.available) {
          setSelectedTime(requested.time);
        } else {
          toast({
            title: 'Time no longer available',
            description: 'The requested time is taken. Please pick another available slot.',
          });
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load time slots', variant: 'destructive' });
    } finally {
      setLoadingSlots(false);
    }
  }, [shop, selectedDate, selectedStaff, selectedServices, staffScheduleForSelectedDay, toast]);

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
  }, [selectedDate, shop, selectedServices, isStaffOffOnSelectedDay, loadSlots]);

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

  // ─── Waitlist request (no persistent customer waitlist API yet) ───────────

  const waitlistRequest = useMemo(
    () => ({
      shop_id: shop?.id || shopId || '',
      shop_name: shop?.name || '',
      service_ids: selectedServices.map((service) => service.id),
      service_names: selectedServices.map((service) => service.name),
      staff_id: selectedStaff?.id || null,
      staff_name: selectedStaff?.full_name || null,
      date: selectedDate,
      time: waitlistTime,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
    }),
    [shop, shopId, selectedServices, selectedStaff, selectedDate, waitlistTime, customerName, customerEmail, customerPhone]
  );

  const waitlistWhatsAppUrl = useMemo(() => {
    const raw = (shop?.whatsapp_number || shop?.contact_number || '') as string;
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const number = digits.length > 10 ? digits : digits.length === 10 ? `91${digits}` : '';
    if (!number) return '';
    const message = `Waitlist request for ${shop?.name || 'salon'} — ${selectedServices.map((s) => s.name).join(', ') || 'services'} on ${selectedDate} at ${formatTime12h(waitlistTime)}${selectedStaff ? ` with ${selectedStaff.full_name}` : ''}. Name: ${customerName}. Phone: ${customerPhone}.`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }, [shop, selectedServices, selectedDate, waitlistTime, selectedStaff, customerName, customerPhone]);

  async function handleCopyWaitlist() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(waitlistRequest, null, 2));
      toast({ title: 'Request copied', description: 'Paste it to the salon on WhatsApp or SMS.' });
    } catch {
      toast({ title: 'Copy unavailable', description: 'Select the details manually.', variant: 'destructive' });
    }
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
        staff_avatar:
          (selectedStaff as any)?.profile_photo_url || (selectedStaff as any)?.avatar_url || undefined,
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

        {(bookingOffer || bookingPackage) && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs text-white/80">
            {bookingOffer && (
              <span className="inline-flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-gold" />
                <span>
                  Offer context: <strong className="text-gold">{bookingOffer.title || bookingOffer.code}</strong>
                  {bookingOffer.code ? ` · code ${bookingOffer.code}` : ''}
                </span>
              </span>
            )}
            {bookingPackage && (
              <span className="inline-flex items-center gap-2">
                <PackageIcon className="h-3.5 w-3.5 text-gold" />
                <span>
                  Package context: <strong className="text-gold">{bookingPackage.name}</strong>
                  {bookingPackage.sessions ? ` · ${bookingPackage.sessions} sessions` : ''}
                  {bookingPackage.validity ? ` · ${bookingPackage.validity}` : ''}
                </span>
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wide text-white/40">
              Carried from the salon website
            </span>
          </div>
        )}

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
                                ? 'border-gold bg-gold/15 text-gold shadow-gold'
                                : 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                              : disabled
                              ? 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed text-white/30'
                              : 'border-white/10 bg-[#181818] hover:border-gold/40 text-white'
                          }`}
                        >
                          <Icon className={`w-6 h-6 mb-2 ${
                            serviceType === type
                              ? type === 'in-shop' ? 'text-gold' : 'text-emerald-400'
                              : 'text-white/40'
                          }`} />
                          <p className="font-semibold text-sm text-white">{label}</p>
                          <p className="text-xs text-white/50 mt-0.5">{sub}</p>
                        </button>
                      ))}
                    </div>

                    {/* Home service radius note */}
                    {serviceType === 'home' && shop.home_service_available && (
                      <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-4 text-xs text-emerald-400">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        Home service available within {shop.service_radius_km} km radius
                      </div>
                    )}

                    {/* Services list */}
                    <div className="space-y-2.5">
                      {activeServices.length === 0 ? (
                        <p className="text-white/40 text-sm text-center py-6">
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
                        className="w-full mt-5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold"
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
              <Card className={`overflow-hidden transition-all bg-[#141414] border-white/10 ${step < 2 && !step1Done ? 'opacity-40 pointer-events-none' : ''}`}>
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => step1Done && setStep(2)}
                >
                  <div className="flex items-center gap-3">
                    <StepBadge n={2} active={step === 2} done={step2Done} />
                    <div>
                      <p className="font-semibold text-white">Date, Time & Specialist</p>
                      {step2Done && step !== 2 && (
                        <p className="text-xs text-white/50">
                          {selectedDate} at {formatTime12h(selectedTime)} · {selectedStaff ? selectedStaff.full_name : 'Any Specialist'}
                        </p>
                      )}
                    </div>
                  </div>
                  {step2Done && step !== 2 && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 border text-xs">Done</Badge>
                  )}
                </div>

                {step === 2 && (
                  <div className="px-5 pb-5">
                    {/* Choose Specialist */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-sm font-medium flex items-center gap-1.5 text-white">
                          <Users className="w-4 h-4 text-gold" />
                          Select Specialist
                        </p>
                        <span className="text-xs text-white/50">
                          {selectedStaff ? selectedStaff.full_name : 'Any Available Specialist'}
                        </span>
                      </div>

                      {staffNotice && (
                        <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                          <div className="flex-1">
                            <p className="font-semibold">Specialist update</p>
                            <p className="mt-0.5 text-amber-200/80">{staffNotice}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStaffNotice('')}
                            className="text-amber-300/70 hover:text-amber-200"
                            aria-label="Dismiss specialist notice"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

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
                              ? 'border-gold bg-gold/15 shadow-gold ring-1 ring-gold text-white'
                              : 'border-white/10 bg-[#181818] hover:border-gold/40 text-white'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            selectedStaff === null ? 'bg-gold text-[#0A0A0A]' : 'bg-white/10 text-white/60'
                          }`}>
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className={`font-semibold text-xs truncate ${selectedStaff === null ? 'text-gold' : 'text-white'}`}>Any Specialist</p>
                              {selectedStaff === null && <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" />}
                            </div>
                            <p className="text-[11px] text-white/50 truncate">Fastest booking</p>
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
                                  ? 'border-gold bg-gold/15 shadow-gold ring-1 ring-gold text-white'
                                  : 'border-white/10 bg-[#181818] hover:border-gold/40 text-white'
                              }`}
                            >
                              {(staff as any).profile_photo_url || (staff as any).avatar_url ? (
                                <img
                                  src={(staff as any).profile_photo_url || (staff as any).avatar_url}
                                  alt={staff.full_name}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gold/30"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gold/15 text-gold font-bold text-xs flex items-center justify-center flex-shrink-0 border border-gold/30">
                                  {staff.full_name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className={`font-semibold text-xs truncate ${isSelected ? 'text-gold' : 'text-white'}`}>{staff.full_name}</p>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" />}
                                </div>
                                <p className="text-[11px] text-white/50 truncate">{staff.primary_role}</p>
                                {staff.specializations && staff.specializations.length > 0 && (
                                  <span className="text-[10px] text-gold/80 truncate block">
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
                    <p className="text-sm font-medium mb-3 text-white">
                      Choose a Date
                      {!step1Done && (
                        <span className="text-xs text-white/40 ml-2">(select services first)</span>
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
                                ? 'border-gold bg-gold text-[#0A0A0A] shadow-gold font-bold scale-105'
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
                              <span className="text-[9px] text-white/30 mt-0.5">OFF</span>
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
                              onUnavailable={(time) => {
                                setWaitlistTime(time);
                                setWaitlistSubmitted(false);
                              }}
                            />
                            <SlotGroup
                              label="Afternoon"
                              icon={Sunset}
                              iconClass="text-orange-500"
                              slots={slotGroups.afternoon}
                              selected={selectedTime}
                              onSelect={setSelectedTime}
                              onUnavailable={(time) => {
                                setWaitlistTime(time);
                                setWaitlistSubmitted(false);
                              }}
                            />
                            <SlotGroup
                              label="Evening"
                              icon={Moon}
                              iconClass="text-indigo-500"
                              slots={slotGroups.evening}
                              selected={selectedTime}
                              onSelect={setSelectedTime}
                              onUnavailable={(time) => {
                                setWaitlistTime(time);
                                setWaitlistSubmitted(false);
                              }}
                            />
                            <div className="flex items-center gap-3 mt-3 text-xs text-white/50 font-inter">
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
                                Booked · tap to join waitlist
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

                  {bookingOffer && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2.5 mb-2">
                      <Tag className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                      <span>
                        Offer: <strong className="text-foreground">{bookingOffer.title || bookingOffer.code}</strong>
                        {bookingOffer.code ? ` (${bookingOffer.code})` : ''}
                      </span>
                    </div>
                  )}

                  {bookingPackage && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2.5 mb-2">
                      <PackageIcon className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                      <span>
                        Package: <strong className="text-foreground">{bookingPackage.name}</strong>
                      </span>
                    </div>
                  )}

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

      {waitlistTime && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Join waitlist"
          onClick={() => setWaitlistTime('')}
        >
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/40 bg-[#141414] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.8)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Unavailable slot</p>
                <h3 className="mt-1 font-playfair text-xl font-bold">
                  Join the waitlist
                </h3>
                <p className="mt-1 text-xs text-white/50">
                  {selectedDate || 'No date chosen'} at {formatTime12h(waitlistTime)}
                  {selectedStaff ? ` · ${selectedStaff.full_name}` : ' · Any specialist'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWaitlistTime('')}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/60 hover:text-white"
                aria-label="Close waitlist"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-[#0A0A0A] p-3 text-[11px] text-white/60">
              <p><span className="text-white/35">Shop:</span> {waitlistRequest.shop_name || '—'} <span className="text-white/25">({waitlistRequest.shop_id})</span></p>
              <p><span className="text-white/35">Services:</span> {waitlistRequest.service_names.join(', ') || '—'} <span className="text-white/25">({waitlistRequest.service_ids.join(', ') || 'none'})</span></p>
              <p><span className="text-white/35">Specialist:</span> {waitlistRequest.staff_name || 'Any'} <span className="text-white/25">({waitlistRequest.staff_id || 'none'})</span></p>
              <p><span className="text-white/35">Date / time:</span> {waitlistRequest.date || '—'} · {waitlistRequest.time || '—'}</p>
              <p><span className="text-white/35">Customer:</span> {waitlistRequest.customer_name || '—'} · {waitlistRequest.customer_phone || '—'} · {waitlistRequest.customer_email || '—'}</p>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-200">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <span>
                Demo request: this salon has no persistent customer waitlist storage, so nothing is saved and no SMS,
                WhatsApp or email notification is sent. Send the details to the salon yourself using the options below.
              </span>
            </div>

            {waitlistSubmitted && (
              <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] text-emerald-300">
                Request reviewed. Use WhatsApp or Copy details to send it to the salon — no notification has been sent
                automatically.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {waitlistWhatsAppUrl ? (
                <a
                  href={waitlistWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/40 px-4 py-2.5 text-xs font-semibold text-gold transition-colors hover:bg-gold hover:text-[#0A0A0A]"
                >
                  <Bell className="w-3.5 h-3.5" /> Send request on WhatsApp
                </a>
              ) : (
                <span className="rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/40">
                  No WhatsApp number published
                </span>
              )}
              <button
                type="button"
                onClick={handleCopyWaitlist}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-white/70 transition-colors hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" /> Copy request details
              </button>
              <button
                type="button"
                onClick={() => setWaitlistSubmitted(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-[#0A0A0A] transition-opacity hover:opacity-90"
              >
                Review request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
