import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, AlertCircle, CheckCircle, Home, Mail, Phone,
  Loader2, RefreshCw, XCircle, FileText, ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

// ─── Status Configuration ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    iconBg: 'bg-gold/10 border border-gold/25',
    iconColor: 'text-gold',
    badgeBg: 'bg-gold/10 border-gold/30 text-gold',
    badgeLabel: 'Pending Approval',
    title: 'Registration Submitted!',
    subtitle: 'Your shop is under review by our admin team.',
    infoBg: 'bg-gold/6 border-gold/20',
    infoText: 'text-gold',
    pulseDot: 'bg-gold',
  },
  approved: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-400/10 border border-emerald-400/25',
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400',
    badgeLabel: 'Approved',
    title: 'Congratulations! 🎉',
    subtitle: 'Your shop has been approved and is now live.',
    infoBg: 'bg-emerald-400/6 border-emerald-400/20',
    infoText: 'text-emerald-300',
    pulseDot: 'bg-emerald-400',
  },
  rejected: {
    icon: XCircle,
    iconBg: 'bg-red-400/10 border border-red-400/25',
    iconColor: 'text-red-400',
    badgeBg: 'bg-red-400/10 border-red-400/30 text-red-400',
    badgeLabel: 'Rejected',
    title: 'Registration Rejected',
    subtitle: 'Unfortunately, your shop registration was not approved.',
    infoBg: 'bg-red-400/6 border-red-400/20',
    infoText: 'text-red-300',
    pulseDot: 'bg-red-400',
  },
  suspended: {
    icon: AlertCircle,
    iconBg: 'bg-orange-400/10 border border-orange-400/25',
    iconColor: 'text-orange-400',
    badgeBg: 'bg-orange-400/10 border-orange-400/30 text-orange-400',
    badgeLabel: 'Suspended',
    title: 'Shop Suspended',
    subtitle: 'Your shop has been temporarily suspended by the admin.',
    infoBg: 'bg-orange-400/6 border-orange-400/20',
    infoText: 'text-orange-300',
    pulseDot: 'bg-orange-400',
  },
} as const;

