
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, Calendar, Clock, Home, Store, IndianRupee,
  AlertCircle, XCircle, Loader2, MapPin, Phone, Scissors,
  RefreshCw, ArrowRight, ChevronRight, Star, User, Timer
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import { acceptSuggestedTime, rejectSuggestedTime, addReview } from '../../lib/api';

type BookingStatus = 'pending' | 'suggested' | 'confirmed' | 'completed' | 'cancelled';

const TIMELINE_STEPS = [
  { key: 'pending',   label: 'Request Sent', icon: Clock },
  { key: 'confirmed', label: 'Confirmed',     icon: CheckCircle },
  { key: 'completed', label: 'Completed',     icon: Star },
];

function getTimelineState(status: BookingStatus): number {
  if (status === 'pending' || status === 'suggested') return 0;
  if (status === 'confirmed') return 1;
  if (status === 'completed') return 2;
  return -1;
}

function useCountdown(dateStr: string, timeStr: string) {
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, past: false });
  useEffect(() => {
    if (!dateStr || !timeStr) return;
    function calc() {
      const diff = new Date(`${dateStr}T${timeStr}`).getTime() - Date.now();
      if (diff <= 0) { setParts({ days: 0, hours: 0, minutes: 0, seconds: 0, past: true }); return; }
      const s = Math.floor(diff / 1000);
      setParts({ days: Math.floor(s/86400), hours: Math.floor((s%86400)/3600), minutes: Math.floor((s%3600)/60), seconds: s%60, past: false });
    }
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, [dateStr, timeStr]);
  return parts;
}

