import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, LogIn, Sparkles, ArrowRight, Shield,
  Star, Clock, TrendingUp, Check
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../hooks/use-toast';
import GmailOtpVerification from '../components/forms/GmailOtpVerification';
import { getCurrentUser } from '../lib/auth';
import { supabase } from '../lib/supabase';

// ─── Shared input class ───────────────────────────────────────────────────────
const inputCls =
  'w-full bg-[#0A0A0A] border border-white/12 focus:border-gold/50 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm font-inter outline-none transition-all';

const labelCls =
  'text-white/40 text-[10px] font-semibold tracking-widest uppercase mb-2 block font-inter';

// ─── Feature list ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Shield,     text: 'Verified salon profile with admin review' },
  { icon: TrendingUp, text: 'Real-time booking & earnings dashboard' },
  { icon: Star,       text: 'Showcase photos, reviews & services' },
  { icon: Clock,      text: 'Flexible home service & slot management' },
];

// ─── Stat pills ───────────────────────────────────────────────────────────────
const STATS = [
  { value: '50+',    label: 'Salons' },
  { value: '10k+',   label: 'Bookings' },
  { value: '4.8★',   label: 'Rating' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  async function handleEmailVerified(email: string) {
    try {
      let user = await getCurrentUser();
      if (!user) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          user = {
            id: authUser.id,
            name: authUser.user_metadata?.username || email.split('@')[0],
            email: authUser.email || email,
            phone: '',
            role: (authUser.user_metadata?.role as any) || 'owner',
            shopId: undefined,
            shopStatus: undefined,
          };
        } else {
          user = {
            id: crypto.randomUUID(),
            name: email.split('@')[0],
            email,
            phone: '',
            role: 'owner',
            shopId: undefined,
            shopStatus: undefined,
          };
        }
      }
      login(user);
      toast({ title: 'Welcome back', description: `Signed in as ${user.name}` });
      if (user.shopId) {
        setTimeout(() => navigate('/owner/dashboard'), 500);
      } else {
        setTimeout(() => navigate('/owner/register'), 500);
      }
    } catch (err: any) {
      console.error('Post-login error:', err);
      setTimeout(() => navigate('/owner/dashboard'), 1500);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">

      {/* ═══ LEFT PANEL — branding (desktop) ═══════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Subtle gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#141414] via-[#0E0E0E] to-[#0A0A0A]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/4 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gold/3 rounded-full blur-[100px] pointer-events-none" />

        {/* Top: logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
              <span className="text-[#0A0A0A] font-playfair font-black text-lg">N</span>
            </div>
            <div>
              <p className="font-playfair font-bold text-white text-lg tracking-widest uppercase leading-tight">Nexora</p>
              <p className="text-white/25 text-[9px] tracking-[0.3em] uppercase font-inter">Salonos</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="font-playfair font-bold text-white leading-[1.1] mb-5"
              style={{ fontSize: 'clamp(2.4rem, 3.5vw, 3.2rem)' }}>
            Grow Your Salon
            <br />
            <span className="text-gold-gradient italic">With Nexora</span>
          </h2>
          <p className="text-white/35 text-sm leading-relaxed mb-10 max-w-xs font-inter">
            India's premium grooming marketplace. Connect with thousands of clients and manage your business effortlessly.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-10">
            {STATS.map(({ value, label }) => (
              <div key={label} className="bg-gold/6 border border-gold/15 rounded-xl px-4 py-3 text-center">
                <p className="font-playfair font-bold text-gold text-xl leading-none">{value}</p>
                <p className="text-white/30 text-[10px] mt-0.5 uppercase tracking-wider font-inter">{label}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gold" />
                </div>
                <p className="text-white/45 text-sm font-inter">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: testimonial */}
        <div className="relative z-10">
          <div className="gold-divider w-full mb-6" />
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center flex-shrink-0">
              <span className="text-gold font-playfair font-bold text-sm">R</span>
            </div>
            <div>
              <p className="text-white/50 text-xs leading-relaxed italic font-inter">
                "Nexora doubled my bookings in the first month. The dashboard is beautiful and incredibly easy to use."
              </p>
              <p className="text-gold/50 text-[10px] mt-1.5 font-semibold font-inter">Rajesh K. · Elite Cuts, Mumbai</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — auth form ════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Ambient */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gold/4 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center mb-10">
            <div className="w-14 h-14 bg-gold-gradient rounded-2xl flex items-center justify-center shadow-gold mb-4">
              <span className="text-[#0A0A0A] font-playfair font-black text-2xl">N</span>
            </div>
            <p className="font-playfair font-bold text-white text-2xl tracking-widest uppercase mb-0.5">Nexora</p>
            <p className="text-white/25 text-[9px] tracking-[0.3em] uppercase font-inter">Salonos · Owner Portal</p>
            <div className="gold-divider w-14 mt-4" />
          </div>

          {/* Heading */}
          <div className="hidden lg:block mb-8">
            <div className="gold-divider w-10 mb-4" />
            <h1 className="font-playfair font-bold text-white text-3xl mb-1.5">Owner Portal</h1>
            <p className="text-white/30 text-sm font-inter">Sign in or register your salon</p>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-1 p-1 bg-[#141414] border border-white/8 rounded-xl mb-6">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold transition-all font-inter ${
                  tab === t
                    ? 'bg-gold text-[#0A0A0A] shadow-gold'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                {t === 'login' ? <LogIn className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                {t === 'login' ? 'Sign In' : 'Register Salon'}
              </button>
            ))}
          </div>

          {/* ── Sign In ── */}
          {tab === 'login' && (
            <div className="nexora-card rounded-2xl p-7 shadow-dark">
              <div className="mb-6">
                <h3 className="font-playfair font-bold text-white text-xl mb-1">Welcome Back</h3>
                <p className="text-white/30 text-sm font-inter">
                  Verify your email OTP to continue
                </p>
              </div>
              <GmailOtpVerification onVerified={handleEmailVerified} buttonText="Sign In to Dashboard" />

              {/* Admin link */}
              <div className="mt-6 pt-5 border-t border-white/8 flex items-center justify-between">
                <p className="text-white/20 text-xs font-inter">Platform administrator?</p>
                <button
                  type="button"
                  onClick={() => navigate('/admin/login')}
                  className="flex items-center gap-1.5 text-xs text-gold/50 hover:text-gold transition-colors font-semibold font-inter"
                >
                  <Shield className="w-3 h-3" /> Admin Panel
                </button>
              </div>
            </div>
          )}

          {/* ── Register ── */}
          {tab === 'register' && (
            <div className="nexora-card rounded-2xl p-7 shadow-dark">
              <div className="mb-6">
                <h3 className="font-playfair font-bold text-white text-xl mb-1">List Your Salon</h3>
                <p className="text-white/30 text-sm font-inter">
                  Join India's premium grooming marketplace
                </p>
              </div>

              {/* Benefits card */}
              <div className="bg-gold/5 border border-gold/15 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
                  <p className="text-gold text-xs font-semibold uppercase tracking-wider font-inter">What you get</p>
                </div>
                <div className="space-y-2">
                  {[
                    'Complete shop profile with photos & services',
                    'Real-time booking management dashboard',
                    'Wallet & earnings tracking (90% payout)',
                    'Home service support & radius control',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 bg-gold/20 border border-gold/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-gold" />
                      </div>
                      <p className="text-white/45 text-xs font-inter leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={() => navigate('/owner/register')}
                className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-gold transition-all hover:scale-[1.02] active:scale-[0.98] font-inter"
              >
                <Store className="w-4 h-4" />
                Start Free Registration
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-white/20 text-xs mt-4 font-inter">
                No subscription · Free to join · Admin approval required
              </p>
            </div>
          )}

          {/* Back link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-white/20 hover:text-white/40 transition-colors font-inter"
            >
              ← Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