type ShopStatus = keyof typeof STATUS_CONFIG;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PendingApprovalPage() {
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();

  const [shopStatus,   setShopStatus]   = useState<ShopStatus>('pending');
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [shopName,     setShopName]     = useState<string>('');
  const [loading,      setLoading]      = useState(true);
  const [lastChecked,  setLastChecked]  = useState(new Date());

  const checkShopStatus = useCallback(async (silent = false) => {
    if (!user?.id) return;
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('status, reject_reason, name')
        .eq('owner_id', user.id)
        .single();

      if (!error && data) {
        const status = data.status as ShopStatus;
        setShopStatus(status in STATUS_CONFIG ? status : 'pending');
        setRejectReason(data.reject_reason || null);
        setShopName(data.name || '');
        setLastChecked(new Date());

        if (status === 'approved') {
          setTimeout(() => navigate('/owner/dashboard'), 1800);
        }
      }
    } catch (err) {
      console.error('Status check error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    checkShopStatus();
    const interval = setInterval(() => {
      if (shopStatus === 'pending') checkShopStatus(true);
    }, 30_000);
    return () => clearInterval(interval);
  }, [checkShopStatus, shopStatus]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-7 h-7 animate-spin text-gold" />
          </div>
          <p className="text-white/30 font-inter text-sm">Checking shop status…</p>
        </div>
      </div>
    );
  }

  const cfg        = STATUS_CONFIG[shopStatus] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-10 ${
          shopStatus === 'pending' ? 'bg-gold' :
          shopStatus === 'approved' ? 'bg-emerald-400' :
          shopStatus === 'rejected' ? 'bg-red-400' : 'bg-orange-400'
        }`} />
      </div>

      <div className="w-full max-w-lg relative z-10">

        {/* ── Status Hero Card ────────────────────────────────────────────── */}
        <div className="nexora-card rounded-3xl p-8 mb-4 text-center">

          {/* Icon */}
          <div className={`w-20 h-20 ${cfg.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
            <StatusIcon className={`w-10 h-10 ${cfg.iconColor}`} />
          </div>

          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 font-inter ${cfg.badgeBg}`}>
            {shopStatus === 'pending' && (
              <span className="relative flex w-2 h-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.pulseDot} opacity-60`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.pulseDot}`} />
              </span>
            )}
            {shopStatus !== 'pending' && <StatusIcon className="w-3 h-3" />}
            {cfg.badgeLabel}
          </div>

          {/* Title */}
          <h1 className="font-playfair font-bold text-white text-2xl mb-2">{cfg.title}</h1>
          {shopName && (
            <p className={`text-sm font-semibold mb-1 font-inter ${cfg.iconColor}`}>{shopName}</p>
          )}
          <p className="text-white/35 text-sm font-inter leading-relaxed">{cfg.subtitle}</p>

          {/* Auto-refresh indicator */}
          {shopStatus === 'pending' && (
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-white/20 font-inter">
              <RefreshCw className="w-3 h-3" />
              Auto-checking · {lastChecked.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* ── Pending: Steps ────────────────────────────────────────────── */}
        {shopStatus === 'pending' && (
          <div className="nexora-card rounded-2xl p-6 mb-4">
            <p className="text-[10px] text-white/25 font-semibold uppercase tracking-widest mb-5 font-inter">What happens next?</p>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Admin Review', desc: 'Our team verifies shop details, documents, and images.', done: false },
                { step: 2, title: 'Approval Decision', desc: "You'll be notified of the outcome within 24–48 hours.", done: false },
                { step: 3, title: 'Go Live', desc: 'Once approved, your shop is listed publicly for bookings.', done: false },
              ].map(({ step, title, desc, done }) => (
                <div key={step} className="flex gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold font-inter ${
                    step === 1 ? 'bg-gold/15 border border-gold/30 text-gold' : 'bg-white/5 border border-white/10 text-white/20'
                  }`}>
                    {step}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-semibold text-sm font-inter ${step === 1 ? 'text-white' : 'text-white/35'}`}>{title}</p>
                    <p className={`text-xs mt-0.5 font-inter ${step === 1 ? 'text-white/40' : 'text-white/20'}`}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rejected: Reason ────────────────────────────────────────────── */}
        {shopStatus === 'rejected' && (
          <div className={`nexora-card rounded-2xl p-5 mb-4 border ${cfg.infoBg}`}>
            <div className="flex items-start gap-3">
              <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
              <div>
                <p className={`font-playfair font-semibold text-sm mb-1.5 ${cfg.infoText}`}>Reason for Rejection</p>
                <p className="text-sm text-white/40 font-inter leading-relaxed">
                  {rejectReason || 'Please contact support for more information about your rejection.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Suspended: Info ──────────────────────────────────────────────── */}
        {shopStatus === 'suspended' && (
          <div className={`nexora-card rounded-2xl p-5 mb-4 border ${cfg.infoBg}`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
              <div>
                <p className={`font-playfair font-semibold text-sm mb-1.5 ${cfg.infoText}`}>Suspension Notice</p>
                <p className="text-sm text-white/40 font-inter leading-relaxed">
                  {rejectReason || 'Your shop has been suspended. Please contact our support team to resolve this issue.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Approved: Redirect ───────────────────────────────────────────── */}
        {shopStatus === 'approved' && (
          <div className={`nexora-card rounded-2xl p-4 mb-4 border ${cfg.infoBg}`}>
            <div className="flex items-center gap-3">
              <CheckCircle className={`w-5 h-5 flex-shrink-0 ${cfg.iconColor}`} />
              <p className={`text-sm font-semibold font-inter flex-1 ${cfg.infoText}`}>
                Redirecting to your dashboard…
              </p>
              <Loader2 className={`w-4 h-4 animate-spin ${cfg.iconColor}`} />
            </div>
          </div>
        )}

        {/* ── Pending: Timeline Info ───────────────────────────────────────── */}
        {shopStatus === 'pending' && (
          <div className="nexora-card rounded-2xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-gold/50 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-playfair font-semibold text-white text-sm mb-1">Expected Timeline</p>
                <p className="text-sm text-white/35 font-inter leading-relaxed">
                  Approval typically takes 24–48 hours. We'll notify you as soon as the review is complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Contact ──────────────────────────────────────────────────────── */}
        <div className="nexora-card rounded-2xl p-5 mb-4">
          <p className="text-[10px] text-white/25 font-semibold uppercase tracking-widest mb-4 font-inter">Need Help?</p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm font-inter">
              <div className="w-8 h-8 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-3.5 h-3.5 text-gold/60" />
              </div>
              <span className="text-white/40">support@barberhub.com</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-inter">
              <div className="w-8 h-8 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-3.5 h-3.5 text-gold/60" />
              </div>
              <span className="text-white/40">+91 98765 43210</span>
            </div>
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="space-y-2.5">
          {shopStatus === 'pending' && (
            <>
              <button onClick={() => checkShopStatus()} disabled={loading}
                className="w-full py-3.5 rounded-xl border border-white/12 text-white/50 hover:border-gold/30 hover:text-white transition-all text-sm font-semibold font-inter flex items-center justify-center gap-2 disabled:opacity-40">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Check Status Now
              </button>
              <button onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl text-white/25 hover:text-white/50 transition-all text-sm font-inter flex items-center justify-center gap-2">
                <Home className="w-4 h-4" /> Go to Homepage
              </button>
            </>
          )}

          {shopStatus === 'approved' && (
            <button onClick={() => navigate('/owner/dashboard')}
              className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm shadow-gold transition-all flex items-center justify-center gap-2 font-inter">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {shopStatus === 'rejected' && (
            <>
              <button onClick={() => navigate('/owner/register')}
                className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-sm shadow-gold transition-all flex items-center justify-center gap-2 font-inter">
                Submit New Registration
              </button>
              <button onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl border border-white/12 text-white/50 hover:border-white/20 hover:text-white transition-all text-sm font-inter flex items-center justify-center gap-2">
                <Home className="w-4 h-4" /> Go to Homepage
              </button>
            </>
          )}

          {shopStatus === 'suspended' && (
            <button onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-xl border border-white/12 text-white/50 hover:border-white/20 hover:text-white transition-all text-sm font-inter flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Go to Homepage
            </button>
          )}

          <button onClick={handleLogout}
            className="w-full py-2.5 text-xs text-white/15 hover:text-white/35 transition-colors font-inter">
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}
