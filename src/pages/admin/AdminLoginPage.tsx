import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Mail, Lock, Loader2, Eye, EyeOff,
  AlertCircle, BarChart2, Users, Store, Check
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

// ─── Shared classes ───────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-[#0A0A0A] border border-white/12 focus:border-gold/50 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm font-inter outline-none transition-all';

const labelCls =
  'text-white/40 text-[10px] font-semibold tracking-widest uppercase mb-2 flex items-center gap-1.5 font-inter';

// ─── Admin capabilities ───────────────────────────────────────────────────────
const CAPABILITIES = [
  { icon: Store,    text: 'Approve & manage salon registrations' },
  { icon: Users,    text: 'Full user & owner oversight' },
  { icon: BarChart2,text: 'Platform analytics & wallet control' },
  { icon: Shield,   text: 'Enforce platform rules & compliance' },
];

export default function AdminLoginPage() {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { login } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Login failed');

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) throw new Error('Profile not found');
      if (profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin credentials required.');
      }

      login({
        id: profile.id, email: profile.email, name: profile.username,
        phone: profile.phone || '', role: 'admin',
      });

      toast({ title: 'Welcome, Admin', description: 'Redirecting to dashboard…' });
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">

      {/* ═══ LEFT PANEL — branding (desktop) ═══════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F0F] via-[#0B0B0B] to-[#0A0A0A]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold/3 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-[300px] h-[300px] bg-gold/2 rounded-full blur-[110px] pointer-events-none" />

        {/* Top */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
              <span className="text-[#0A0A0A] font-playfair font-black text-lg">N</span>
            </div>
            <div>
              <p className="font-playfair font-bold text-white text-lg tracking-widest uppercase leading-tight">Nexora</p>
              <p className="text-white/25 text-[9px] tracking-[0.3em] uppercase font-inter">Salonos · Admin</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="font-playfair font-bold text-white leading-[1.1] mb-4"
              style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)' }}>
            Platform
            <br />
            <span className="text-gold-gradient italic">Control Panel</span>
          </h2>
          <p className="text-white/30 text-sm leading-relaxed mb-10 max-w-xs font-inter">
            Authorised administrators only. Manage salons, users, and platform-wide operations from a single secure interface.
          </p>

          {/* Capabilities */}
          <div className="space-y-3">
            {CAPABILITIES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gold/8 border border-gold/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gold/70" />
                </div>
                <p className="text-white/35 text-sm font-inter">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: security notice */}
        <div className="relative z-10">
          <div className="gold-divider w-full mb-5" />
          <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/15 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400/60 flex-shrink-0 mt-0.5" />
            <p className="text-white/25 text-xs font-inter leading-relaxed">
              This panel is restricted to authorised Nexora administrators. Unauthorised access attempts are logged and may result in legal action.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — login form ════════════════════════════════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-gold/4 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative w-full max-w-sm">

          {/* Icon badge */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1E1E1E] to-[#141414] border-2 border-gold/25 rounded-2xl flex items-center justify-center shadow-gold">
                <Shield className="w-9 h-9 text-gold" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-[#0A0A0A] border border-gold/40 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-black text-gold tracking-tight">ADM</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-playfair font-bold text-white text-2xl mb-1">Admin Sign In</h1>
            <div className="gold-divider w-14 mx-auto my-3" />
            <p className="text-white/25 text-[10px] tracking-[0.25em] uppercase font-inter">Authorised Personnel Only</p>
          </div>

          {/* Form card */}
          <div className="nexora-card rounded-2xl p-7 shadow-dark">
            <form onSubmit={handleLogin} className="space-y-5" noValidate>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm font-inter">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label className={labelCls}>
                  <Mail className="w-3.5 h-3.5" /> Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nexora.com"
                  required
                  autoFocus
                  className={inputCls}
                />
              </div>

              {/* Password */}
              <div>
                <label className={labelCls}>
                  <Lock className="w-3.5 h-3.5" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={inputCls + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm flex items-center justify-center gap-2 shadow-gold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-inter"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
                ) : (
                  <><Shield className="w-4 h-4" /> Access Admin Panel</>
                )}
              </button>
            </form>

            {/* Security badges */}
            <div className="mt-5 pt-5 border-t border-white/8">
              <div className="flex items-center justify-center gap-4">
                {[
                  { icon: Shield, label: 'Encrypted' },
                  { icon: Check,  label: 'Role Verified' },
                  { icon: Lock,   label: 'Secure Session' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="w-7 h-7 bg-gold/8 border border-gold/15 rounded-lg flex items-center justify-center">
                      <Icon className="w-3 h-3 text-gold/50" />
                    </div>
                    <p className="text-white/20 text-[9px] font-inter">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center space-y-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs text-white/20 hover:text-white/40 transition-colors font-inter block w-full"
            >
              ← Owner Portal
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-white/15 hover:text-white/30 transition-colors font-inter block w-full"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