function CountdownDisplay({ date, time }: { date: string; time: string }) {
  const { days, hours, minutes, seconds, past } = useCountdown(date, time);
  if (past) return (
    <div className="flex items-center gap-2 text-sm text-white/40 bg-white/5 px-4 py-2.5 rounded-xl border border-white/8 font-inter">
      <Timer className="w-4 h-4" /> Appointment time has passed
    </div>
  );
  return (
    <div>
      <p className="text-[10px] text-white/30 mb-2 font-medium uppercase tracking-widest font-inter">Appointment in</p>
      <div className="flex items-center gap-2">
        {[{val:days,l:'d'},{val:hours,l:'h'},{val:minutes,l:'m'},{val:seconds,l:'s'}].map(({val,l},i)=>(
          <div key={l} className="flex items-center gap-2">
            <div className="min-w-[44px] text-center bg-gold/10 border border-gold/20 rounded-xl px-2 py-2">
              <p className="text-xl font-bold text-gold leading-none tabular-nums">{String(val).padStart(2,'0')}</p>
              <p className="text-[9px] text-gold/50 uppercase mt-0.5 font-semibold">{l}</p>
            </div>
            {i<3&&<span className="text-gold/30 font-bold text-lg -mt-2">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusTimeline({ status }: { status: BookingStatus }) {
  const activeStep = getTimelineState(status);
  if (status === 'cancelled') return (
    <div className="flex items-center gap-3 p-4 bg-red-400/8 border border-red-400/20 rounded-xl">
      <div className="w-10 h-10 bg-red-400/15 rounded-full flex items-center justify-center flex-shrink-0"><XCircle className="w-5 h-5 text-red-400" /></div>
      <div>
        <p className="font-playfair font-semibold text-red-300">Booking Cancelled</p>
        <p className="text-xs text-red-400/60 font-inter">This booking has been cancelled</p>
      </div>
    </div>
  );
  return (
    <div className="flex items-center gap-0 w-full">
      {TIMELINE_STEPS.map((step, i) => {
        const Icon = step.icon; const isDone = activeStep > i; const isActive = activeStep === i;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone?'bg-gold border-gold shadow-gold':''} ${isActive?'bg-gold/20 border-gold ring-4 ring-gold/10':''} ${!isDone&&!isActive?'bg-[#1E1E1E] border-white/15':''}`}>
                <Icon className={`w-4 h-4 ${isDone?'text-[#0A0A0A]':isActive?'text-gold':'text-white/20'}`} />
              </div>
              <p className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap font-inter ${isDone?'text-gold':isActive?'text-gold':'text-white/20'}`}>{step.label}</p>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 -mt-5 mx-1 rounded transition-all ${isDone?'bg-gold':'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const STATUS_CONFIG: Record<BookingStatus, { icon: any; border: string; iconBg: string; title: string; subtitle: string; }> = {
  pending:   { icon: Clock,         border: 'border-gold/20',     iconBg: 'bg-gold/10 text-gold',          title: 'Awaiting Confirmation',  subtitle: 'Your request has been sent to the salon. They will confirm shortly.' },
  suggested: { icon: AlertCircle,   border: 'border-blue-400/25', iconBg: 'bg-blue-400/15 text-blue-400', title: 'New Time Suggested',      subtitle: 'The salon owner has proposed an alternative appointment time.' },
  confirmed: { icon: CheckCircle,   border: 'border-emerald-400/25',iconBg:'bg-emerald-400/15 text-emerald-400',title:'Booking Confirmed!', subtitle: 'Your appointment is all set. We look forward to seeing you!' },
  completed: { icon: Star,          border: 'border-gold/20',     iconBg: 'bg-gold/15 text-gold',          title: 'Service Completed',      subtitle: 'Thank you for visiting! We hope you enjoyed the experience.' },
  cancelled: { icon: XCircle,       border: 'border-red-400/20',  iconBg: 'bg-red-400/15 text-red-400',   title: 'Booking Cancelled',      subtitle: 'This booking has been cancelled. You can make a new booking anytime.' },
};

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<'accept'|'reject'|null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [existingReview, setExistingReview] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadBookingDetails = useCallback(async (silent = false) => {
    if (!bookingId) return;
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase.from('bookings').select('*, shops(*)').eq('id', bookingId).single();
      if (error) throw error;
      setBooking(data); setShop(data.shops); setLastRefreshed(new Date());
    } catch (error: any) {
      if (!silent) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); navigate('/'); }
    } finally { setLoading(false); }
  }, [bookingId, navigate, toast]);

  const loadExistingReview = useCallback(async () => {
    if (!bookingId) return;
    setReviewLoading(true);
    try {
      const { data } = await supabase.from('reviews').select('*').eq('booking_id', bookingId).maybeSingle();
      setExistingReview(data || null);
    } catch {}
    finally { setReviewLoading(false); }
  }, [bookingId]);

  async function handleSubmitReview() {
    if (!booking || !shop || selectedRating === 0) return;
    setSubmittingReview(true);
    try {
      const review = await addReview({ shop_id: shop.id, booking_id: booking.id, customer_name: booking.customer_name, rating: selectedRating, comment: reviewComment.trim() || undefined });
      setExistingReview(review);
      toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.' });
    } catch (err: any) {
      toast({ title: 'Could not submit review', description: err.message, variant: 'destructive' });
    } finally { setSubmittingReview(false); }
  }

  useEffect(() => { loadBookingDetails(); }, [loadBookingDetails]);
  useEffect(() => { if (booking?.status === 'completed') loadExistingReview(); }, [booking?.status, loadExistingReview]);
  useEffect(() => {
    const id = setInterval(() => { if (booking?.status === 'pending' || booking?.status === 'suggested') loadBookingDetails(true); }, 30000);
    return () => clearInterval(id);
  }, [booking?.status, loadBookingDetails]);

  async function handleAccept() {
    if (!bookingId) return; setProcessing('accept');
    try { await acceptSuggestedTime(bookingId); toast({ title: 'Time Accepted!', description: 'Booking confirmed.' }); await loadBookingDetails(true); }
    catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setProcessing(null); }
  }

  async function handleReject() {
    if (!bookingId) return; setProcessing('reject');
    try { await rejectSuggestedTime(bookingId); toast({ title: 'Suggestion Rejected', variant: 'destructive' }); await loadBookingDetails(true); }
    catch (err: any) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setProcessing(null); }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#0A0A0A]">
      <div className="w-14 h-14 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center mb-4">
        <Loader2 className="w-7 h-7 animate-spin text-gold" />
      </div>
      <p className="text-white/30 font-inter text-sm">Loading booking…</p>
    </div>
  );

  if (!booking || !shop) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center bg-[#0A0A0A] min-h-screen">
      <XCircle className="w-14 h-14 mx-auto mb-4 text-white/15" />
      <h2 className="font-playfair font-bold text-white text-xl mb-2">Booking Not Found</h2>
      <p className="text-white/35 mb-6 font-inter text-sm">This booking doesn't exist.</p>
      <Button onClick={() => navigate('/')}>Back to Home</Button>
    </div>
  );

  const status = booking.status as BookingStatus;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const services: any[] = booking.services || [];
  const finalDate = booking.final_date || booking.requested_date;
  const finalTime = booking.final_time || booking.requested_time;
  const showCountdown = status === 'confirmed' && finalDate && finalTime;

  function fdt(date: string, time: string) {
    const d = new Date(`${date}T${time}`);
    return { date: d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) };
  }

  const requested = fdt(booking.requested_date, booking.requested_time);
  const suggested = booking.suggested_date ? fdt(booking.suggested_date, booking.suggested_time) : null;
  const confirmed = booking.final_date ? fdt(booking.final_date, booking.final_time) : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* Ref + refresh */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] text-white/25 font-medium uppercase tracking-widest font-inter">Booking Reference</p>
            <p className="font-mono text-sm font-bold text-gold">#{booking.id.slice(0,8).toUpperCase()}</p>
          </div>
          <button onClick={() => loadBookingDetails(true)}
            className="flex items-center gap-1.5 text-xs text-white/25 hover:text-gold transition-colors font-inter">
            <RefreshCw className="w-3 h-3" />
            {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </button>
        </div>

        {/* Status hero */}
        <div className={`nexora-card rounded-2xl p-6 mb-5 border-2 ${config.border}`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
              <StatusIcon className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-playfair font-bold text-white text-xl mb-1">{config.title}</h1>
              <p className="text-sm text-white/40 leading-relaxed font-inter">{config.subtitle}</p>
              {(status === 'pending' || status === 'suggested') && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-white/25 font-inter">
                  <span className="relative flex w-2 h-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
                  </span>
                  Auto-refreshing every 30 seconds
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="nexora-card rounded-2xl p-6 mb-5">
          <p className="font-inter text-[10px] text-white/25 font-medium uppercase tracking-widest mb-5">Booking Progress</p>
          <StatusTimeline status={status} />
        </div>

        {/* Countdown */}
        {showCountdown && (
          <div className="nexora-card border-gold/15 rounded-2xl p-6 mb-5">
            <CountdownDisplay date={finalDate} time={finalTime} />
          </div>
        )}

        {/* Suggested time action */}
        {status === 'suggested' && suggested && (
          <div className="nexora-card border-blue-400/25 rounded-2xl p-6 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              <h2 className="font-playfair font-semibold text-blue-300">Salon Suggested a New Time</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 bg-[#0A0A0A]/60 rounded-xl border border-white/10">
                <p className="text-[10px] text-white/25 font-medium mb-1 font-inter uppercase tracking-wide">Your Request</p>
                <p className="font-semibold text-sm text-white font-inter">{requested.date}</p>
                <p className="text-sm text-white/40 font-inter">{requested.time}</p>
              </div>
              <div className="p-3 bg-blue-400/10 rounded-xl border-2 border-blue-400/35">
                <p className="text-[10px] text-blue-400 font-semibold mb-1 flex items-center gap-1 font-inter uppercase tracking-wide">
                  <ChevronRight className="w-3 h-3" /> Suggested
                </p>
                <p className="font-bold text-sm text-blue-300 font-inter">{suggested.date}</p>
                <p className="text-sm text-blue-400 font-inter">{suggested.time}</p>
              </div>
            </div>
            <p className="text-sm text-blue-400/60 mb-4 font-inter">Accept the suggested time or cancel this booking?</p>
            <div className="flex gap-3">
              <button onClick={handleAccept} disabled={processing !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-all disabled:opacity-50 font-inter">
                {processing==='accept'?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle className="w-4 h-4"/>} Accept
              </button>
              <button onClick={handleReject} disabled={processing !== null}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-400/30 text-red-400 hover:bg-red-400/8 font-semibold text-sm transition-all disabled:opacity-50 font-inter">
                {processing==='reject'?<Loader2 className="w-4 h-4 animate-spin"/>:<XCircle className="w-4 h-4"/>} Cancel
              </button>
            </div>
          </div>
        )}

        {/* Appointment details */}
        <div className="nexora-card rounded-2xl p-6 mb-5">
          <h2 className="font-playfair font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gold" /> Appointment Details
          </h2>
          <div className="flex items-start gap-3 p-3 bg-gold/5 border border-gold/15 rounded-xl mb-4">
            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center text-[#0A0A0A] font-bold text-sm flex-shrink-0">{shop.name.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-playfair font-semibold text-white">{shop.name}</p>
              <div className="flex items-center gap-1 text-xs text-white/35 mt-0.5 font-inter"><MapPin className="w-3 h-3 text-gold/50 flex-shrink-0"/><span className="truncate">{shop.address}, {shop.city}</span></div>
              {shop.contact_number && <div className="flex items-center gap-1 text-xs text-white/35 mt-0.5 font-inter"><Phone className="w-3 h-3 text-gold/50"/>{shop.contact_number}</div>}
            </div>
          </div>
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl">
              <div className="w-8 h-8 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center flex-shrink-0"><Calendar className="w-3.5 h-3.5 text-gold/70"/></div>
              <div><p className="text-[10px] text-white/25 font-medium uppercase tracking-wide font-inter">Requested</p><p className="text-sm font-semibold text-white font-inter">{requested.date}</p><p className="text-xs text-white/35 font-inter">{requested.time}</p></div>
            </div>
            {suggested && status !== 'confirmed' && status !== 'completed' && (
              <div className="flex items-center gap-3 p-3 bg-blue-400/8 border border-blue-400/20 rounded-xl">
                <div className="w-8 h-8 bg-blue-400/15 rounded-xl flex items-center justify-center flex-shrink-0"><AlertCircle className="w-4 h-4 text-blue-400"/></div>
                <div><p className="text-xs text-blue-400 font-semibold font-inter">Suggested</p><p className="text-sm font-semibold text-blue-300 font-inter">{suggested.date}</p><p className="text-xs text-blue-400 font-inter">{suggested.time}</p></div>
              </div>
            )}
            {confirmed && (status === 'confirmed' || status === 'completed') && (
              <div className="flex items-center gap-3 p-3 bg-emerald-400/8 border border-emerald-400/20 rounded-xl">
                <div className="w-8 h-8 bg-emerald-400/15 rounded-xl flex items-center justify-center flex-shrink-0"><CheckCircle className="w-4 h-4 text-emerald-400"/></div>
                <div><p className="text-xs text-emerald-400 font-semibold font-inter">Confirmed</p><p className="text-sm font-bold text-emerald-300 font-inter">{confirmed.date}</p><p className="text-xs text-emerald-400 font-inter">{confirmed.time}</p></div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/8 mb-3">
            {booking.service_type === 'home' ? (
              <>
                <Home className="w-4 h-4 text-gold flex-shrink-0"/>
                <div>
                  <p className="text-sm font-medium text-white font-inter">Home Service</p>
                  {booking.customer_address && <p className="text-xs text-white/35 font-inter">{booking.customer_address}</p>}
                </div>
              </>
            ) : (
              <>
                <Store className="w-4 h-4 text-gold flex-shrink-0"/>
                <p className="text-sm font-medium text-white font-inter">In-Shop Visit</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/8">
            <User className="w-4 h-4 text-gold/50 flex-shrink-0"/>
            <div><p className="text-sm font-semibold text-white font-inter">{booking.customer_name}</p><p className="text-xs text-white/35 font-inter">{booking.customer_email}</p>{booking.customer_phone&&<p className="text-xs text-white/35 font-inter">{booking.customer_phone}</p>}</div>
          </div>
        </div>

        {/* Services & price */}
        <div className="nexora-card rounded-2xl p-6 mb-5">
          <h2 className="font-playfair font-semibold text-white mb-4 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gold" /> Services & Price
          </h2>
          <div className="space-y-2.5 mb-4">
            {services.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/3 border border-white/8 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center flex-shrink-0"><Scissors className="w-3.5 h-3.5 text-gold"/></div>
                  <div><p className="text-sm font-semibold text-white font-inter">{s.name}</p><div className="flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3 text-white/25"/><p className="text-xs text-white/25 font-inter">{s.duration_minutes} mins</p></div></div>
                </div>
                <div className="flex items-center gap-0.5 font-bold text-base text-gold"><IndianRupee className="w-3.5 h-3.5"/>{s.price}</div>
              </div>
            ))}
          </div>
          <div className="h-px bg-white/8 mb-4"/>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm font-inter"><span className="text-white/40">Services ({services.length})</span><span className="font-medium text-white">₹{booking.service_amount}</span></div>
            {booking.home_service_charge > 0 && (<div className="flex justify-between text-sm font-inter"><span className="text-white/40 flex items-center gap-1"><Home className="w-3 h-3"/> Home Charge</span><span className="font-medium text-gold">+₹{booking.home_service_charge}</span></div>)}
            <div className="flex justify-between text-sm font-inter"><span className="text-white/40 flex items-center gap-1"><Clock className="w-3 h-3"/> Duration</span><span className="font-medium text-white">~{services.reduce((acc:number,s:any)=>acc+(s.duration_minutes||0),0)} mins</span></div>
            <div className="h-px bg-white/8"/>
            <div className="flex items-center justify-between">
              <span className="font-playfair font-bold text-base text-white">Total</span>
              <div className="flex items-center gap-0.5 text-2xl font-bold text-gold"><IndianRupee className="w-5 h-5"/>{booking.total_amount}</div>
            </div>
            <div className="p-2.5 bg-white/3 border border-white/8 rounded-xl flex items-center justify-between text-xs font-inter">
              <span className="text-white/30">Payment</span>
              <span className={`px-2.5 py-1 rounded-full border font-semibold text-[10px] ${booking.payment_status==='paid'?'bg-emerald-400/10 text-emerald-400 border-emerald-400/20':'bg-gold/10 text-gold border-gold/25'}`}>
                {booking.payment_status==='paid'?'Paid':'Pay at Salon'}
              </span>
            </div>
          </div>
        </div>

        {/* Pending info */}
        {status === 'pending' && (
          <div className="nexora-card border-gold/15 rounded-2xl p-5 mb-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5"/>
              <div>
                <p className="font-playfair font-semibold text-white text-sm mb-1">What happens next?</p>
                <ul className="text-xs text-white/40 space-y-1 font-inter">
                  <li>• The salon owner will review your request</li>
                  <li>• They may accept or suggest a different time</li>
                  <li>• Refresh this page to see updates</li>
                  <li>• Bookmark this URL to check back later</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Review */}
        {status === 'completed' && (
          <div className="nexora-card rounded-2xl p-6 mb-5">
            <h2 className="font-playfair font-semibold text-white mb-1 flex items-center gap-2"><Star className="w-4 h-4 text-gold"/> Rate Your Experience</h2>
            <p className="text-xs text-white/30 mb-5 font-inter">Share your experience at {shop.name}</p>
            {reviewLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gold"/></div>
            ) : existingReview ? (
              <div className="bg-gold/8 border border-gold/20 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gold/15 border border-gold/25 rounded-xl flex items-center justify-center flex-shrink-0"><Star className="w-5 h-5 text-gold fill-gold"/></div>
                  <div>
                    <p className="font-playfair font-bold text-gold">You Reviewed This</p>
                    <p className="text-xs text-gold/50 mt-0.5 font-inter">Submitted {new Date(existingReview.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((i)=><Star key={i} className={`w-7 h-7 ${i<=existingReview.rating?'fill-gold text-gold':'text-white/15 fill-white/5'}`}/>)}
                  <span className="ml-2 text-sm font-bold text-gold">{existingReview.rating}/5</span>
                </div>
                {existingReview.comment && (
                  <div className="bg-[#0A0A0A]/60 border border-gold/15 rounded-xl p-3">
                    <p className="text-sm text-white/50 leading-relaxed italic font-inter">"{existingReview.comment}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] text-white/25 font-semibold uppercase tracking-widest mb-3 font-inter">Your Rating</p>
                  <div className="flex items-center gap-2" onMouseLeave={()=>setHoverRating(0)}>
                    {[1,2,3,4,5].map((i)=>{
                      const filled = i<=(hoverRating||selectedRating);
                      return (
                        <button key={i} type="button" onClick={()=>setSelectedRating(i)} onMouseEnter={()=>setHoverRating(i)} className="focus:outline-none transition-transform hover:scale-110 active:scale-95">
                          <Star className={`w-10 h-10 transition-colors ${filled?'fill-gold text-gold':'text-white/15 hover:text-gold/40'}`}/>
                        </button>
                      );
                    })}
                    {(hoverRating>0||selectedRating>0) && (
                      <span className="ml-2 text-base font-bold text-gold font-inter">{['','Poor','Fair','Good','Great','Excellent'][hoverRating||selectedRating]}</span>
                    )}
                  </div>
                  {selectedRating===0 && <p className="text-xs text-white/25 mt-1 font-inter">Click a star to rate</p>}
                </div>
                <div>
                  <label className="text-[10px] text-white/25 font-semibold uppercase tracking-widest block mb-2 font-inter">Comment (optional)</label>
                  <textarea value={reviewComment} onChange={(e)=>setReviewComment(e.target.value)} placeholder="Share your experience…" rows={3} maxLength={500}
                    className="w-full px-3 py-2.5 text-sm border border-white/12 focus:border-gold/50 rounded-xl bg-[#0A0A0A] text-white placeholder-white/20 font-inter outline-none resize-none transition-all"/>
                  <p className="text-xs text-white/25 text-right mt-1 font-inter">{reviewComment.length}/500</p>
                </div>
                <button type="button" onClick={handleSubmitReview} disabled={selectedRating===0||submittingReview}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold rounded-xl transition-all active:scale-[0.98] shadow-gold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-inter">
                  {submittingReview?<><Loader2 className="w-4 h-4 animate-spin"/>Submitting…</>:<><Star className="w-4 h-4 fill-[#0A0A0A]"/>Submit Review</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bookmark link */}
        <div className="nexora-card rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gold mb-0.5 font-inter">Bookmark your booking page</p>
              <p className="text-xs text-white/25 font-mono truncate max-w-[240px]">{window.location.origin}/booking/{booking.id.slice(0,8)}…</p>
            </div>
            <button onClick={()=>navigator.clipboard.writeText(`${window.location.origin}/booking/${booking.id}`)}
              className="flex-shrink-0 text-xs border border-gold/30 text-gold hover:bg-gold/8 px-3 py-1.5 rounded-xl transition-all font-inter">Copy</button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button onClick={()=>navigate('/')}
            className="flex-1 py-3 text-sm font-semibold text-white/50 border border-white/12 hover:border-gold/30 hover:text-gold rounded-xl transition-all font-inter">
            Browse More Salons
          </button>
          {(status==='confirmed'||status==='completed') && (
            <button onClick={()=>navigate(`/shop/${shop.id}`)}
              className="flex-1 py-3 text-sm font-bold text-[#0A0A0A] bg-gold hover:bg-gold-light rounded-xl transition-all shadow-gold flex items-center justify-center gap-2 font-inter">
              Visit Salon <ArrowRight className="w-4 h-4"/>
            </button>
          )}
          {status==='cancelled' && (
            <button onClick={()=>navigate(`/shop/${shop.id}/book`)}
              className="flex-1 py-3 text-sm font-bold text-[#0A0A0A] bg-gold hover:bg-gold-light rounded-xl transition-all shadow-gold flex items-center justify-center gap-2 font-inter">
              Book Again <ArrowRight className="w-4 h-4"/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
