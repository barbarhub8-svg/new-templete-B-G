import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, TrendingUp, Clock, IndianRupee, Star,
  Loader2, Store, CheckCircle, XCircle, AlertCircle,
  ArrowRight, RefreshCw, Users, Scissors, MapPin,
  Home, Zap, ChevronRight, Award, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { getShopByOwnerId, getShopBookings, getWalletBalance, acceptBooking, rejectBooking } from '../../lib/api';
import { useToast } from '../../hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  todayBookings: number;
  averageRating: number;
  totalReviews: number;
  walletBalance: number;
  todayEarnings: number;
  weeklyEarnings: number;
}

interface ChartPoint {
  day: string;
  earnings: number;
  bookings: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function buildWeeklyChartData(bookings: any[]): ChartPoint[] {
  const days: ChartPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayBookings = bookings.filter((b) => {
      const bDate = b.final_date || b.requested_date;
      return bDate === dateStr && b.status === 'completed';
    });
    days.push({
      day: dayLabel,
      earnings: dayBookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0),
      bookings: dayBookings.length,
    });
  }
  return days;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-400',   bg: 'bg-amber-400/12 border border-amber-400/25',   dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmed', color: 'text-emerald-400', bg: 'bg-emerald-400/12 border border-emerald-400/25', dot: 'bg-emerald-400' },
  suggested: { label: 'Suggested', color: 'text-blue-400',    bg: 'bg-blue-400/12 border border-blue-400/25',    dot: 'bg-blue-400' },
  completed: { label: 'Completed', color: 'text-gold',         bg: 'bg-gold/12 border border-gold/25',           dot: 'bg-gold' },
  cancelled: { label: 'Cancelled', color: 'text-red-400',     bg: 'bg-red-400/12 border border-red-400/25',     dot: 'bg-red-400' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141414] border border-gold/20 rounded-xl shadow-dark p-3 text-xs">
      <p className="font-playfair font-semibold text-white mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-inter">
          {entry.dataKey === 'earnings' ? formatCurrency(entry.value) : `${entry.value} bookings`}
        </p>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, border, sub, featured,
}: {
  label: string; value: string | number; icon: any;
  color: string; border: string; sub?: string; featured?: boolean;
}) {
  return (
    <div className={`nexora-card rounded-2xl p-5 border ${border} ${featured ? 'ring-1 ring-gold/20' : ''} relative overflow-hidden`}>
      {featured && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl pointer-events-none" />
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${border}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className={`text-2xl font-bold mb-0.5 font-inter ${color}`}>{value}</p>
      <p className="text-sm font-playfair font-semibold text-white leading-snug">{label}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5 font-inter">{sub}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0, pendingBookings: 0, confirmedBookings: 0,
    completedBookings: 0, cancelledBookings: 0, todayBookings: 0,
    averageRating: 0, totalReviews: 0, walletBalance: 0,
    todayEarnings: 0, weeklyEarnings: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (!user?.id) { setLoading(false); return; }
    isRefresh ? setRefreshing(true) : setLoading(true);

    try {
      const shopData = await getShopByOwnerId(user.id);
      if (!shopData) { setShop(null); return; }
      if (shopData.status && shopData.status !== 'approved') {
        navigate('/owner/pending-approval'); return;
      }
      setShop(shopData);

      const [bookings, balance] = await Promise.all([
        getShopBookings(shopData.id),
        getWalletBalance(shopData.id).catch(() => 0),
      ]);

      setAllBookings(bookings || []);

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];

      const todayList = (bookings || []).filter((b: any) =>
        (b.final_date || b.requested_date) === today
      );
      const weeklyCompleted = (bookings || []).filter((b: any) =>
        b.status === 'completed' && (b.final_date || b.requested_date) >= weekAgo
      );

      setStats({
        totalBookings: shopData.total_bookings || 0,
        pendingBookings: (bookings || []).filter((b: any) => b.status === 'pending').length,
        confirmedBookings: (bookings || []).filter((b: any) => b.status === 'confirmed').length,
        completedBookings: (bookings || []).filter((b: any) => b.status === 'completed').length,
        cancelledBookings: (bookings || []).filter((b: any) => b.status === 'cancelled').length,
        todayBookings: todayList.length,
        averageRating: shopData.average_rating || 0,
        totalReviews: shopData.total_reviews || 0,
        walletBalance: balance,
        todayEarnings: todayList
          .filter((b: any) => b.status === 'completed')
          .reduce((s: number, b: any) => s + (b.total_amount || 0), 0),
        weeklyEarnings: weeklyCompleted.reduce((s: number, b: any) => s + (b.total_amount || 0), 0),
      });

      setChartData(buildWeeklyChartData(bookings || []));
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  async function handleAccept(bookingId: string) {
    setActionLoading(bookingId + '_accept');
    try {
      await acceptBooking(bookingId);
      toast({ title: 'Booking Accepted', description: 'Customer will be notified.' });
      await loadDashboard(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setActionLoading(null); }
  }

  async function handleReject(bookingId: string) {
    setActionLoading(bookingId + '_reject');
    try {
      await rejectBooking(bookingId);
      toast({ title: 'Booking Rejected', description: 'Booking has been cancelled.' });
      await loadDashboard(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setActionLoading(null); }
  }

  const pendingList = allBookings.filter((b) => b.status === 'pending').slice(0, 5);
  const recentList = allBookings.slice(0, 8);
  const today = new Date().toISOString().split('T')[0];
  const todayList = allBookings.filter((b) =>
    (b.final_date || b.requested_date) === today
  );

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-14 h-14 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 animate-spin text-gold" />
        </div>
        <p className="text-white/30 font-inter text-sm">Loading dashboard…</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-gold/10 border-2 border-gold/20 rounded-3xl flex items-center justify-center mb-6">
          <Store className="w-10 h-10 text-gold" />
        </div>
        <div className="gold-divider w-10 mx-auto mb-5" />
        <h3 className="font-playfair font-bold text-white text-2xl mb-2">No Salon Registered</h3>
        <p className="text-white/35 mb-8 max-w-xs font-inter text-sm leading-relaxed">
          Complete your shop registration to start receiving bookings and managing your business.
        </p>
        <button onClick={() => navigate('/owner/register')}
          className="px-8 py-3 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold rounded-xl shadow-gold transition-all font-inter">
          Register Your Salon →
        </button>
      </div>
    );
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden nexora-card rounded-2xl p-6 border-gold/15">
        {/* ambient glow */}
        <div className="absolute top-0 right-0 w-72 h-48 bg-gold/5 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Shop Avatar */}
            <div className="w-14 h-14 bg-gold/10 border-2 border-gold/30 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-gold">
              <span className="font-playfair font-bold text-gold text-2xl">
                {shop.name.charAt(0)}
              </span>
            </div>
            <div>
              <div className="gold-divider w-8 mb-2" />
              <h1 className="font-playfair font-bold text-white text-xl leading-tight">{shop.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {shop.city && (
                  <span className="flex items-center gap-1 text-xs text-white/35 font-inter">
                    <MapPin className="w-3 h-3 text-gold/50" /> {shop.city}
                  </span>
                )}
                {stats.averageRating > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-gold">
                    <Star className="w-3 h-3 fill-gold" /> {Number(stats.averageRating).toFixed(1)}
                    <span className="text-white/25 font-normal">({stats.totalReviews})</span>
                  </span>
                )}
                {shop.home_service_available && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold/70">
                    <Home className="w-2.5 h-2.5" /> Home Service
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-white/25 font-inter">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-sm font-semibold text-white/50 font-inter mt-0.5">
                {todayList.length} appointment{todayList.length !== 1 ? 's' : ''} today
              </p>
            </div>
            <button onClick={() => loadDashboard(true)} disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-gold border border-white/12 hover:border-gold/30 px-3 py-2 rounded-xl transition-all disabled:opacity-50 font-inter">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick mini-stats strip */}
        <div className="relative flex flex-wrap gap-4 mt-5 pt-5 border-t border-white/8">
          {[
            { label: 'Total Bookings', value: stats.totalBookings, color: 'text-white' },
            { label: 'Pending', value: stats.pendingBookings, color: 'text-amber-400' },
            { label: 'Completed', value: stats.completedBookings, color: 'text-gold' },
            { label: 'This Week', value: formatCurrency(stats.weeklyEarnings), color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-1 min-w-[80px]">
              <p className={`text-lg font-bold font-inter ${color}`}>{value}</p>
              <p className="text-[10px] text-white/25 font-inter">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PENDING ALERT ═══════════════════════════════════════════════════ */}
      {stats.pendingBookings > 0 && (
        <div className="flex items-center justify-between p-4 bg-gold/8 border border-gold/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gold/15 border border-gold/25 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4.5 h-4.5 text-gold" />
            </div>
            <div>
              <p className="font-playfair font-semibold text-white">
                {stats.pendingBookings} booking{stats.pendingBookings > 1 ? 's' : ''} awaiting response
              </p>
              <p className="text-xs text-white/35 font-inter">Respond promptly to keep customers happy</p>
            </div>
          </div>
          <button onClick={() => navigate('/owner/bookings')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0A0A0A] bg-gold hover:bg-gold-light px-4 py-2 rounded-xl transition-all shadow-gold font-inter whitespace-nowrap">
            Review <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ══ STAT CARDS ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings" value={stats.totalBookings} icon={TrendingUp}
          color="text-gold" border="border-gold/20" featured
          sub={`${stats.todayBookings} scheduled today`} />
        <StatCard
          label="Pending" value={stats.pendingBookings} icon={Clock}
          color="text-amber-400" border="border-amber-400/20"
          sub={stats.pendingBookings > 0 ? 'Needs attention' : 'All clear'} />
        <StatCard
          label="Wallet Balance" value={formatCurrency(stats.walletBalance)} icon={IndianRupee}
          color="text-emerald-400" border="border-emerald-400/20"
          sub={`${formatCurrency(stats.todayEarnings)} earned today`} />
        <StatCard
          label="Rating" value={stats.averageRating > 0 ? Number(stats.averageRating).toFixed(1) + ' ★' : '—'}
          icon={Star} color="text-gold" border="border-gold/20"
          sub={`${stats.totalReviews} review${stats.totalReviews !== 1 ? 's' : ''}`} />
      </div>

      {/* ══ SECONDARY STATS ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Confirmed',       value: stats.confirmedBookings,          color: 'text-emerald-400', ring: 'border-emerald-400/15 bg-emerald-400/5' },
          { label: 'Completed',       value: stats.completedBookings,          color: 'text-gold',         ring: 'border-gold/15 bg-gold/5' },
          { label: 'Cancelled',       value: stats.cancelledBookings,          color: 'text-red-400',      ring: 'border-red-400/15 bg-red-400/5' },
          { label: 'Weekly Earnings', value: formatCurrency(stats.weeklyEarnings), color: 'text-blue-400', ring: 'border-blue-400/15 bg-blue-400/5' },
        ].map((item) => (
          <div key={item.label} className={`nexora-card rounded-xl p-4 border ${item.ring}`}>
            <p className={`text-xl font-bold font-inter ${item.color}`}>{item.value}</p>
            <p className="text-xs text-white/30 mt-0.5 font-inter">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ══ CHARTS ══════════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings Area Chart */}
        <div className="nexora-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4 text-gold" />
                <h2 className="font-playfair font-semibold text-white text-lg">Weekly Earnings</h2>
              </div>
              <p className="text-xs text-white/30 font-inter">Completed bookings — last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gold font-inter">{formatCurrency(stats.weeklyEarnings)}</p>
              <p className="text-[10px] text-white/25 font-inter">this week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}
                tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}
                tickLine={false} axisLine={false}
                tickFormatter={(v) => v === 0 ? '₹0' : `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="earnings" stroke="#D4AF37" strokeWidth={2.5}
                fill="url(#earningsGrad)"
                dot={{ r: 3.5, fill: '#D4AF37', stroke: '#0A0A0A', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#D4AF37', stroke: '#0A0A0A', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings Bar Chart */}
        <div className="nexora-card rounded-2xl p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gold" />
              <h2 className="font-playfair font-semibold text-white text-lg">Daily Bookings</h2>
            </div>
            <p className="text-xs text-white/30 font-inter">Completed per day</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}
                tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}
                tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="bookings" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={28}
                opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══ PENDING ACTIONS ═════════════════════════════════════════════════ */}
      {pendingList.length > 0 && (
        <div className="nexora-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-400/10 border border-amber-400/20 rounded-xl flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="font-playfair font-semibold text-white text-lg leading-none">Pending Actions</h2>
                <p className="text-xs text-white/30 font-inter mt-0.5">Requests awaiting your response</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/25 font-bold font-inter">
                {stats.pendingBookings}
              </span>
            </div>
            <button onClick={() => navigate('/owner/bookings')}
              className="text-xs text-white/35 hover:text-gold transition-colors flex items-center gap-1 font-inter">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingList.map((booking) => (
              <div key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gold/4 border border-gold/12 rounded-xl hover:border-gold/20 transition-all">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="font-playfair font-bold text-gold text-sm">
                      {booking.customer_name?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate font-inter">{booking.customer_name}</p>
                    <p className="text-xs text-white/35 truncate font-inter mt-0.5">
                      {Array.isArray(booking.services)
                        ? booking.services.map((s: any) => s.name).join(', ')
                        : 'Services'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-white/25 mt-1.5 font-inter">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {booking.requested_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {String(booking.requested_time || '').slice(0, 5)}
                      </span>
                      <span className="font-bold text-gold">₹{booking.total_amount}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleReject(booking.id)} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-400 border border-red-400/25 hover:bg-red-400/8 px-3 py-2 rounded-xl transition-all disabled:opacity-50 font-inter">
                    {actionLoading === booking.id + '_reject'
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <XCircle className="w-3 h-3" />}
                    Reject
                  </button>
                  <button onClick={() => handleAccept(booking.id)} disabled={!!actionLoading}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#0A0A0A] bg-gold hover:bg-gold-light px-3 py-2 rounded-xl transition-all shadow-gold disabled:opacity-50 font-inter">
                    {actionLoading === booking.id + '_accept'
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <CheckCircle className="w-3 h-3" />}
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TODAY & RECENT ══════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Today's Schedule */}
        <div className="nexora-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-4 h-4 text-gold" />
              </div>
              <div>
                <h2 className="font-playfair font-semibold text-white leading-none">Today's Schedule</h2>
                <p className="text-[10px] text-white/25 font-inter mt-0.5">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/35 border border-white/10 font-inter">
              {todayList.length}
            </span>
          </div>

          {todayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-white/3 border border-white/8 rounded-2xl flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-white/15" />
              </div>
              <p className="text-sm text-white/20 font-inter">No appointments today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayList.map((b) => (
                <div key={b.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors border border-transparent hover:border-white/8">
                  <div className="w-8 h-8 bg-gold/8 border border-gold/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-3.5 h-3.5 text-gold/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-white truncate font-inter">{b.customer_name}</p>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-white/30 mt-0.5 font-inter">
                      {String(b.final_time || b.requested_time || '').slice(0, 5)} · ₹{b.total_amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="nexora-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                <Users className="w-4 h-4 text-white/40" />
              </div>
              <div>
                <h2 className="font-playfair font-semibold text-white leading-none">Recent Bookings</h2>
                <p className="text-[10px] text-white/25 font-inter mt-0.5">Latest activity</p>
              </div>
            </div>
            <button onClick={() => navigate('/owner/bookings')}
              className="text-xs text-white/30 hover:text-gold transition-colors flex items-center gap-1 font-inter">
              All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-white/3 border border-white/8 rounded-2xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-white/15" />
              </div>
              <p className="text-sm text-white/20 font-inter">No bookings yet</p>
              <p className="text-xs text-white/12 font-inter mt-1">Share your shop link to get started</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentList.map((b) => (
                <div key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/3 transition-colors border border-transparent hover:border-white/6">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate font-inter">{b.customer_name}</p>
                    <p className="text-xs text-white/25 font-inter">
                      {b.final_date || b.requested_date} · {String(b.final_time || b.requested_time || '').slice(0, 5)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-gold font-inter">₹{b.total_amount}</p>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ QUICK LINKS ═════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-gold/60" />
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider font-inter">Quick Access</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Manage Staff',    icon: Users,        path: '/owner/staff',    color: 'text-purple-400',   border: 'border-purple-400/20',   bg: 'bg-purple-400/8' },
            { label: 'Manage Bookings', icon: Calendar,     path: '/owner/bookings', color: 'text-gold',         border: 'border-gold/20',         bg: 'bg-gold/8' },
            { label: 'Manage Services', icon: Scissors,     path: '/owner/services', color: 'text-emerald-400',  border: 'border-emerald-400/20',   bg: 'bg-emerald-400/8' },
            { label: 'Wallet',          icon: IndianRupee,  path: '/owner/wallet',   color: 'text-blue-400',     border: 'border-blue-400/20',      bg: 'bg-blue-400/8' },
            { label: 'Shop Profile',    icon: Store,        path: '/owner/profile',  color: 'text-amber-400',    border: 'border-amber-400/20',     bg: 'bg-amber-400/8' },
          ].map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`group flex items-center gap-3 p-4 nexora-card rounded-2xl border ${item.border} hover:brightness-110 transition-all text-left`}>
              <div className={`w-9 h-9 ${item.bg} border ${item.border} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className={`text-sm font-semibold ${item.color} opacity-80 group-hover:opacity-100 transition-opacity font-inter`}>
                {item.label}
              </span>
              <ChevronRight className={`w-3.5 h-3.5 ${item.color} opacity-30 group-hover:opacity-60 ml-auto transition-opacity`} />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
