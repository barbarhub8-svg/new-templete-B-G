import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wallet, Store, LogOut, Scissors, User, Users, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

export default function OwnerLayout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate('/login');
  };

  const staffRole = (user as any)?.appAccessRole || (user as any)?.app_access_role;
  const isServiceProvider = staffRole === 'Service Provider (Assigned)';
  const isReceptionist = staffRole === 'Receptionist (Frontdesk)';

  const allNavItems = [
    { to: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard', allowed: true },
    { to: '/owner/bookings',  icon: Calendar,        label: 'Bookings',  allowed: true },
    { to: '/owner/services',  icon: Scissors,        label: 'Services',  allowed: !isServiceProvider },
    { to: '/owner/staff',     icon: Users,           label: 'Staff',     allowed: !isServiceProvider && !isReceptionist },
    { to: '/owner/wallet',    icon: Wallet,          label: 'Wallet',    allowed: !isServiceProvider && !isReceptionist },
    { to: '/owner/profile',   icon: User,            label: 'Profile',   allowed: true },
  ];

  const navItems = allNavItems.filter((item) => item.allowed);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="bg-[#0A0A0A] border-b border-white/8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center flex-shrink-0 shadow-gold">
                <span className="text-[#0A0A0A] font-playfair font-bold text-base">N</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-playfair font-bold text-sm tracking-widest uppercase text-gold leading-none">Nexora</p>
                <p className="text-[9px] tracking-[0.25em] uppercase text-white/30 mt-0.5 font-inter">Salonos · Owner</p>
              </div>
            </div>

            {/* Right: user + logout */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-gold text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || 'O'}
                    </span>
                  </div>
                  <span className="text-white/70 text-xs font-medium truncate max-w-[120px]">{user.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-red-400 hover:bg-red-400/5 border border-white/10 hover:border-red-400/20 px-3 py-2 rounded-lg transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Navigation Tabs ───────────────────────────────────────── */}
      <nav className="bg-[#0A0A0A] border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-5 py-3.5 text-xs font-semibold tracking-wide border-b-2 transition-all whitespace-nowrap font-inter ${
                    isActive
                      ? 'border-gold text-gold'
                      : 'border-transparent text-white/40 hover:text-white/70 hover:border-white/20'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
