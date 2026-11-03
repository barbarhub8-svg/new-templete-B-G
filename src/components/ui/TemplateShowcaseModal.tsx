import React from 'react';
import { X, Sparkles, Eye, Check, ArrowRight, Crown, Layers } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

export interface SalonTemplate {
  id: string;
  name: string;
  tagline: string;
  category: string;
  image: string;
  accentColor: string;
  badge: string;
  description: string;
  features: string[];
}

export const SALON_TEMPLATES: SalonTemplate[] = [
  {
    id: 'obsidian-gold',
    name: 'Obsidian Gold Luxury',
    tagline: 'Timeless high-end sophistication with brushed gold and deep obsidian tones.',
    category: 'Luxury Barbershop & Salon',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&h=600&fit=crop&q=90',
    accentColor: '#D4AF37',
    badge: 'Signature Theme',
    description: 'Designed for elite barbers and premium salons seeking a high-status, gold-accented digital presence.',
    features: ['Live Multi-View Calendar', 'VIP Member Portal', 'Gold Badge Showcase', 'Instant WhatsApp Booking'],
  },
  {
    id: 'minimalist-black',
    name: 'Minimalist Modern Black',
    tagline: 'Sleek monochrome aesthetic with high-contrast typography and clean glassmorphism.',
    category: 'Contemporary Studio',
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&h=600&fit=crop&q=90',
    accentColor: '#FFFFFF',
    badge: 'Most Popular',
    description: 'A contemporary urban style with sharp lines, dark charcoal containers, and crystal-clear service grids.',
    features: ['Minimalist Slot Grid', 'Staff Skill Badges', 'Dark Glass Cards', 'Fast Mobile Checkout'],
  },
  {
    id: 'royal-velvet',
    name: 'Royal Velvet Spa & Salon',
    tagline: 'Deep velvet dark charcoal with warm golden glow and serene wellness ambiance.',
    category: 'Luxury Spa & Wellness',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&h=600&fit=crop&q=90',
    accentColor: '#E5C158',
    badge: 'Relaxation Focus',
    description: 'Creates a calming, opulent atmosphere tailored for holistic wellness, spa therapies, and high-end facial studios.',
    features: ['Therapy Duration Selectors', 'Relaxation Audio Toggles', 'Package Bundling', 'Client Glow Ratings'],
  },
  {
    id: 'chic-bohemian',
    name: 'Chic Bohemian Glow',
    tagline: 'Warm bronze and artisanal undertones for creative hair and nail art studios.',
    category: 'Boutique Hair & Nail Studio',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&h=600&fit=crop&q=90',
    accentColor: '#D9A76A',
    badge: 'Creative Choice',
    description: 'Warm, inviting color palettes with artisanal photo grids and vibrant styling portfolios.',
    features: ['Portfolio Gallery Tab', 'Nail Art Customizer', 'Instagram Feed Sync', 'Referral Rewards Widget'],
  },
];

interface TemplateShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLivePreview: (template: SalonTemplate) => void;
  onSelectAndRegister: (templateId: string) => void;
}

export function TemplateShowcaseModal({
  isOpen,
  onClose,
  onLivePreview,
  onSelectAndRegister,
}: TemplateShowcaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0A0A0A]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-[#141414] rounded-3xl border border-gold/20 shadow-2xl flex flex-col overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/8 bg-[#181818]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-playfair font-bold text-xl text-white tracking-wide">Website Template Showcase</h2>
              <p className="text-xs text-white/40 font-inter">Explore signature dark luxury themes designed for modern salon brands</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {SALON_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="nexora-card rounded-2xl overflow-hidden border border-white/10 hover:border-gold/40 transition-all group flex flex-col"
              >
                {/* Thumbnail Image */}
                <div className="relative h-48 sm:h-52 overflow-hidden bg-black/40">
                  <img
                    src={tmpl.image}
                    alt={tmpl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0A0A0A]/90 text-gold border border-gold/30 shadow-md">
                      {tmpl.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-white/80 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                      {tmpl.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-playfair font-bold text-lg text-white group-hover:text-gold transition-colors">
                      {tmpl.name}
                    </h3>
                    <p className="text-xs text-white/50 font-inter leading-relaxed">
                      {tmpl.tagline}
                    </p>
                    <p className="text-xs text-white/35 font-inter pt-1">
                      {tmpl.description}
                    </p>

                    {/* Features list */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {tmpl.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-1.5 text-[11px] text-white/60">
                          <Check className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                    <button
                      type="button"
                      onClick={() => onLivePreview(tmpl)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-gold" />
                      <span>Live Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectAndRegister(tmpl.id)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-xs flex items-center justify-center gap-2 shadow-gold transition-all"
                    >
                      <span>Use Theme</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-[#181818] border-t border-white/8 flex items-center justify-between">
          <p className="text-xs text-white/40 font-inter">
            All themes are fully customizable upon registering your salon.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            Close Showcase
          </button>
        </div>
      </div>
    </div>
  );
}
