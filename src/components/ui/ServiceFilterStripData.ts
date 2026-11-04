export interface ServiceChip {
  id: string;
  label: string;
  query: string;
  emoji: string;
  count: string;
  popular?: boolean;
  isPrimary?: boolean;
  badge?: string;
}

export const SERVICE_CHIPS: ServiceChip[] = [
  {
    id: 'all',
    label: 'All Services',
    query: '',
    emoji: '✨',
    count: '60+ Salons',
  },
  {
    id: 'nail-art-studio',
    label: 'Nails Art Studio',
    query: 'Nail',
    emoji: '💅',
    count: '18+ Studios',
    popular: true,
    isPrimary: true,
    badge: 'Popular',
  },
  {
    id: 'haircut',
    label: 'Haircut & Styling',
    query: 'Haircut',
    emoji: '✂️',
    count: '45+ Salons',
    popular: true,
  },
  {
    id: 'beard',
    label: 'Beard Grooming',
    query: 'Beard',
    emoji: '🧔',
    count: '38+ Salons',
  },
  {
    id: 'hair-spa',
    label: 'Hair Spa & Therapy',
    query: 'Hair Spa',
    emoji: '💆',
    count: '28+ Salons',
    popular: true,
  },
  {
    id: 'facial',
    label: 'Facial & Glow',
    query: 'Facial',
    emoji: '🧴',
    count: '32+ Salons',
  },
  {
    id: 'hair-color',
    label: 'Hair Color & Highlights',
    query: 'Color',
    emoji: '🎨',
    count: '24+ Salons',
  },
  {
    id: 'skin-fade',
    label: 'Skin Fade & Taper',
    query: 'Skin Fade',
    emoji: '💈',
    count: '22+ Salons',
  },
  {
    id: 'massage',
    label: 'Massage & Wellness',
    query: 'Massage',
    emoji: '🔥',
    count: '18+ Spas',
  },
  {
    id: 'bridal',
    label: 'Bridal & Groom',
    query: 'Bridal',
    emoji: '💍',
    count: '14+ Salons',
  },
];
