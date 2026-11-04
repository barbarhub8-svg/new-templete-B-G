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
  /** Elite Indian demo house showcased in the live preview. */
  demoBrand: string;
  demoLocation: string;
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
    description: 'Crafted for India’s royal barbering houses and premium salons seeking a high-status, gold-accented digital darbar.',
    features: ['Live Multi-View Calendar', 'VIP Member Portal', 'Gold Badge Showcase', 'Instant WhatsApp Booking'],
    demoBrand: 'The Royal Turban Barber & Co.',
    demoLocation: 'C-Scheme, Jaipur',
  },
  {
    id: 'minimalist-black',
    name: 'Minimalist Modern Black',
    tagline: 'Sleek monochrome aesthetic with high-contrast typography and clean glassmorphism.',
    category: 'Contemporary Studio',
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&h=600&fit=crop&q=90',
    accentColor: '#FFFFFF',
    badge: 'Most Popular',
    description: 'A contemporary urban style for metro grooming studios — sharp lines, dark charcoal containers, and crystal-clear service grids.',
    features: ['Minimalist Slot Grid', 'Staff Skill Badges', 'Dark Glass Cards', 'Fast Mobile Checkout'],
    demoBrand: 'Bespoke Bombay Grooming Co.',
    demoLocation: 'Bandra West, Mumbai',
  },
  {
    id: 'royal-velvet',
    name: 'Royal Velvet Spa & Salon',
    tagline: 'Deep velvet dark charcoal with warm golden glow and serene wellness ambiance.',
    category: 'Luxury Spa & Wellness',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&h=600&fit=crop&q=90',
    accentColor: '#E5C158',
    badge: 'Relaxation Focus',
    description: 'A calming, opulent atmosphere for Ayurvedic wellness sanctuaries, champi spas, and bridal glow studios.',
    features: ['Therapy Duration Selectors', 'Relaxation Audio Toggles', 'Package Bundling', 'Client Glow Ratings'],
    demoBrand: 'Jaipur Royal Salon & Spa',
    demoLocation: 'Civil Lines, Jaipur',
  },
  {
    id: 'chic-bohemian',
    name: 'Chic Bohemian Glow',
    tagline: 'Warm bronze and artisanal undertones for creative hair and nail art studios.',
    category: 'Boutique Hair & Nail Studio',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&h=600&fit=crop&q=90',
    accentColor: '#D9A76A',
    badge: 'Creative Choice',
    description: 'Warm, inviting palettes with artisanal photo grids — made for boutique ateliers and creative styling houses.',
    features: ['Portfolio Gallery Tab', 'Nail Art Customizer', 'Instagram Feed Sync', 'Referral Rewards Widget'],
    demoBrand: 'Maharaja & Mane Luxury Atelier',
    demoLocation: 'Khan Market, New Delhi',
  },
];
