import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Eye, ArrowRight, Check, Layers, Crown, Shield, Zap } from 'lucide-react';
import { SALON_TEMPLATES, SalonTemplate } from '../../components/ui/TemplateShowcaseModal';
import { TemplateLivePreviewModal } from '../../components/ui/TemplateLivePreviewModal';

export default function TemplatesGalleryPage() {
  const navigate = useNavigate();
  const [livePreviewTemplate, setLivePreviewTemplate] = useState<SalonTemplate | null>(null);

  function handleSelectAndRegister(templateId: string) {
    localStorage.setItem('nexora_selected_template', templateId);
    setLivePreviewTemplate(null);
    navigate('/owner/register');
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] text-white pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/8 py-20 px-4 sm:px-8 lg:px-12 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gold/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold font-inter">
            <Sparkles className="w-4 h-4" />
            <span>Signature Dark Luxury Themes</span>
          </div>

          <h1 className="font-playfair font-bold text-4xl sm:text-6xl text-white tracking-tight">
            Explore Salon <span className="text-gold">Website Themes</span>
          </h1>

          <p className="text-white/60 text-base sm:text-lg font-inter leading-relaxed max-w-2xl mx-auto">
            Choose from our meticulously crafted dark luxury templates designed for India’s elite barbering houses, premium salons, and Ayurvedic wellness sanctuaries. Click 'Live Preview' to experience the interactive client booking flow.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-white/50 font-inter">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              <span>Mobile Optimized</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" />
              <span>Instant Setup in 60s</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-gold" />
              <span>Dark Luxury Aesthetic</span>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Grid Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {SALON_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="nexora-card rounded-3xl overflow-hidden border border-white/10 hover:border-gold/50 transition-all group flex flex-col shadow-xl bg-[#121212]"
            >
              {/* Image Preview Header */}
              <div className="relative h-64 sm:h-72 overflow-hidden bg-black/50">
                <img
                  src={tmpl.image}
                  alt={tmpl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0A0A0A]/90 text-gold border border-gold/30 shadow-lg">
                    {tmpl.badge}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white bg-black/70 px-3 py-1 rounded-xl backdrop-blur-md border border-white/10">
                    {tmpl.category}
                  </span>
                </div>
              </div>

              {/* Details Body */}
              <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h3 className="font-playfair font-bold text-2xl text-white group-hover:text-gold transition-colors">
                    {tmpl.name}
                  </h3>
                  <p className="text-sm text-white/60 font-inter leading-relaxed">
                    {tmpl.tagline}
                  </p>
                  <p className="text-xs text-white/40 font-inter pt-1">
                    {tmpl.description}
                  </p>
                  <p className="text-[11px] text-gold/70 font-inter pt-1.5">
                    Live preview: {tmpl.demoBrand} · {tmpl.demoLocation}
                  </p>

                  {/* Feature Checklist */}
                  <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-white/8">
                    {tmpl.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-xs text-white/70">
                        <Check className="w-4 h-4 text-gold flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/8">
                  <button
                    type="button"
                    onClick={() => setLivePreviewTemplate(tmpl)}
                    className="flex-1 py-3 px-5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye className="w-4 h-4 text-gold" />
                    <span>Live Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAndRegister(tmpl.id)}
                    className="flex-1 py-3 px-5 rounded-xl bg-gold hover:bg-gold-light text-[#0A0A0A] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-gold transition-all hover:scale-105"
                  >
                    <span>Use This Theme</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Preview Modal */}
      <TemplateLivePreviewModal
        isOpen={Boolean(livePreviewTemplate)}
        template={livePreviewTemplate}
        onClose={() => setLivePreviewTemplate(null)}
        onSelectAndRegister={handleSelectAndRegister}
      />
    </div>
  );
}
