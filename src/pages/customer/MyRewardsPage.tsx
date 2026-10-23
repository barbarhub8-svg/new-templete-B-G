import { useState, useEffect, useCallback } from 'react';
import {
  Gift, Users, Star, TrendingUp, Copy, Share2, Check,
  Loader2, ChevronRight, Clock, AlertCircle, Wallet,
  ArrowUpRight, ArrowDownLeft, RefreshCw, Search,
  Sparkles, QrCode, IndianRupee, Trophy, Zap
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerRewards {
  id: string;
  email: string;
  name: string | null;
  referral_code: string;
  reward_balance: number;
  lifetime_rewards: number;
  total_referrals: number;
  successful_referrals: number;
}

interface ReferralRecord {
  id: string;
  referred_email: string;
  status: string;
  qualifying_amount: number | null;
  reward_given: boolean;
  created_at: string;
}

interface RewardTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TX_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  referral_bonus: { label: 'Referral Bonus', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: Users },
  welcome_bonus:  { label: 'Welcome Bonus',  color: 'text-gold',         bg: 'bg-gold/10 border-gold/20',             icon: Gift },
  cashback:       { label: 'Cashback',        color: 'text-blue-400',     bg: 'bg-blue-400/10 border-blue-400/20',     icon: TrendingUp },
  redeemed:       { label: 'Redeemed',        color: 'text-red-400',      bg: 'bg-red-400/10 border-red-400/20',       icon: ArrowDownLeft },
};

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MyRewardsPage() {
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<CustomerRewards | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [tab, setTab] = useState<'overview' | 'referrals' | 'history'>('overview');
  const [copied, setCopied] = useState(false);

  async function handleLookup() {
    const em = inputEmail.trim().toLowerCase();
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast({ title: 'Invalid Email', description: 'Enter a valid email address', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Try to find existing rewards profile
      let { data: rwData } = await supabase
        .from('customer_rewards')
        .select('*')
        .eq('email', em)
        .single();

      // If not found, check if they have any bookings - if yes, auto-create
      if (!rwData) {
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('customer_name, customer_phone')
          .eq('customer_email', em)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!bookingData) {
          toast({ title: 'No Account Found', description: 'No bookings found with this email. Book your first appointment to start earning rewards!', variant: 'destructive' });
          setLoading(false);
          return;
        }

        // Auto-create rewards profile
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const { data: newRw } = await supabase
          .from('customer_rewards')
          .insert({
            email: em,
            name: bookingData.customer_name,
            phone: bookingData.customer_phone,
            referral_code: code,
          })
          .select()
          .single();
        rwData = newRw;
      }

      if (!rwData) throw new Error('Failed to load rewards');

      setRewards(rwData);
      setEmail(em);

      // Load referrals and transactions in parallel
      const [refRes, txRes] = await Promise.all([
        supabase.from('referral_history').select('*').eq('referrer_email', em).order('created_at', { ascending: false }),
        supabase.from('reward_transactions').select('*').eq('customer_email', em).order('created_at', { ascending: false }).limit(50),
      ]);
      setReferrals(refRes.data || []);
      setTransactions(txRes.data || []);

    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!rewards) return;
    navigator.clipboard.writeText(rewards.referral_code);
    setCopied(true);
    toast({ title: 'Copied!', description: `Referral code ${rewards.referral_code} copied` });
    setTimeout(() => setCopied(false), 2000);
  }

  function shareCode() {
    if (!rewards) return;
    const msg = `🎁 Join Nexora Salonos & get ₹20 welcome reward!\n\nUse my referral code: ${rewards.referral_code}\n\nBook your first ₹100+ appointment at any Nexora salon and we both earn ₹20 rewards!\n\n✂️ nexora.onspace.app`;
    if (navigator.share) {
      navigator.share({ title: 'Nexora Rewards', text: msg });
    } else {
      navigator.clipboard.writeText(msg);
      toast({ title: 'Message Copied!', description: 'Share it with your friends' });
    }
  }

  async function refresh() {
    if (!email) return;
    setLoading(true);
    try {
      const [rwRes, refRes, txRes] = await Promise.all([
        supabase.from('customer_rewards').select('*').eq('email', email).single(),
        supabase.from('referral_history').select('*').eq('referrer_email', email).order('created_at', { ascending: false }),
        supabase.from('reward_transactions').select('*').eq('customer_email', email).order('created_at', { ascending: false }).limit(50),
      ]);
      if (rwRes.data) setRewards(rwRes.data);
      setReferrals(refRes.data || []);
      setTransactions(txRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
  const successfulReferrals = referrals.filter(r => r.status === 'successful').length;

  // ─── Pre-Login: Email Lookup ──────────────────────────────────────────────

  if (!rewards) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-2xl mx-auto px-4 pt-16 pb-12 text-center relative">
            <div className="w-20 h-20 bg-gold/10 border-2 border-gold/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-gold">
              <Gift className="w-10 h-10 text-gold" />
            </div>
            <div className="gold-divider w-16 mx-auto mb-5" />
            <h1 className="font-playfair font-bold text-white text-3xl md:text-4xl mb-3">
              Nexora Rewards
            </h1>
            <p className="text-white/50 text-base font-inter leading-relaxed mb-8">
              Earn rewards on every visit. Refer friends. Save on your next salon appointment.
            </p>

            {/* How it works */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {[
                { icon: QrCode, label: 'Book & Pay', sub: 'Earn 2% cashback on every appointment' },
                { icon: Users, label: 'Refer Friends', sub: 'Both of you earn ₹20 rewards' },
                { icon: Wallet, label: 'Redeem Savings', sub: 'Use rewards on your next visit' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="nexora-card rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <p className="font-playfair font-semibold text-white text-sm mb-1">{label}</p>
                  <p className="text-white/30 text-xs font-inter leading-snug">{sub}</p>
                </div>
              ))}
            </div>

            {/* Email Lookup */}
            <div className="nexora-card rounded-2xl p-6 text-left">
              <p className="font-playfair font-semibold text-white mb-1">Check Your Rewards</p>
              <p className="text-white/35 text-sm font-inter mb-4">Enter the email you use for bookings</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inputEmail}
                  onChange={e => setInputEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                  placeholder="your@email.com"
                  className="flex-1 h-11 px-4 text-sm bg-[#0A0A0A] border border-white/12 focus:border-gold/50 text-white placeholder-white/20 rounded-xl outline-none font-inter transition-all"
                />
                <button
                  onClick={handleLookup}
                  disabled={loading}
                  className="h-11 px-5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm rounded-xl shadow-gold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 font-inter"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {loading ? '' : 'View'}
                </button>
              </div>
              <p className="text-white/20 text-xs mt-3 font-inter">
                New to Nexora? Complete your first booking and your rewards profile will be created automatically.
              </p>
            </div>

            {/* Rewards Snapshot Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-left">
              <div className="nexora-card rounded-2xl p-5 border-gold/20">
                <div className="flex items-start justify-between mb-3">
                  <Zap className="w-6 h-6 text-gold" />
                  <span className="text-xs text-gold/60 font-inter bg-gold/10 px-2 py-0.5 rounded-full">Auto</span>
                </div>
                <p className="font-playfair font-semibold text-white text-lg">2% Cashback</p>
                <p className="text-white/35 text-sm font-inter mt-1">On every booking you complete at any Nexora salon</p>
              </div>
              <div className="nexora-card rounded-2xl p-5 border-emerald-400/15">
                <div className="flex items-start justify-between mb-3">
                  <Users className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs text-emerald-400/60 font-inter bg-emerald-400/10 px-2 py-0.5 rounded-full">₹20+₹20</span>
                </div>
                <p className="font-playfair font-semibold text-white text-lg">Referral Rewards</p>
                <p className="text-white/35 text-sm font-inter mt-1">You + your friend both earn ₹20 on first qualifying booking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="gold-divider w-8 mb-3" />
            <h1 className="font-playfair font-bold text-white text-2xl">My Rewards</h1>
            <p className="text-white/30 text-sm font-inter mt-0.5">{email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} disabled={loading}
              className="w-9 h-9 bg-white/5 border border-white/10 hover:border-gold/30 rounded-xl flex items-center justify-center text-white/40 hover:text-gold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => { setRewards(null); setEmail(''); setInputEmail(''); }}
              className="text-xs text-white/30 hover:text-white border border-white/10 hover:border-gold/20 px-3 py-2 rounded-xl transition-all font-inter">
              Switch
            </button>
          </div>
        </div>

        {/* Balance Hero Card */}
        <div className="relative overflow-hidden nexora-card rounded-3xl p-6 mb-6 border-gold/25">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 rounded-full -translate-y-1/4 translate-x-1/4 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider font-inter mb-1">Reward Balance</p>
                <p className="font-playfair font-bold text-gold text-5xl">₹{rewards.reward_balance}</p>
                <p className="text-white/25 text-sm font-inter mt-1">Available to use on next booking</p>
              </div>
              <div className="w-12 h-12 bg-gold/10 border border-gold/25 rounded-2xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-gold" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/8">
              {[
                { label: 'Lifetime Earned', value: `₹${rewards.lifetime_rewards}`, color: 'text-white' },
                { label: 'Referrals', value: `${rewards.successful_referrals}/${rewards.total_referrals}`, color: 'text-emerald-400' },
                { label: 'Pending', value: `${pendingReferrals} friends`, color: 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className={`font-bold font-inter ${color}`}>{value}</p>
                  <p className="text-white/25 text-[10px] font-inter mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="nexora-card rounded-2xl p-5 mb-6 border-gold/15">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gold/10 border border-gold/20 rounded-xl flex items-center justify-center">
              <Share2 className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="font-playfair font-semibold text-white">Your Referral Code</p>
              <p className="text-white/30 text-xs font-inter">Share with friends — both earn ₹20</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 flex items-center justify-center py-4 bg-[#0A0A0A] border-2 border-dashed border-gold/30 rounded-2xl">
              <p className="font-mono font-bold text-gold text-3xl tracking-[0.3em]">{rewards.referral_code}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={copyCode}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all font-inter border ${copied ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-gold/10 border-gold/25 text-gold hover:bg-gold/15'}`}>
              {copied ? <><Check className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy Code</>}
            </button>
            <button onClick={shareCode}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-gold hover:bg-gold-light text-[#0A0A0A] transition-all shadow-gold font-inter">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 bg-gold/5 rounded-xl border border-gold/10">
            <AlertCircle className="w-3.5 h-3.5 text-gold/60 mt-0.5 flex-shrink-0" />
            <p className="text-white/30 text-xs font-inter leading-relaxed">
              Reward activates when your friend completes a booking of ₹100 or more. Both earn ₹20!
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#141414] rounded-xl p-1 border border-white/8 mb-5">
          {[
            { key: 'overview', label: 'Overview', icon: Star },
            { key: 'referrals', label: `Referrals (${referrals.length})`, icon: Users },
            { key: 'history', label: 'History', icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all font-inter ${tab === key ? 'bg-gold text-[#0A0A0A] shadow-gold' : 'text-white/40 hover:text-white'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {/* How to earn */}
            <div className="nexora-card rounded-2xl p-5">
              <p className="font-playfair font-semibold text-white mb-4">How to Earn Rewards</p>
              <div className="space-y-3">
                {[
                  { icon: QrCode, label: 'Complete Any Booking', detail: 'Earn 2% cashback automatically after completion', earn: '+2%', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
                  { icon: Users, label: 'Refer a Friend', detail: 'Friend books & pays ₹100+, you both earn', earn: '+₹20', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
                  { icon: Gift, label: 'Welcome Bonus', detail: 'New customers who join via referral get', earn: '+₹20', color: 'text-gold', bg: 'bg-gold/10 border-gold/20' },
                ].map(({ icon: Icon, label, detail, earn, color, bg }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/6">
                    <div className={`w-10 h-10 ${bg} border rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm font-inter">{label}</p>
                      <p className="text-white/30 text-xs font-inter mt-0.5">{detail}</p>
                    </div>
                    <span className={`font-bold text-sm flex-shrink-0 ${color}`}>{earn}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Redemption rules */}
            <div className="nexora-card rounded-2xl p-5">
              <p className="font-playfair font-semibold text-white mb-4">How to Use Rewards</p>
              <div className="space-y-2.5">
                {[
                  { icon: Check, text: 'Use rewards at checkout for any Nexora salon booking', ok: true },
                  { icon: Check, text: 'Partial redemption allowed (pay rest normally)', ok: true },
                  { icon: Check, text: 'Combine cashback + referral rewards', ok: true },
                  { icon: AlertCircle, text: 'Cannot be transferred to bank or UPI', ok: false },
                  { icon: AlertCircle, text: 'No cash withdrawal', ok: false },
                  { icon: AlertCircle, text: 'Valid only at Nexora partner salons', ok: false },
                ].map(({ icon: Icon, text, ok }, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm font-inter">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-emerald-400/15' : 'bg-red-400/15'}`}>
                      <Icon className={`w-3 h-3 ${ok ? 'text-emerald-400' : 'text-red-400'}`} />
                    </div>
                    <span className={ok ? 'text-white/60' : 'text-white/30'}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Example */}
            {rewards.reward_balance > 0 && (
              <div className="nexora-card rounded-2xl p-5 border-gold/20 bg-gold/3">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-gold" />
                  <p className="font-playfair font-semibold text-gold">You have ₹{rewards.reward_balance} to save!</p>
                </div>
                <p className="text-white/50 text-sm font-inter leading-relaxed">
                  On a ₹{Math.max(300, rewards.reward_balance + 100)} haircut, just tell the salon owner to apply your rewards. You'd pay only ₹{Math.max(300, rewards.reward_balance + 100) - rewards.reward_balance} instead!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Referrals Tab ── */}
        {tab === 'referrals' && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              {[
                { label: 'Total Sent', value: referrals.length, color: 'text-white' },
                { label: 'Successful', value: successfulReferrals, color: 'text-emerald-400' },
                { label: 'Pending', value: pendingReferrals, color: 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="nexora-card rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold font-inter ${color}`}>{value}</p>
                  <p className="text-white/30 text-xs font-inter mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {referrals.length === 0 ? (
              <div className="nexora-card rounded-2xl p-10 text-center">
                <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="font-playfair font-semibold text-white mb-1">No Referrals Yet</p>
                <p className="text-white/30 text-sm font-inter">Share your code and start earning ₹20 per successful referral</p>
                <button onClick={shareCode}
                  className="mt-4 px-5 py-2.5 bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm rounded-xl shadow-gold transition-all font-inter">
                  Share My Code
                </button>
              </div>
            ) : referrals.map((ref) => (
              <div key={ref.id} className="nexora-card rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-playfair font-bold text-white/50 text-sm">
                        {ref.referred_email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm font-inter">{ref.referred_email.split('@')[0]}</p>
                      <p className="text-white/25 text-xs font-inter">{ref.referred_email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                      ref.status === 'successful'
                        ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-400'
                        : 'bg-amber-400/15 border-amber-400/30 text-amber-400'
                    }`}>
                      {ref.status === 'successful' ? '✓ Success' : '⏳ Pending'}
                    </span>
                    {ref.status === 'successful' && (
                      <p className="text-emerald-400 text-xs font-bold mt-1 font-inter">+₹20 earned</p>
                    )}
                  </div>
                </div>
                {ref.status === 'pending' && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 bg-amber-400/5 border border-amber-400/15 rounded-lg text-xs text-amber-400/70 font-inter">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    Waiting for first ₹100+ booking from your friend
                  </div>
                )}
                {ref.qualifying_amount && (
                  <p className="text-white/20 text-xs mt-2 font-inter">Qualifying booking: ₹{ref.qualifying_amount}</p>
                )}
                <p className="text-white/15 text-[10px] mt-1 font-inter">{timeAgo(ref.created_at)}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── History Tab ── */}
        {tab === 'history' && (
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="nexora-card rounded-2xl p-10 text-center">
                <TrendingUp className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="font-playfair font-semibold text-white mb-1">No Transactions Yet</p>
                <p className="text-white/30 text-sm font-inter">Complete a booking to start earning rewards</p>
              </div>
            ) : transactions.map((tx) => {
              const cfg = TX_CONFIG[tx.transaction_type] || TX_CONFIG.cashback;
              const Icon = cfg.icon;
              const isCredit = tx.amount > 0;
              return (
                <div key={tx.id} className="nexora-card rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${cfg.bg} border rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm font-inter">{cfg.label}</p>
                      {tx.description && (
                        <p className="text-white/30 text-xs font-inter truncate">{tx.description}</p>
                      )}
                      <p className="text-white/15 text-[10px] font-inter mt-0.5">{timeAgo(tx.created_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-base font-inter ${isCredit ? cfg.color : 'text-red-400'}`}>
                        {isCredit ? '+' : ''}₹{Math.abs(tx.amount)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {isCredit
                          ? <ArrowUpRight className="w-3 h-3 text-white/20" />
                          : <ArrowDownLeft className="w-3 h-3 text-white/20" />}
                        <span className="text-white/20 text-[10px] font-inter">{isCredit ? 'Credit' : 'Debit'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-8 nexora-card rounded-2xl p-6 text-center border-gold/20">
          <Sparkles className="w-8 h-8 text-gold mx-auto mb-3" />
          <p className="font-playfair font-bold text-white text-lg mb-1">Pay with Nexora. Save Every Visit.</p>
          <p className="text-white/30 text-sm font-inter">
            Har booking par rewards kamao. Agli salon visit mein bachat pao.
          </p>
        </div>
      </div>
    </div>
  );
}
