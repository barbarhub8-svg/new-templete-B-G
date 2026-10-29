import React, { useState } from 'react';
import {
  Instagram, Facebook, Globe, ExternalLink, Heart, MessageCircle,
  Sparkles, Camera, CheckCircle2, ArrowUpRight, Grid3X3
} from 'lucide-react';

interface SocialPortfolioProps {
  shopName: string;
  instagramHandle?: string | null;
  instagramUrl?: string | null;
  facebookHandle?: string | null;
  facebookUrl?: string | null;
  websiteUrl?: string | null;
  portfolioPhotos?: string[];
}

export function SocialPortfolioSection({
  shopName,
  instagramHandle,
  instagramUrl,
  facebookHandle,
  facebookUrl,
  websiteUrl,
  portfolioPhotos = [],
}: SocialPortfolioProps) {
  // Generate fallback handles if none explicitly provided for demo shops
  const sanitizedShopSlug = shopName.toLowerCase().replace(/[^a-z0-0]/g, '');
  const igHandle = instagramHandle || `@${sanitizedShopSlug || 'nexora.salon'}`;
  const igUrl = instagramUrl || `https://instagram.com/${igHandle.replace('@', '')}`;
  const fbHandle = facebookHandle || `facebook.com/${sanitizedShopSlug || 'nexora.salon'}`;
  const fbUrl = facebookUrl || `https://${fbHandle}`;

  // High quality work portfolio photos for Instagram feed grid
  const sampleFeed = portfolioPhotos.length >= 4 ? portfolioPhotos.slice(0, 4) : [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=800&fit=crop&q=85',
    'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&h=800&fit=crop&q=85',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=800&fit=crop&q=85',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=800&fit=crop&q=85',
  ];

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="gold-divider w-10 mb-3" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1px] flex-shrink-0">
              <div className="w-full h-full bg-[#121212] rounded-[11px] flex items-center justify-center">
                <Instagram className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <h2 className="font-playfair font-bold text-white text-2xl sm:text-3xl">
              Social Portfolio & Latest Work
            </h2>
          </div>
          <p className="text-white/40 text-xs sm:text-sm font-inter mt-1">
            Follow live transformations, client reels, and couture styling on Instagram & Facebook
          </p>
        </div>
      </div>

      {/* Social Links Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Instagram Profile Card */}
        <div className="bg-gradient-to-br from-[#1C1820] via-[#141414] to-[#0E0E0E] border border-rose-500/25 rounded-2xl p-4 flex flex-col justify-between hover:border-rose-500/50 hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] transition-all duration-300 group relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-md flex-shrink-0">
                <div className="w-full h-full bg-[#121212] rounded-[14px] flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-pink-400" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="font-playfair font-bold text-white text-base truncate">{igHandle}</h3>
                  <CheckCircle2 className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                </div>
                <p className="text-white/40 text-xs font-inter">Instagram Portfolio</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-inter text-white/50 mb-3 pt-2 border-t border-white/8">
            <span>✨ Daily Client Reels</span>
            <span className="text-pink-400 font-semibold">12.4k followers</span>
          </div>

          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 via-rose-600 to-amber-500 hover:opacity-90 text-white font-inter font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Follow on Instagram</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        {/* Facebook Page Card */}
        <div className="bg-gradient-to-br from-[#121824] via-[#141414] to-[#0E0E0E] border border-blue-500/25 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all duration-300 group relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 shadow-md flex items-center justify-center flex-shrink-0">
                <Facebook className="w-6 h-6 text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="font-playfair font-bold text-white text-base truncate">{shopName}</h3>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                </div>
                <p className="text-white/40 text-xs font-inter">Facebook Official Page</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-inter text-white/50 mb-3 pt-2 border-t border-white/8">
            <span>Verified Page</span>
            <span className="text-blue-400 font-semibold">8.5k Likes & Reviews</span>
          </div>

          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-inter font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Facebook className="w-3.5 h-3.5" />
            <span>Visit Facebook Page</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        {/* Official Website / Salon Hub Card */}
        <div className="bg-gradient-to-br from-[#181612] via-[#141414] to-[#0E0E0E] border border-gold/25 rounded-2xl p-4 flex flex-col justify-between hover:border-gold/50 hover:shadow-[0_0_25px_rgba(212,175,55,0.2)] transition-all duration-300 group relative overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 shadow-md flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-gold" />
              </div>
              <div className="min-w-0">
                <h3 className="font-playfair font-bold text-white text-base truncate">{shopName}</h3>
                <p className="text-white/40 text-xs font-inter">Nexora Premier Partner</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-inter text-white/50 mb-3 pt-2 border-t border-white/8">
            <span>Instant Slot Booking</span>
            <span className="text-gold font-semibold">Official Suite</span>
          </div>

          <a
            href={websiteUrl || `#`}
            onClick={(e) => {
              if (!websiteUrl) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            target={websiteUrl ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-gold hover:bg-gold-light text-[#0A0A0A] font-inter font-bold text-xs rounded-xl shadow-gold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Visit Salon Portfolio</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* Live Instagram Feed Grid Preview */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-bold text-white font-inter tracking-wide uppercase">
              Recent Instagram Portfolio ({igHandle})
            </span>
          </div>
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-gold hover:underline flex items-center gap-1 font-inter"
          >
            View full feed <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sampleFeed.map((photoUrl, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="relative aspect-square rounded-xl overflow-hidden bg-[#1A1A1A] group border border-white/10 cursor-pointer"
            >
              <img
                src={photoUrl}
                alt={`${shopName} portfolio ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />

              {/* Dark Instagram Hover Overlay */}
              <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 flex items-center justify-center gap-4 text-white font-inter font-bold text-xs ${
                  hoveredIdx === idx ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="flex items-center gap-1 text-pink-400">
                  <Heart className="w-4 h-4 fill-pink-400" />
                  <span>{240 + idx * 85}</span>
                </div>
                <div className="flex items-center gap-1 text-white">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{18 + idx * 4}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
