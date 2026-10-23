import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle, XCircle, AlertCircle, Loader2, Scissors,
  MapPin, Phone, Home, Store, IndianRupee, Calendar, ArrowLeft,
  RefreshCw, Check, X, ChevronRight, Star, Sparkles, User, Mail
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'suggested' | 'confirmed' | 'completed' | 'cancelled';

interface BookingData {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  service_type: 'in-shop' | 'home';
  services: Array<{ id: string; name: string; price: number; duration_minutes: number }>;
  requested_date: string;
  requested_time: string;
  suggested_date: string | null;
  suggested_time: string | null;
  final_date: string | null;
  final_time: string | null;
  status: BookingStatus;
  service_amount: number;
  home_service_charge: number;
  total_amount: number;
  payment_status: string;
  created_at: string;
  shops: {
    id: string;
    name: string;
    address: string;
    city: string;
    contact_number: string | null;
    opening_time: string;
    closing_time: string;
  };
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, {
  label: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
  description: string;
  step: number;
}> = {
  pending: {
    label: 'Pending Confirmation',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    description: 'Your booking request has been received. The shop will confirm your appointment soon.',
    step: 1,
  },
  'suggested': {
    label: 'New Time Suggested',
    icon: AlertCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    description: "The shop has suggested an alternate date/time. Please review and accept or decline.",
    step: 1,
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    description: 'Great news! Your appointment is confirmed. See you at the shop.',
    step: 2,
  },
  completed: {
    label: 'Completed',
    icon: Sparkles,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    description: 'Your appointment is complete. We hope you had a great experience!',
    step: 3,
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    description: 'This booking has been cancelled.',
    step: 0,
  },
};

const TIMELINE_STEPS = [
  { label: 'Requested', step: 0 },
  { label: 'Confirmed', step: 2 },
  { label: 'Completed', step: 3 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime12h(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function StatusTimeline({ status }: { status: BookingStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-red-600 font-medium text-sm">This booking was cancelled</p>
      </div>
    );
  }

  const currentStep = STATUS_CONFIG[status]?.step ?? 0;

  return (
    <div className="flex items-center gap-2">
      {TIMELINE_STEPS.map((item, i) => {
        const done = currentStep > item.step || (currentStep === item.step && currentStep > 0);
        const active = currentStep === item.step && item.step > 0;
        const future = currentStep < item.step;

        return (
          <div key={item.label} className="flex items-center gap-2 flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                done
                  ? 'bg-emerald-500 border-emerald-500'
                  : active
                  ? 'bg-primary border-primary'
                  : 'bg-white border-border'
              }`}>
                {done ? (
                  <Check className="w-4 h-4 text-white" />
                ) : active ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <p className={`text-[10px] font-medium mt-1 ${
                done ? 'text-emerald-600' : active ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </p>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 -mt-4 rounded transition-all ${
                currentStep > item.step ? 'bg-emerald-400' : 'bg-border'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Time Suggested Banner ────────────────────────────────────────────────────

function TimeSuggestedBanner({
  booking,
  onAccept,
  onDecline,
  loading,
}: {
  booking: BookingData;
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
}) {
  return (
    <Card className="border-2 border-blue-300 bg-blue-50 p-5 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-bl-full opacity-60" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <p className="font-bold text-blue-800">New Time Suggested by Shop</p>
        </div>

        <p className="text-blue-700 text-sm mb-4">
          The shop is unable to accommodate your original time and has suggested an alternative.
          Please accept or decline the new slot.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/70 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Your Original Request</p>
            <p className="font-semibold text-sm">{formatDateShort(booking.requested_date)}</p>
            <p className="text-muted-foreground text-xs">{formatTime12h(booking.requested_time)}</p>
          </div>
          <div className="bg-white border-2 border-blue-400 rounded-xl p-3 shadow-sm">
            <p className="text-xs text-blue-600 font-semibold mb-1">Suggested New Slot</p>
            <p className="font-bold text-sm text-blue-800">
              {booking.suggested_date ? formatDateShort(booking.suggested_date) : '—'}
            </p>
            <p className="text-blue-600 text-xs font-medium">
              {booking.suggested_time ? formatTime12h(booking.suggested_time) : '—'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Accept New Time
          </Button>
          <Button
            onClick={onDecline}
            disabled={loading}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 gap-2"
          >
            <X className="w-4 h-4" />
            Decline
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    if (id) loadBooking();
  }, [id]);

  async function loadBooking() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          shops(id, name, address, city, contact_number, opening_time, closing_time)
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;
      setBooking(data as BookingData);
      setLastRefreshed(new Date());
    } catch (err: any) {
      toast({
        title: 'Booking Not Found',
        description: 'Could not load booking details. Please check your booking ID.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptSuggestion() {
    if (!booking) return;
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          final_date: booking.suggested_date,
          final_time: booking.suggested_time,
        })
        .eq('id', booking.id);

      if (error) throw error;
      toast({ title: 'Appointment Confirmed!', description: 'Your new slot has been accepted.' });
      await loadBooking();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeclineSuggestion() {
    if (!booking) return;
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);

      if (error) throw error;
      toast({ title: 'Booking Cancelled', description: 'The suggested time has been declined.' });
      await loadBooking();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground font-medium">Loading booking details…</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/30 px-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Booking Not Found</h2>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          No booking was found with this ID. Please check your confirmation email.
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  // ─── Derived data ─────────────────────────────────────────────────────────────

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const displayDate = booking.final_date || booking.suggested_date || booking.requested_date;
  const displayTime = booking.final_time || booking.suggested_time || booking.requested_time;

  const totalDuration = (booking.services || []).reduce(
    (sum, s) => sum + (s.duration_minutes || 0),
    0
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-secondary/20">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            BarberHub
          </button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>

          <button
            onClick={loadBooking}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── Status Hero ──────────────────────────────────────────────────── */}
        <Card className={`p-6 border-2 ${statusConfig.border} ${statusConfig.bg} relative overflow-hidden`}>
          {/* Decorative circle */}
          <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20 ${statusConfig.bg}`} />

          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl ${statusConfig.bg} border ${statusConfig.border} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <StatusIcon className={`w-7 h-7 ${statusConfig.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge className={`${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border} font-bold text-xs`}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {statusConfig.description}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-5 pt-5 border-t border-border/50">
              <StatusTimeline status={booking.status} />
            </div>
          </div>
        </Card>

        {/* ── Time Suggested Action ─────────────────────────────────────────── */}
        {booking.status === 'suggested' && (
          <TimeSuggestedBanner
            booking={booking}
            onAccept={handleAcceptSuggestion}
            onDecline={handleDeclineSuggestion}
            loading={actionLoading}
          />
        )}

        {/* ── Appointment Details ───────────────────────────────────────────── */}
        <Card className="p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Appointment Details
          </h3>

          <div className="space-y-3">
            {/* Date & Time */}
            <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
              booking.status === 'confirmed' || booking.status === 'completed'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-border bg-secondary/30'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                booking.status === 'confirmed' || booking.status === 'completed'
                  ? 'bg-emerald-100'
                  : 'bg-muted'
              }`}>
                <Clock className={`w-5 h-5 ${
                  booking.status === 'confirmed' || booking.status === 'completed'
                    ? 'text-emerald-600'
                    : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {booking.status === 'confirmed' || booking.status === 'completed'
                    ? 'Confirmed Appointment'
                    : booking.status === 'pending'
                    ? 'Requested Time'
                    : 'Appointment Time'}
                </p>
                <p className="font-bold text-base">{formatDate(displayDate)}</p>
                <p className={`text-sm font-semibold ${
                  booking.status === 'confirmed' ? 'text-emerald-600' : 'text-muted-foreground'
                }`}>
                  {formatTime12h(displayTime)}
                </p>
              </div>
            </div>

            {/* Service Type */}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {booking.service_type === 'home' ? (
                  <Home className="w-4 h-4" />
                ) : (
                  <Store className="w-4 h-4" />
                )}
                Service Type
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {booking.service_type === 'home' ? '🏠 Home Service' : '💈 In-Shop'}
              </Badge>
            </div>

            {/* Booking ID */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Booking ID</span>
              <span className="text-xs font-mono bg-secondary px-2.5 py-1 rounded-lg text-muted-foreground">
                {booking.id.slice(0, 8).toUpperCase()}…
              </span>
            </div>
          </div>
        </Card>

        {/* ── Shop Info ────────────────────────────────────────────────────── */}
        <Card className="p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary" />
            Shop Details
          </h3>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center font-black text-primary text-xl flex-shrink-0">
              {booking.shops?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base">{booking.shops?.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {booking.shops?.address}, {booking.shops?.city}
              </div>
              {booking.shops?.contact_number && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  {booking.shops.contact_number}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => navigate(`/shop/${booking.shop_id}`)}
            >
              View Shop
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            {booking.shops?.contact_number && (
              <a
                href={`tel:${booking.shops.contact_number}`}
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Call Shop
                </Button>
              </a>
            )}
          </div>
        </Card>

        {/* ── Services ─────────────────────────────────────────────────────── */}
        <Card className="p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" />
            Services & Payment
          </h3>

          <div className="space-y-2.5 mb-4">
            {(booking.services || []).map((svc, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">{svc.duration_minutes} mins</p>
                  </div>
                </div>
                <p className="font-semibold text-primary">₹{svc.price}</p>
              </div>
            ))}
          </div>

          {booking.service_type === 'home' && booking.home_service_charge > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground py-2 border-t border-border">
              <span className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" />
                Home Service Charge
              </span>
              <span className="text-emerald-600 font-semibold">+₹{booking.home_service_charge}</span>
            </div>
          )}

          <Separator className="my-3" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <div className="flex items-center gap-0.5 text-2xl font-black text-primary">
                <IndianRupee className="w-5 h-5" />
                {booking.total_amount}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">~{totalDuration} mins total</p>
              <Badge
                className={`text-xs ${
                  booking.payment_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {booking.payment_status === 'paid' ? '✓ Paid' : 'Pay at Venue'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* ── Customer Info ─────────────────────────────────────────────────── */}
        <Card className="p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Customer Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-7 h-7 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-semibold">{booking.customer_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <div className="w-7 h-7 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-semibold">{booking.customer_email}</p>
              </div>
            </div>
            {booking.customer_phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-semibold">{booking.customer_phone}</p>
                </div>
              </div>
            )}
            {booking.customer_address && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service Address</p>
                  <p className="font-semibold">{booking.customer_address}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ── Review CTA (only for completed) ──────────────────────────────── */}
        {booking.status === 'completed' && (
          <Card className="p-5 border-2 border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold">How was your experience?</p>
                <p className="text-xs text-muted-foreground mt-0.5">Help others by leaving a review</p>
              </div>
            </div>
            <Button
              className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => navigate(`/my-bookings`)}
            >
              <Star className="w-4 h-4 mr-2" />
              Leave a Review
            </Button>
          </Card>
        )}

        {/* ── Book Again ────────────────────────────────────────────────────── */}
        {(booking.status === 'completed' || booking.status === 'cancelled') && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/shop/${booking.shop_id}/book`)}
          >
            <Scissors className="w-4 h-4 mr-2" />
            Book Again at {booking.shops?.name}
          </Button>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Powered by{' '}
          <button onClick={() => navigate('/')} className="text-primary font-semibold hover:underline">
            BarberHub
          </button>
          {' '}· Booking ID: {booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  );
}
