import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Search, Clock, CheckCircle, XCircle, AlertCircle, Star,
  Loader2, Calendar, Store, IndianRupee, Scissors, ChevronRight,
  BookOpen, ArrowRight, Home, X, RefreshCw
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getCustomerBookings } from '../../lib/api';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'suggested' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<string, { label: string; icon: any; goldClass: string; }> = {
  pending:   { label: 'Pending',       icon: Clock,         goldClass: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  suggested: { label: 'Time Suggested',icon: AlertCircle,   goldClass: 'text-blue-400  border-blue-400/30  bg-blue-400/10'  },
  confirmed: { label: 'Confirmed',     icon: CheckCircle,   goldClass: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
  completed: { label: 'Completed',     icon: Star,          goldClass: 'text-gold border-gold/30 bg-gold/10' },
  cancelled: { label: 'Cancelled',     icon: XCircle,       goldClass: 'text-red-400   border-red-400/30   bg-red-400/10'   },
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' }, { value: 'suggested', label: 'Suggested' },
  { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
];

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function getEffectiveDateTime(b: any) {
  return { date: b.final_date || b.suggested_date || b.requested_date, time: b.final_time || b.suggested_time || b.requested_time };
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.goldClass} font-inter`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function BookingCard({ booking, onClick }: { booking: any; onClick: () => void }) {
  const services: any[] = booking.services || [];
  const shop = booking.shops;
  const { date, time } = getEffectiveDateTime(booking);
  return (
    <div onClick={onClick}
      className="nexora-card rounded-2xl p-5 cursor-pointer hover:border-gold/40 transition-all duration-200 group relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-gold" />
            </div>
            <p className="font-playfair font-semibold text-white text-base leading-tight truncate group-hover:text-gold transition-colors">
              {shop?.name || 'Unknown Salon'}
            </p>
          </div>
          {shop?.city && <p className="text-xs text-white/30 ml-10 font-inter">{shop.city}</p>}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="h-px bg-white/8 mb-4" />

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 bg-gold/8 border border-gold/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gold/70" />
          </div>
          <div>
            <p className="text-[10px] text-white/25 font-medium uppercase tracking-wide font-inter mb-0.5">
              {booking.status === 'confirmed' || booking.status === 'completed' ? 'Confirmed' : booking.status === 'suggested' ? 'Suggested' : 'Requested'}
            </p>
            <p className="text-sm font-semibold text-white font-inter">{formatDate(date)}</p>
            <p className="text-xs text-white/40 font-inter">{formatTime(time)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 bg-gold/8 border border-gold/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Scissors className="w-3.5 h-3.5 text-gold/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/25 font-medium uppercase tracking-wide font-inter mb-0.5">Services</p>
            <div className="flex flex-wrap gap-1">
              {services.slice(0, 2).map((s: any, i: number) => (
                <span key={i} className="text-xs bg-white/5 border border-white/10 text-white/60 px-2 py-0.5 rounded-full font-inter">{s.name}</span>
              ))}
              {services.length > 2 && <span className="text-xs text-white/30 font-inter">+{services.length - 2}</span>}
            </div>
          </div>
        </div>
      </div>

      {booking.status === 'suggested' && booking.suggested_date && (
        <div className="flex items-center gap-2 p-2.5 bg-blue-400/8 border border-blue-400/20 rounded-xl mb-3 text-xs text-blue-400 font-inter">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Shop suggested {formatDate(booking.suggested_date)} at {formatTime(booking.suggested_time)} — action needed
        </div>
      )}
      {booking.service_type === 'home' && (
        <div className="flex items-center gap-1.5 text-xs text-gold/60 mb-3 font-inter">
          <Home className="w-3 h-3" /> Home Service
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 text-lg font-bold text-gold">
          <IndianRupee className="w-4 h-4" />{booking.total_amount}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white/30 group-hover:text-gold transition-all font-inter">
          View Details <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function EmailLookupForm({ onSubmit, loading }: { onSubmit: (email: string) => void; loading: boolean }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (email.trim()) onSubmit(email.trim().toLowerCase()); }
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-gold/10 border border-gold/25 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-gold" />
          </div>
        </div>
        <div className="gold-divider w-12 mx-auto mb-6" />
        <h2 className="font-playfair font-bold text-white text-3xl text-center mb-2">Your Bookings</h2>
        <p className="text-white/35 text-center text-sm mb-8 leading-relaxed font-inter">
          Enter the email you used when booking to view all your appointments.
        </p>
        <div className="nexora-card rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-white/40 text-xs font-semibold tracking-wider uppercase mb-2 flex items-center gap-1.5 font-inter">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required autoFocus
                className="w-full bg-[#0A0A0A] border border-white/12 focus:border-gold/50 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm font-inter outline-none transition-all" />
            </div>
            <button type="submit" disabled={loading || !email.trim()}
              className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</> : <><Search className="w-4 h-4" /> Find My Bookings</>}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-white/8 text-xs text-white/20 text-center font-inter">Only bookings with this email will appear.</div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-white/25 mb-3 font-inter">No bookings yet?</p>
          <button onClick={() => navigate('/')}
            className="text-sm text-gold/60 hover:text-gold border border-gold/20 hover:border-gold/40 px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 mx-auto font-inter">
            <Store className="w-4 h-4" /> Browse Salons <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  async function handleSearch(searchEmail: string) {
    setLoading(true); setActiveFilter('all');
    try {
      const data = await getCustomerBookings(searchEmail);
      setEmail(searchEmail); setBookings(data || []); setHasSearched(true);
      if (!data || data.length === 0) toast({ title: 'No bookings found', description: `No appointments for ${searchEmail}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to fetch', variant: 'destructive' });
    } finally { setLoading(false); }
  }

  const filtered = useMemo(() => activeFilter === 'all' ? bookings : bookings.filter((b) => b.status === activeFilter), [bookings, activeFilter]);
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: bookings.length };
    for (const b of bookings) map[b.status] = (map[b.status] || 0) + 1;
    return map;
  }, [bookings]);

  const actionNeeded = bookings.filter((b) => b.status === 'suggested').length;

  if (!hasSearched) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="bg-[#0A0A0A] border-b border-white/8">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <button onClick={() => navigate('/')} className="text-sm text-white/40 hover:text-white/70 transition-colors font-inter">← Home</button>
          </div>
        </div>
        <EmailLookupForm onSubmit={handleSearch} loading={loading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-16">
      {/* Sticky header */}
      <div className="bg-[#0A0A0A] border-b border-white/8 sticky top-[57px] z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-sm text-white/40 hover:text-gold transition-colors flex-shrink-0 font-inter">← Home</button>
            <div className="w-px h-4 bg-white/10" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate font-playfair">My Bookings</p>
              <p className="text-xs text-white/30 truncate font-inter">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => handleSearch(email)} disabled={loading}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-gold transition-colors disabled:opacity-50 font-inter">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={() => { setHasSearched(false); setBookings([]); setEmail(''); }}
              className="text-xs text-white/30 hover:text-gold border border-white/10 hover:border-gold/30 px-3 py-1.5 rounded-lg transition-all font-inter flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Change
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6">
        {actionNeeded > 0 && (
          <div className="flex items-center gap-3 p-4 bg-blue-400/8 border border-blue-400/20 rounded-xl mb-5">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-300 text-sm font-playfair">{actionNeeded} booking{actionNeeded > 1 ? 's' : ''} need your response</p>
              <p className="text-xs text-blue-400/60 mt-0.5 font-inter">Shop suggested an alternate time — accept or decline to continue.</p>
            </div>
            <button onClick={() => setActiveFilter('suggested')}
              className="flex items-center gap-1 text-xs font-semibold text-blue-300 border border-blue-400/30 px-3 py-1.5 rounded-xl hover:bg-blue-400/10 transition-all flex-shrink-0 font-inter">
              View <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total',     value: bookings.length,      color: 'text-white',         bg: 'bg-white/5 border border-white/10' },
            { label: 'Pending',   value: counts.pending || 0,  color: 'text-amber-400',     bg: 'bg-amber-400/8 border border-amber-400/15' },
            { label: 'Confirmed', value: counts.confirmed || 0,color: 'text-emerald-400',   bg: 'bg-emerald-400/8 border border-emerald-400/15' },
            { label: 'Completed', value: counts.completed || 0,color: 'text-gold',          bg: 'bg-gold/8 border border-gold/15' },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-white/30 mt-0.5 font-inter">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1 overflow-x-auto mb-5">
          {STATUS_TABS.map(({ value, label }) => {
            if (value !== 'all' && !counts[value]) return null;
            const isActive = activeFilter === value;
            return (
              <button key={value} onClick={() => setActiveFilter(value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 font-inter ${
                  isActive ? 'bg-gold text-[#0A0A0A] shadow-gold' : 'text-white/40 hover:text-white'
                }`}>
                {label}
                {counts[value] > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[#0A0A0A]/20' : 'bg-white/8'}`}>{counts[value]}</span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-gold" /></div>
            <p className="text-white/30 font-inter text-sm">Fetching your bookings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 bg-gold/8 border border-gold/20 rounded-full flex items-center justify-center mb-5">
              <Calendar className="w-10 h-10 text-gold/30" />
            </div>
            <h3 className="font-playfair font-semibold text-white text-xl mb-2">No Bookings Found</h3>
            <p className="text-white/35 text-sm text-center max-w-xs mb-6 font-inter">
              {activeFilter !== 'all' ? `No ${activeFilter} bookings found.` : `No appointments for ${email}.`}
            </p>
            <div className="flex gap-3">
              {activeFilter !== 'all' && (
                <button onClick={() => setActiveFilter('all')}
                  className="flex items-center gap-2 text-sm text-white/50 border border-white/12 hover:border-gold/30 px-4 py-2.5 rounded-xl transition-all font-inter">
                  <X className="w-4 h-4" /> Clear Filter
                </button>
              )}
              {activeFilter === 'all' && (
                <button onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-sm text-[#0A0A0A] bg-gold hover:bg-gold-light px-5 py-2.5 rounded-xl transition-all font-inter font-bold shadow-gold">
                  <Scissors className="w-4 h-4" /> Book Now
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/25 mb-4 font-inter tracking-wider uppercase">
              {filtered.length} {filtered.length === 1 ? 'booking' : 'bookings'}{activeFilter !== 'all' && ` · ${activeFilter}`}
            </p>
            <div className="space-y-3">
              {filtered.map((booking) => (
                <BookingCard key={booking.id} booking={booking} onClick={() => navigate(`/booking/confirmation/${booking.id}`)} />
              ))}
            </div>
          </>
        )}

        {hasSearched && bookings.length > 0 && (
          <div className="mt-8 p-6 bg-[#141414] border border-gold/15 rounded-2xl text-center">
            <p className="font-playfair font-semibold text-white mb-1">Book Again</p>
            <p className="text-sm text-white/35 mb-4 font-inter">Discover more premium salons near you</p>
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm font-bold text-[#0A0A0A] bg-gold hover:bg-gold-light px-5 py-2.5 rounded-xl transition-all shadow-gold mx-auto font-inter">
              <Store className="w-4 h-4" /> Browse Salons <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
