import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Shield, ChevronRight, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { useState } from 'react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    logout();
    navigate('/admin');
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* ── Mobile overlay ────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={()=>setMobileOpen(false)} />
      )}

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside className={`
        fixed md:sticky top-0 h-screen w-60 bg-[#0E0E0E] border-r border-gold/10 flex flex-col z-50
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="p-5 border-b border-gold/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
              <Shield className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <div>
              <p className="font-playfair font-bold text-gold text-sm tracking-widest uppercase leading-none">Nexora</p>
              <p className="text-[9px] font-semibold text-gold/40 uppercase tracking-[0.2em] mt-0.5">Admin Panel</p>
            </div>
          </div>
          <button className="md:hidden text-white/30 hover:text-white" onClick={()=>setMobileOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {[{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }].map(({ href, label, icon: Icon }) => {
            const active = location.pathname === href;
            return (
              <button key={href} onClick={()=>{navigate(href);setMobileOpen(false);}}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all font-inter ${
                  active ? 'bg-gold/10 text-gold border border-gold/20' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-gold/50" />}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-gold/10">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-white/3 border border-white/8 rounded-xl">
            <div className="w-7 h-7 bg-gold/15 border border-gold/25 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gold text-xs font-bold font-playfair">
                {(user as any)?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate font-inter">{(user as any)?.name || 'Admin'}</p>
              <p className="text-white/30 text-[10px] truncate font-inter">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs font-medium text-white/40 hover:text-red-400 hover:bg-red-400/5 rounded-xl px-3 py-2.5 transition-all font-inter">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="flex-1 overflow-auto min-w-0">
        {/* Sticky Header */}
        <header className="bg-[#0E0E0E]/90 border-b border-gold/10 backdrop-blur-sm sticky top-0 z-30 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button className="md:hidden w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-white/50 hover:text-white"
                onClick={()=>setMobileOpen(true)}>
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-white font-playfair font-semibold text-lg leading-none">Admin Dashboard</h1>
                <p className="text-white/25 text-xs mt-0.5 font-inter">
                  {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/5 border border-gold/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-gold text-xs font-medium font-inter">System Online</span>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
