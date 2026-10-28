import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, Gift } from 'lucide-react';
import { useState } from 'react';

export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = location.pathname === '/';

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A]">
      {/* ── Sticky Header ─────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 w-full ${
          isHome
            ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gold/10'
            : 'bg-[#0A0A0A] border-b border-white/8'
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-lg bg-gold-gradient flex items-center justify-center flex-shrink-0 shadow-gold">
                <span className="text-[#0A0A0A] font-playfair font-bold text-lg">N</span>
              </div>
              <div className="hidden sm:block">
                <p className="font-playfair font-bold text-[15px] tracking-widest uppercase text-gold leading-none">
                  Nexora
                </p>
                <p className="text-[9px] tracking-[0.25em] uppercase text-white/40 mt-0.5 font-inter">
                  Salon Services
                </p>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Salons', path: '/salons' },
                { label: 'My Bookings', path: '/my-bookings' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === path
                      ? 'text-gold bg-gold/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/my-bookings')}
                className="hidden md:flex items-center gap-2 text-sm font-medium text-white/60 hover:text-gold border border-white/10 hover:border-gold/40 px-4 py-2 rounded-lg transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Bookings</span>
              </button>

              {/* Rewards Button — highlighted */}
              <button
                type="button"
                onClick={() => navigate('/rewards')}
                className={`hidden md:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all border ${
                  location.pathname === '/rewards'
                    ? 'bg-gold text-[#0A0A0A] border-gold shadow-gold'
                    : 'text-gold/80 hover:text-gold border-gold/25 hover:border-gold/50 bg-gold/5 hover:bg-gold/10'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Rewards</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm font-semibold text-[#0A0A0A] bg-gold hover:bg-gold-light px-5 py-2 rounded-lg transition-all shadow-gold"
              >
                Owner Login
              </button>

              {/* Mobile menu */}
              <button
                type="button"
                className="md:hidden w-9 h-9 flex items-center justify-center text-white/60 hover:text-white"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav Dropdown */}
          {menuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-white/8 space-y-1 pb-2">
              {[
                { label: 'Salons', path: '/salons' },
                { label: 'My Bookings', path: '/my-bookings' },
                { label: '🎁 Rewards', path: '/rewards' },
                { label: 'Terms', path: '/terms' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => { navigate(path); setMenuOpen(false); }}
                  className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    path === '/rewards' ? 'text-gold hover:bg-gold/8' : 'text-white/70 hover:text-gold hover:bg-gold/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 bg-[#0A0A0A] mt-16 w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
                <span className="text-[#0A0A0A] font-playfair font-bold text-sm">N</span>
              </div>
              <div>
                <p className="font-playfair font-bold text-sm tracking-widest uppercase text-gold">Nexora</p>
                <p className="text-[9px] tracking-[0.2em] uppercase text-white/30">Nexora · Salon Services · Premium Grooming</p>
              </div>
            </div>
            <div className="gold-divider hidden md:block flex-1 mx-8" />
            <p className="text-white/30 text-xs text-center">
              © {new Date().getFullYear()} Nexora Salonos. All rights reserved. ·{' '}
              <button type="button" onClick={() => navigate('/terms')} className="text-gold/40 hover:text-gold transition-colors">Terms</button>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
