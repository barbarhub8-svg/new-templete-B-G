// Helper utility to track and manage recently viewed salons in localStorage

export interface RecentlyViewedSalon {
  id: string;
  name: string;
  tagline?: string;
  photo?: string;
  rating?: number;
  totalReviews?: number;
  city?: string;
  address?: string;
  tags?: string[];
  homeService?: boolean;
  category?: string;
  viewedAt: number;
}

const STORAGE_KEY = 'nexora_recently_viewed_salons';
const MAX_STORED = 10;
export const MAX_DISPLAYED = 3;

// Default initial seeds so the UI is immediately populated and tangible on first launch
export const DEFAULT_RECENT_SALONS: RecentlyViewedSalon[] = [
  {
    id: 'nail-studio-1',
    name: 'Nail & Co. Luxe Art Studio',
    tagline: 'High-end Russian manicure, 3D gel nail sculpts, and chrome finishes.',
    photo: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&h=600&fit=crop&q=90',
    rating: 5.0,
    totalReviews: 290,
    city: 'Jaipur',
    address: 'C-Scheme, Ashok Nagar, Jaipur',
    tags: ['Nails Art Studio', 'Gel Extensions', 'Russian Manicure', 'Chrome Finish'],
    homeService: false,
    category: 'Nails Art Studio',
    viewedAt: Date.now() - 1000 * 60 * 12, // 12 mins ago
  },
  {
    id: 'dummy-jp-1',
    name: 'The Royal Jiva Spa & Salon',
    tagline: 'Palatial Ayurvedic therapies, royal bridal grooming, and timeless luxury.',
    photo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&h=600&fit=crop&q=90',
    rating: 5.0,
    totalReviews: 420,
    city: 'Jaipur',
    address: 'Rambagh Palace Grounds, Jaipur',
    tags: ['Palatial Spa', 'Gold Facial', 'Ayurveda', 'Luxury'],
    homeService: true,
    category: 'Spa',
    viewedAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
  },
  {
    id: 'dummy-1',
    name: 'The Royal Barberia',
    tagline: 'Luxury grooming with modern fades and classic precision styling.',
    photo: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=900&h=600&fit=crop&q=90',
    rating: 4.9,
    totalReviews: 312,
    city: 'Mumbai',
    address: 'Bhilwara, Rajasthan',
    tags: ['In-Shop', 'Skin Fade', 'Beard Styling', 'Premium'],
    homeService: false,
    category: 'Barbershop',
    viewedAt: Date.now() - 1000 * 60 * 120, // 2 hours ago
  },
];

/**
 * Get the list of recently viewed salons (max 3 by default)
 */
export function getRecentlyViewedSalons(limit: number = MAX_DISPLAYED): RecentlyViewedSalon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial salons so the carousel is active immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECENT_SALONS));
      return DEFAULT_RECENT_SALONS.slice(0, limit);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, limit);
    }
    return [];
  } catch (err) {
    console.error('Failed to parse recently viewed salons', err);
    return [];
  }
}

/**
 * Record a salon visit into localStorage.
 * Removes any previous entry with the same ID and puts the current salon at the top.
 */
export function recordSalonVisit(salon: {
  id: string;
  name: string;
  tagline?: string;
  photo?: string;
  photos?: string[];
  rating?: number;
  average_rating?: number;
  totalReviews?: number;
  total_reviews?: number;
  city?: string;
  address?: string;
  tags?: string[];
  homeService?: boolean;
  home_service_available?: boolean;
  category?: string;
}): void {
  if (!salon || !salon.id) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: RecentlyViewedSalon[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        list = [];
      }
    } else {
      list = [...DEFAULT_RECENT_SALONS];
    }

    // Filter out previous visit of the same salon
    list = list.filter((item) => String(item.id) !== String(salon.id));

    // Construct unified entry
    const entry: RecentlyViewedSalon = {
      id: String(salon.id),
      name: salon.name,
      tagline: salon.tagline || '',
      photo: salon.photo || (salon.photos && salon.photos[0]) || '',
      rating: Number(salon.rating ?? salon.average_rating ?? 4.8),
      totalReviews: Number(salon.totalReviews ?? salon.total_reviews ?? 50),
      city: salon.city || 'Jaipur',
      address: salon.address || salon.city || '',
      tags: Array.isArray(salon.tags) ? salon.tags.slice(0, 3) : [],
      homeService: !!(salon.homeService ?? salon.home_service_available),
      category: salon.category || '',
      viewedAt: Date.now(),
    };

    // Prepend to top
    list.unshift(entry);

    // Keep up to MAX_STORED in storage
    const trimmed = list.slice(0, MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

    // Dispatch custom event for real-time reactive sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recently_viewed_updated', { detail: trimmed.slice(0, MAX_DISPLAYED) }));
    }
  } catch (err) {
    console.error('Failed to record recently viewed salon', err);
  }
}

/**
 * Clear the recently viewed history
 */
export function clearRecentlyViewedSalons(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recently_viewed_updated', { detail: [] }));
    }
  } catch (err) {
    console.error('Failed to clear recently viewed salons', err);
  }
}

/**
 * Reset recently viewed history with the default set
 */
export function restoreDefaultRecentlyViewed(): RecentlyViewedSalon[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECENT_SALONS));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('recently_viewed_updated', { detail: DEFAULT_RECENT_SALONS.slice(0, MAX_DISPLAYED) }));
    }
    return DEFAULT_RECENT_SALONS.slice(0, MAX_DISPLAYED);
  } catch (err) {
    console.error('Failed to restore default recently viewed', err);
    return [];
  }
}
