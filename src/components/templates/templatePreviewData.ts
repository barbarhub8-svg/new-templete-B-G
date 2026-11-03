// =====================================================
// LOCALIZED DEMO BRANDS — used ONLY by the template live
// previews (TemplateLivePreviewModal). Every theme in the
// gallery showcases an elite Indian luxury grooming house
// with INR pricing, Indian master professionals and
// festival-season privileges. Never imported by the
// published salon website (ShopMiniWebsite).
// =====================================================

export interface TemplatePreviewService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  is_active: boolean;
}

export interface TemplatePreviewStaff {
  id: string;
  shop_id: string;
  full_name: string;
  primary_role: string;
  avatar_url: string;
  status: string;
  specializations: string[];
  years_of_experience: number;
  is_active: boolean;
}

export interface TemplatePreviewOffer {
  id: string;
  badge: string;
  title: string;
  description: string;
  code: string;
}

export interface TemplatePreviewReview {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface TemplatePreviewBrand {
  templateId: string;
  name: string;
  category: string;
  tagline: string;
  welcome: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  rating: number;
  reviewCount: number;
  heroImage: string;
  announcement: { text: string; code: string };
  services: TemplatePreviewService[];
  staff: TemplatePreviewStaff[];
  offers: TemplatePreviewOffer[];
  reviews: TemplatePreviewReview[];
}

// ── Canonical Indian premium service menu (INR) ─────────────────────────────
export const INDIAN_SIGNATURE_SERVICES = {
  beardSculpt: {
    name: 'Royal Shahi Beard Sculpt & Hot Towel Treatment',
    description: 'Contour mapping, hot towel compress and a razor-sharp finish with kesar-sandalwood oils.',
    price: 950,
    duration_minutes: 40,
    category: 'Beard & Shave',
  },
  ubtanGlow: {
    name: 'Ubtan & Gold Leaf Bridal/Groom Facial Glow Ritual',
    description: 'Traditional ubtan cleanse, 24K gold leaf infusion and a cooling rose-jal mask.',
    price: 3500,
    duration_minutes: 75,
    category: 'Bridal & Groom',
  },
  champi: {
    name: 'Ayurvedic Scalp Detox & Champi Therapy',
    description: 'Bhringraj-amla scalp detox with steam and a slow traditional champi massage.',
    price: 1600,
    duration_minutes: 50,
    category: 'Ayurvedic Spa',
  },
  indoWestern: {
    name: 'Designer Indo-Western Hair Styling & Cut',
    description: 'Bespoke scissor-and-clipper artistry blending Indian and Western silhouettes.',
    price: 1800,
    duration_minutes: 60,
    category: 'Hair Artistry',
  },
  groomPackage: {
    name: 'Pre-Wedding Royal Groom Package',
    description: 'Signature cut, shahi beard sculpt, gold leaf glow facial and champi in one regal sitting.',
    price: 6500,
    duration_minutes: 150,
    category: 'Wedding Packages',
  },
} as const;

function svc(id: string, key: keyof typeof INDIAN_SIGNATURE_SERVICES): TemplatePreviewService {
  return { id, ...INDIAN_SIGNATURE_SERVICES[key], is_active: true };
}

// ── Festival privileges shared across the ecosystem ─────────────────────────
export const FESTIVAL_OFFERS: TemplatePreviewOffer[] = [
  {
    id: 'offer-diwali',
    badge: 'Diwali Darbar',
    title: 'Festive Glow Privilege — 20% Off',
    description: 'Celebrate the festival of lights with 20% off every signature grooming and wellness ritual.',
    code: 'DIWALI20',
  },
  {
    id: 'offer-shaadi',
    badge: 'Shaadi Season',
    title: 'Royal Wedding Reserve — 30% Off',
    description: '30% off the Pre-Wedding Royal Groom Package for your big-day transformation.',
    code: 'SHAADI30',
  },
  {
    id: 'offer-festiveglow',
    badge: 'Festive Pairing',
    title: 'Ubtan Glow On The House',
    description: 'Pair any hair artistry service with champi therapy and receive a complimentary ubtan glow ritual.',
    code: 'FESTIVEGLOW',
  },
];

export const TEMPLATE_PREVIEW_BRANDS: Record<string, TemplatePreviewBrand> = {
  // ── TEMPLATE 02 — Minimalist Modern Black ─────────────────────────────────
  'minimalist-black': {
    templateId: 'minimalist-black',
    name: 'Bespoke Bombay Grooming Co.',
    category: 'Contemporary Grooming Studio',
    tagline: 'Sharp lines. Subtle luxury. Unmistakably Bombay.',
    welcome: 'Namaste, and welcome to Bandra’s most discreet grooming studio.',
    description:
      'A monochrome sanctuary off Linking Road where Bombay’s creatives and founders reserve precision Indo-Western cuts, shahi beard architecture and Ayurvedic resets between meetings.',
    address: '45, Linking Road, Bandra West',
    city: 'Mumbai, Maharashtra',
    phone: '+91 98200 45678',
    hours: '10:00 AM – 10:00 PM · Closed Tuesday',
    rating: 4.8,
    reviewCount: 264,
    heroImage: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1400&h=800&fit=crop&q=85',
    announcement: {
      text: 'Diwali in Bandra — 20% off every signature ritual this festive season.',
      code: 'DIWALI20',
    },
    services: [
      svc('mb-s1', 'indoWestern'),
      svc('mb-s2', 'beardSculpt'),
      svc('mb-s3', 'champi'),
      svc('mb-s4', 'groomPackage'),
    ],
    staff: [
      {
        id: 'mb-st1',
        shop_id: 'preview',
        full_name: 'Vivaan Kapoor',
        primary_role: 'Master Barber',
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
        status: 'Available',
        specializations: ['Indo-Western Cuts', 'Skin Fades'],
        years_of_experience: 10,
        is_active: true,
      },
      {
        id: 'mb-st2',
        shop_id: 'preview',
        full_name: 'Arjun Nair',
        primary_role: 'Beard Sculptor',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
        status: 'Available',
        specializations: ['Shahi Beard Sculpt', 'Straight Razor'],
        years_of_experience: 8,
        is_active: true,
      },
      {
        id: 'mb-st3',
        shop_id: 'preview',
        full_name: 'Zoya Sheikh',
        primary_role: 'Senior Colour Artist',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
        status: 'Available',
        specializations: ['Global Colour', 'Gloss Rituals'],
        years_of_experience: 7,
        is_active: true,
      },
    ],
    offers: FESTIVAL_OFFERS,
    reviews: [
      {
        id: 'mb-r1',
        customer_name: 'Aditya Kulkarni',
        rating: 5,
        comment: 'The cleanest Indo-Western cut in Bandra. Booked on WhatsApp, in and out within the hour — pure Bombay efficiency with five-star hospitality.',
        created_at: '2026-10-22T11:00:00Z',
      },
      {
        id: 'mb-r2',
        customer_name: 'Sana Merchant',
        rating: 5,
        comment: 'Minimal, calm and spotless. The Ayurvedic champi after a work week is my favourite reset in the city.',
        created_at: '2026-10-27T15:30:00Z',
      },
    ],
  },

  // ── TEMPLATE 03 — Royal Velvet Spa & Salon ────────────────────────────────
  'royal-velvet': {
    templateId: 'royal-velvet',
    name: 'Jaipur Royal Salon & Spa',
    category: 'Luxury Spa & Wellness Sanctuary',
    tagline: 'Velvet calm, golden glow — the Pink City’s royal wellness address.',
    welcome: 'Padharo mhare des — step into a sanctuary of Ayurvedic serenity.',
    description:
      'Behind the heritage facades of Civil Lines, our therapists blend Rajasthani ubtan wisdom with slow Ayurvedic champi, gold leaf glow rituals and bridal-grade wellness in private velvet suites.',
    address: '8, Raj Bhavan Enclave, Civil Lines',
    city: 'Jaipur, Rajasthan',
    phone: '+91 98290 56789',
    hours: '9:00 AM – 9:00 PM · Open all week',
    rating: 4.9,
    reviewCount: 342,
    heroImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1400&h=800&fit=crop&q=85',
    announcement: {
      text: 'Shaadi season privilege — 30% off the Pre-Wedding Royal Groom Package.',
      code: 'SHAADI30',
    },
    services: [
      svc('rv-s1', 'ubtanGlow'),
      svc('rv-s2', 'champi'),
      svc('rv-s3', 'groomPackage'),
      svc('rv-s4', 'beardSculpt'),
    ],
    staff: [
      {
        id: 'rv-st1',
        shop_id: 'preview',
        full_name: 'Devika Shekhawat',
        primary_role: 'Senior Spa Therapist',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        status: 'Available',
        specializations: ['Ayurvedic Champi', 'Ubtan Rituals'],
        years_of_experience: 9,
        is_active: true,
      },
      {
        id: 'rv-st2',
        shop_id: 'preview',
        full_name: 'Aarav Sharma',
        primary_role: 'Master Stylist',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        status: 'Available',
        specializations: ['Indo-Western Styling', 'Groom Makeovers'],
        years_of_experience: 12,
        is_active: true,
      },
      {
        id: 'rv-st3',
        shop_id: 'preview',
        full_name: 'Meera Rathore',
        primary_role: 'Bridal Glow Specialist',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
        status: 'Available',
        specializations: ['Gold Leaf Facials', 'Bridal Wellness'],
        years_of_experience: 8,
        is_active: true,
      },
    ],
    offers: FESTIVAL_OFFERS,
    reviews: [
      {
        id: 'rv-r1',
        customer_name: 'Padmavati Kumari',
        rating: 5,
        comment: 'The ubtan and gold leaf ritual before my reception was pure magic — my skin glowed in every photograph. True royal hospitality.',
        created_at: '2026-10-20T10:30:00Z',
      },
      {
        id: 'rv-r2',
        customer_name: 'Harsh Vardhan Singh',
        rating: 5,
        comment: 'The champi therapy is the deepest relaxation I have experienced in Jaipur. The velvet suites feel like a palace retreat.',
        created_at: '2026-10-29T17:00:00Z',
      },
    ],
  },

  // ── TEMPLATE 04 — Chic Bohemian Glow ──────────────────────────────────────
  'chic-bohemian': {
    templateId: 'chic-bohemian',
    name: 'Maharaja & Mane Luxury Atelier',
    category: 'Boutique Hair & Grooming Atelier',
    tagline: 'Artisanal warmth, bronze glow — crafted for Delhi’s style connoisseurs.',
    welcome: 'Namaste — Delhi’s most-loved atelier welcomes you with chai and craft.',
    description:
      'A sun-warmed atelier on Khan Market’s Middle Lane where creative directors, designers and wedding parties commission Indo-Western transformations, artisanal colour and ubtan glow rituals.',
    address: '21, Middle Lane, Khan Market',
    city: 'New Delhi',
    phone: '+91 98110 67890',
    hours: '9:30 AM – 9:30 PM · Closed Monday',
    rating: 4.9,
    reviewCount: 287,
    heroImage: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1400&h=800&fit=crop&q=85',
    announcement: {
      text: 'Festive pairing — complimentary ubtan glow ritual with every cut & champi booking.',
      code: 'FESTIVEGLOW',
    },
    services: [
      svc('cb-s1', 'indoWestern'),
      svc('cb-s2', 'ubtanGlow'),
      svc('cb-s3', 'beardSculpt'),
      svc('cb-s4', 'champi'),
    ],
    staff: [
      {
        id: 'cb-st1',
        shop_id: 'preview',
        full_name: 'Rohan Verma',
        primary_role: 'Creative Director',
        avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
        status: 'Available',
        specializations: ['Editorial Styling', 'Groom Transformations'],
        years_of_experience: 11,
        is_active: true,
      },
      {
        id: 'cb-st2',
        shop_id: 'preview',
        full_name: 'Ishita Malhotra',
        primary_role: 'Senior Hair Artist',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
        status: 'Available',
        specializations: ['Balayage', 'Indo-Western Cuts'],
        years_of_experience: 8,
        is_active: true,
      },
      {
        id: 'cb-st3',
        shop_id: 'preview',
        full_name: 'Kabir Mehra',
        primary_role: 'Beard Sculptor',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
        status: 'Available',
        specializations: ['Shahi Beard Sculpt', 'Hot Towel Rituals'],
        years_of_experience: 9,
        is_active: true,
      },
    ],
    offers: FESTIVAL_OFFERS,
    reviews: [
      {
        id: 'cb-r1',
        customer_name: 'Tarini Chadha',
        rating: 5,
        comment: 'Rohan understood my brief instantly — the Indo-Western texture cut is the best I have had in Delhi. The atelier feels like a warm artist’s home.',
        created_at: '2026-10-21T13:00:00Z',
      },
      {
        id: 'cb-r2',
        customer_name: 'Yuvraj Ahuja',
        rating: 5,
        comment: 'Booked the shaadi package for my brother’s wedding. The shahi beard sculpt and ubtan glow made him look like royalty on the big day.',
        created_at: '2026-10-30T12:00:00Z',
      },
    ],
  },
};

// ── Per-theme visual identity for the live preview ──────────────────────────
// Literal Tailwind classes so the JIT compiler picks them up.
export interface TemplatePreviewTheme {
  page: string;
  surface: string;
  card: string;
  border: string;
  accentText: string;
  accentBg: string;
  accentSoftBg: string;
  accentBorder: string;
  headingFont: string;
  bodyFont: string;
  radius: string;
  eyebrow: string;
  heroGradient: string;
  nav: string;
}

export const TEMPLATE_PREVIEW_THEMES: Record<string, TemplatePreviewTheme> = {
  'minimalist-black': {
    page: 'bg-[#0B0B0C]',
    surface: 'bg-[#121214]',
    card: 'bg-[#141416] border border-white/10',
    border: 'border-white/10',
    accentText: 'text-white',
    accentBg: 'bg-white text-[#0B0B0C] hover:bg-white/85',
    accentSoftBg: 'bg-white/5',
    accentBorder: 'border-white/25',
    headingFont: 'font-inter tracking-tight',
    bodyFont: 'font-inter',
    radius: 'rounded-lg',
    eyebrow: 'text-white/60',
    heroGradient: 'from-[#0B0B0C] via-[#0B0B0C]/60 to-[#0B0B0C]/30',
    nav: 'bg-[#0B0B0C]/95',
  },
  'royal-velvet': {
    page: 'bg-[#120F16]',
    surface: 'bg-[#1A1520]',
    card: 'bg-[#1C1622] border border-[#E5C158]/20',
    border: 'border-[#E5C158]/20',
    accentText: 'text-[#E5C158]',
    accentBg: 'bg-[#E5C158] text-[#171220] hover:bg-[#F0D078]',
    accentSoftBg: 'bg-[#E5C158]/8',
    accentBorder: 'border-[#E5C158]/35',
    headingFont: 'font-playfair',
    bodyFont: 'font-inter',
    radius: 'rounded-3xl',
    eyebrow: 'text-[#E5C158]/80',
    heroGradient: 'from-[#120F16] via-[#120F16]/60 to-[#120F16]/30',
    nav: 'bg-[#120F16]/95',
  },
  'chic-bohemian': {
    page: 'bg-[#14100B]',
    surface: 'bg-[#1C1610]',
    card: 'bg-[#1E1812] border border-[#D9A76A]/25',
    border: 'border-[#D9A76A]/25',
    accentText: 'text-[#D9A76A]',
    accentBg: 'bg-[#D9A76A] text-[#171208] hover:bg-[#E8BE85]',
    accentSoftBg: 'bg-[#D9A76A]/8',
    accentBorder: 'border-[#D9A76A]/40',
    headingFont: 'font-playfair',
    bodyFont: 'font-inter',
    radius: 'rounded-2xl',
    eyebrow: 'text-[#D9A76A]/80',
    heroGradient: 'from-[#14100B] via-[#14100B]/60 to-[#14100B]/30',
    nav: 'bg-[#14100B]/95',
  },
};

export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}
