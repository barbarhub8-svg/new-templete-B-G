// =====================================================
// OBSIDIAN GOLD LUXURY — DATA NORMALISATION
// -----------------------------------------------------
// Reads ONLY the shop record / staff list / shop_media
// that the existing APIs already load. No demo data,
// no invented ratings, offers, reviews or statistics.
// Every section consumes the normalised shape below and
// hides itself when the corresponding real data is absent.
// =====================================================

export const OTHER_CATEGORY_KEY = '__other__';
export const OTHER_CATEGORY_LABEL = 'Other Services';

export interface OGService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  /** Display label of the category as stored in the database ('' when unset). */
  category: string;
  /** Stable key used for category filtering. */
  categoryKey: string;
  image: string;
  raw: any;
}

export interface OGCategory {
  key: string;
  name: string;
  count: number;
}

export interface OGStaff {
  id: string;
  name: string;
  role: string;
  photo: string;
  specializations: string[];
  experience: string;
  /** Only staff-owned work, never salon-wide gallery photos. */
  portfolioPhotos: string[];
  /** Public phone number, only when the salon has not hidden it. */
  phone: string;
  whatsappUrl: string;
  assignedServiceIds: string[];
  raw: any;
}

export interface OGVideo {
  id: string;
  url: string;
  kind: 'file' | 'youtube' | 'instagram' | 'facebook' | 'other';
  /** External watch URL for social platforms, empty for uploaded files. */
  watchUrl: string;
  /** Safe embed URL when one can be derived, otherwise empty. */
  embedUrl: string;
  thumbnail: string;
  title: string;
}

export interface OGOwner {
  name: string;
  photo: string;
  designation: string;
  experience: string;
  specialties: string[];
  bio: string;
}

export interface OGReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
  featured: boolean;
  raw: any;
}

export interface OGOffer {
  id: string;
  title: string;
  description: string;
  badge: string;
  code: string;
  validUntil: string;
  limited: boolean;
  /** Service names / ids the offer applies to, exactly as published. */
  services: string[];
  /** Only values explicitly stored on the offer record. */
  price: number;
  originalPrice: number;
  discountLabel: string;
}

export interface OGPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  validity: string;
  sessions: number;
  benefits: string[];
  includedServices: string[];
}

export interface OGBeforeAfter {
  id: string;
  before: string;
  after: string;
  title: string;
  description: string;
}

export interface OGAnnouncement {
  text: string;
  label: string;
  coupon: string;
  expiresAt: string;
  limited: boolean;
}

export interface OGSocial {
  label: string;
  href: string;
  kind: 'instagram' | 'facebook' | 'website' | 'youtube' | 'other';
}

export interface OGDay {
  day: string;
  label: string;
  closed: boolean;
}

export interface OGSiteData {
  shopId: string;
  name: string;
  category: string;
  tagline: string;
  introduction: string;
  logoUrl: string;
  ownerPhoto: string;
  owner: OGOwner;
  heroPhoto: string;
  aboutPhoto: string;
  bookingPhoto: string;
  photos: string[];
  video: string;
  videos: OGVideo[];
  services: OGService[];
  categories: OGCategory[];
  staff: OGStaff[];
  reviews: OGReview[];
  testimonials: OGReview[];
  offers: OGOffer[];
  packages: OGPackage[];
  beforeAfter: OGBeforeAfter[];
  announcement: OGAnnouncement | null;
  ratingValue: number;
  ratingCount: number;
  googleRating: number;
  googleReviewCount: number;
  yearsExperience: number;
  highlights: string[];
  specialties: string[];
  aboutText: string;
  aboutStory: string;
  hours: {
    opening: string;
    closing: string;
    weeklyOff: string;
    days: OGDay[];
  };
  contact: {
    phone: string;
    whatsapp: string;
    whatsappUrl: string;
    email: string;
    address: string;
    city: string;
    mapsUrl: string;
    socials: OGSocial[];
  };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function asArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  return [value];
}

export function asString(value: any): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

export function asNumber(value: any): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function firstString(obj: any, keys: string[]): string {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of keys) {
    const value = asString(obj[key]);
    if (value) return value;
  }
  return '';
}

function firstNumber(obj: any, keys: string[]): number {
  if (!obj || typeof obj !== 'object') return 0;
  for (const key of keys) {
    const value = asNumber(obj[key]);
    if (value) return value;
  }
  return 0;
}

function firstTruthy(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return undefined;
}

function extractImage(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    return firstString(value, ['media_url', 'url', 'image_url', 'image', 'photo', 'photo_url', 'src', 'avatar_url']);
  }
  return '';
}

function toLabelList(value: any): string[] {
  return asArray(value)
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'number') return String(item);
      if (item && typeof item === 'object') return firstString(item, ['label', 'title', 'name', 'text', 'value']);
      return '';
    })
    .filter(Boolean);
}

function timeLabel(value: string): string {
  if (!value) return '';
  const parts = value.split(':');
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return value;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isExpired(value: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function isBeforeAfterRecord(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  if (item.is_before_after === true || item.is_transformation === true) return true;
  const type = asString(item.media_type ?? item.type ?? item.kind).toLowerCase();
  if (['before', 'after', 'before_after', 'before-after', 'transformation'].includes(type)) return true;
  const text = `${asString(item.caption)} ${asString(item.title)} ${asString(item.category)}`.toLowerCase();
  return /\bbefore\b/.test(text) && /\bafter\b/.test(text);
}

// ── Video helpers ───────────────────────────────────────────────────────
export function youtubeId(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
  );
  return match ? match[1] : '';
}

/**
 * Classifies a media URL so social links are never loaded as native video
 * files and never rendered as blank/broken <video> elements.
 */
export function classifyVideo(raw: any): OGVideo | null {
  const url = extractImage(typeof raw === 'string' ? raw : raw?.media_url ?? raw?.url ?? raw?.video_url ?? raw);
  if (!url) return null;
  const id = asString(raw?.id) || `video-${url}`;
  const title = typeof raw === 'object' ? firstString(raw, ['caption', 'title', 'name', 'description']) : '';
  const thumbnail =
    typeof raw === 'object'
      ? firstString(raw, ['thumbnail_url', 'thumbnail', 'poster_url', 'poster', 'preview_image'])
      : '';

  const ytId = youtubeId(url);
  if (ytId) {
    return {
      id,
      url,
      kind: 'youtube',
      watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
      thumbnail: thumbnail || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      title,
    };
  }
  if (/instagram\.com|instagr\.am/i.test(url)) {
    return { id, url, kind: 'instagram', watchUrl: url, embedUrl: '', thumbnail, title };
  }
  if (/facebook\.com|fb\.watch|fb\.com/i.test(url)) {
    return { id, url, kind: 'facebook', watchUrl: url, embedUrl: '', thumbnail, title };
  }
  if (/vimeo\.com/i.test(url)) {
    const vimeoId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
    return {
      id,
      url,
      kind: 'other',
      watchUrl: url,
      embedUrl: vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : '',
      thumbnail,
      title,
    };
  }
  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(url) || /\/video\//i.test(url) || /^data:video\//i.test(url)) {
    return { id, url, kind: 'file', watchUrl: '', embedUrl: '', thumbnail, title };
  }
  if (/^https?:\/\//i.test(url)) {
    // Unknown external link — offered as an external "watch" action only.
    return { id, url, kind: 'other', watchUrl: url, embedUrl: '', thumbnail, title };
  }
  return { id, url, kind: 'file', watchUrl: '', embedUrl: '', thumbnail, title };
}

// ── Service filtering (shared by the public website + tests) ────────────
export function serviceMatchesQuery(service: OGService, query: string): boolean {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  return [service.name, service.category, service.description]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(term));
}

export function serviceMatchesCategory(service: OGService, categoryKey: string): boolean {
  if (!categoryKey || categoryKey === 'all') return true;
  return service.categoryKey === categoryKey;
}

export function filterServices(services: OGService[], categoryKey = 'all', query = ''): OGService[] {
  return services.filter(
    (service) => serviceMatchesCategory(service, categoryKey) && serviceMatchesQuery(service, query)
  );
}

export function buildObsidianGoldData(shop: any, staffList: any[] = []): OGSiteData {
  const record = shop && typeof shop === 'object' ? shop : {};
  const shopId = asString(record.id ?? record.shop_id) || 'preview';
  const name = asString(record.name ?? record.shop_name ?? record.business_name) || 'Salon';

  // ── Media ────────────────────────────────────────────────────────────
  const rawMedia: any[] = [
    ...asArray(record.shop_media),
    ...asArray(record.media),
    ...asArray(record.photos).map((url, i) => ({
      id: `photo-${i}`,
      media_type: 'photo',
      media_url: typeof url === 'string' ? url : extractImage(url),
      display_order: i + 1,
    })),
  ].filter((item) => extractImage(item.media_url ?? item.url ?? item));

  const media = rawMedia
    .map((item, i) => {
      const url = extractImage(item.media_url ?? item.url ?? item) || (typeof item === 'string' ? item : '');
      const type = typeof item === 'object' ? asString(item.media_type ?? item.type).toLowerCase() : 'photo';
      return {
        id: asString(item?.id) || `media-${i}`,
        url,
        type,
        caption: typeof item === 'object' ? firstString(item, ['caption', 'title', 'description', 'label']) : '',
        order: typeof item === 'object' ? asNumber(item.display_order ?? item.order ?? item.sort_order) : i,
        raw: item,
      };
    })
    .filter((item) => Boolean(item.url))
    .sort((a, b) => a.order - b.order);

  const logoMedia = media.find((m) => ['logo', 'brand_logo'].includes(m.type));
  const logoUrl =
    firstString(record, ['logo_url', 'brand_logo_url', 'brand_logo', 'logo']) || logoMedia?.url || '';
  const ownerPhotoMedia = media.find((m) => ['owner_photo', 'owner', 'owner_image', 'owner_portrait'].includes(m.type));
  const ownerPhoto =
    firstString(record, ['owner_photo_url', 'owner_image_url', 'owner_photo', 'owner_image', 'owner_avatar_url']) ||
    ownerPhotoMedia?.url ||
    '';

  const beforeAfterMedia = media.filter((m) => isBeforeAfterRecord(m.raw) || isBeforeAfterRecord(m));
  const seenPhotos = new Set<string>();
  const photos = media
    .filter(
      (m) =>
        (m.type === 'photo' || m.type === 'portfolio' || m.type === 'gallery' || m.type === '') &&
        !beforeAfterMedia.includes(m) &&
        m.url !== logoUrl &&
        m.url !== ownerPhoto
    )
    .filter((m) => {
      const ownerMediaUrl = asString(m.raw?.media_url ?? m.url);
      if (ownerMediaUrl && ownerMediaUrl === ownerPhoto) return false;
      if (seenPhotos.has(m.url)) return false;
      seenPhotos.add(m.url);
      return true;
    })
    .map((m) => m.url);
  const videoMedia = media.filter((m) => ['video', 'reel', 'film', 'youtube'].includes(m.type));
  const rawVideoRecords: any[] = [
    ...videoMedia.map((m) => ({ ...(typeof m.raw === 'object' ? m.raw : {}), id: m.id, media_url: m.url, caption: m.caption })),
    ...asArray(firstTruthy(record, ['videos', 'shop_videos', 'video_urls', 'video_links'])),
  ];
  const singleVideoUrl = firstString(record, ['video_url', 'shop_video', 'promo_video_url']);
  if (singleVideoUrl) rawVideoRecords.push(singleVideoUrl);
  const seenVideos = new Set<string>();
  const videos: OGVideo[] = [];
  rawVideoRecords.forEach((item) => {
    const classified = classifyVideo(item);
    if (!classified) return;
    if (seenVideos.has(classified.url)) return;
    seenVideos.add(classified.url);
    videos.push(classified);
  });
  const video = videos[0]?.url || '';

  const heroPhoto =
    firstString(record, ['hero_image_url', 'hero_image', 'cover_image_url', 'cover_photo']) || photos[0] || '';
  const aboutPhoto = photos[1] || photos[0] || '';
  const bookingPhoto = photos[2] || photos[0] || '';

  // ── Services ─────────────────────────────────────────────────────────
  const serviceImageBySvcId = new Map<string, string>();
  media.forEach((m) => {
    const sid = asString(m.raw?.service_id ?? m.raw?.related_service_id);
    if (sid && m.url) serviceImageBySvcId.set(sid, m.url);
  });

  const seenServices = new Set<string>();
  const services: OGService[] = asArray(record.services)
    .map((svc: any, i: number) => {
      const id = asString(svc?.id ?? svc?.service_id) || `${asString(svc?.name) || 'service'}-${i}`;
      const price = firstNumber(svc, ['price', 'cost', 'amount', 'rate']);
      const duration = firstNumber(svc, [
        'duration_minutes',
        'duration',
        'duration_min',
        'time_minutes',
      ]);
      const category = asString(svc?.category ?? svc?.service_category ?? svc?.type);
      return {
        id,
        name: asString(svc?.name ?? svc?.service_name ?? svc?.title) || 'Service',
        description: firstString(svc, ['description', 'details', 'short_description', 'about']),
        price,
        duration,
        category,
        categoryKey: category || OTHER_CATEGORY_KEY,
        image:
          firstString(svc, ['image_url', 'image', 'photo_url', 'photo', 'media_url', 'cover_image']) ||
          extractImage(svc?.images) ||
          serviceImageBySvcId.get(id) ||
          '',
        raw: svc,
      } satisfies OGService;
    })
    .filter((svc) => {
      if (svc.raw?.is_active === false || svc.raw?.active === false) return false;
      const key = svc.id;
      if (seenServices.has(key)) return false;
      seenServices.add(key);
      return true;
    });

  const categoryCounts = new Map<string, { name: string; count: number }>();
  services.forEach((svc) => {
    const entry = categoryCounts.get(svc.categoryKey) || { name: svc.category || OTHER_CATEGORY_LABEL, count: 0 };
    entry.count += 1;
    categoryCounts.set(svc.categoryKey, entry);
  });
  const categories: OGCategory[] = Array.from(categoryCounts.entries()).map(([key, entry]) => ({
    key,
    name: entry.name,
    count: entry.count,
  }));

  // ── Team ─────────────────────────────────────────────────────────────
  const staff: OGStaff[] = asArray(staffList)
    .filter((member: any) => member?.is_active !== false)
    .map((member: any, i: number) => {
      const experienceValue = firstNumber(member, [
        'years_of_experience',
        'experience_years',
        'experience',
        'years_experience',
      ]);
      const portfolio = Array.from(
        new Set(
          [
            ...asArray(member?.portfolio_photos),
            ...asArray(member?.portfolio),
            ...asArray(member?.gallery_photos),
            ...asArray(member?.work_photos),
          ]
            .map((item) => extractImage(item))
            .filter(Boolean)
        )
      );
      const phoneVisible = member?.hide_mobile_from_public !== true;
      const staffPhone = phoneVisible
        ? firstString(member, ['mobile_number', 'phone', 'contact_number', 'whatsapp_number'])
        : '';
      const staffDigits = staffPhone.replace(/\D/g, '');
      const staffWa =
        phoneVisible && staffDigits
          ? `https://wa.me/${staffDigits.length > 10 ? staffDigits : staffDigits.length === 10 ? `91${staffDigits}` : staffDigits}`
          : '';
      return {
        id: asString(member?.id) || `staff-${i}`,
        name: asString(member?.full_name ?? member?.name ?? member?.staff_name) || 'Specialist',
        role: asString(member?.primary_role ?? member?.role ?? member?.designation),
        photo: firstString(member, ['avatar_url', 'profile_photo_url', 'photo_url', 'photo', 'image_url']),
        specializations: toLabelList(member?.specializations ?? member?.specialities ?? member?.skills),
        experience: experienceValue > 0 ? `${experienceValue}+ years` : asString(member?.experience_text),
        portfolioPhotos: portfolio,
        phone: staffPhone,
        whatsappUrl: staffWa,
        assignedServiceIds: asArray(member?.assigned_service_ids ?? member?.assigned_services)
          .map((value) => asString(value))
          .filter(Boolean),
        raw: member,
      } satisfies OGStaff;
    });

  // ── Reviews & testimonials ───────────────────────────────────────────
  const reviews: OGReview[] = asArray(record.reviews ?? record.shop_reviews ?? record.customer_reviews)
    .map((item: any, i: number) => ({
      id: asString(item?.id) || `review-${i}`,
      name: asString(item?.customer_name ?? item?.name ?? item?.author) || 'Guest',
      rating: firstNumber(item, ['rating', 'stars', 'score']),
      comment: firstString(item, ['comment', 'review', 'text', 'message', 'description']),
      date: asString(item?.created_at ?? item?.date ?? item?.review_date),
      service: firstString(item, ['service_name', 'service']),
      featured: item?.is_featured === true || item?.featured === true || item?.is_testimonial === true,
      raw: item,
    }))
    .filter((item) => item.name || item.comment || item.rating > 0);

  const explicitTestimonials: OGReview[] = asArray(
    record.testimonials ?? record.customer_testimonials ?? record.client_testimonials ?? record.featured_reviews
  ).map((item: any, i: number) => ({
    id: asString(item?.id) || `testimonial-${i}`,
    name: asString(item?.customer_name ?? item?.name ?? item?.author) || 'Guest',
    rating: firstNumber(item, ['rating', 'stars']),
    comment: firstString(item, ['comment', 'quote', 'text', 'message', 'testimonial']),
    date: asString(item?.created_at ?? item?.date),
    service: firstString(item, ['service_name', 'service']),
    featured: true,
    raw: item,
  }));

  const reviewBasedTestimonials = reviews
    .filter((review) => asString(review.comment).length > 0)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 3);
  const testimonials = explicitTestimonials.length > 0 ? explicitTestimonials : reviewBasedTestimonials;

  // ── Offers ───────────────────────────────────────────────────────────
  const offers: OGOffer[] = asArray(
    firstTruthy(record, ['offers', 'shop_offers', 'exclusive_offers', 'promotions', 'deals'])
  )
    .filter((item: any) => !item || typeof item !== 'object' || (item.is_active !== false && item.active !== false))
    .map((item: any, i: number) => {
      if (typeof item === 'string') {
        return {
          id: `offer-${i}`,
          title: item,
          description: '',
          badge: '',
          code: '',
          validUntil: '',
          limited: false,
          services: [],
          price: 0,
          originalPrice: 0,
          discountLabel: '',
        } satisfies OGOffer;
      }
      const validUntil = firstString(item, ['valid_until', 'valid_till', 'expires_at', 'end_date', 'expiry', 'valid_upto']);
      const price = firstNumber(item, ['offer_price', 'discounted_price', 'sale_price', 'special_price', 'price']);
      const originalPrice = firstNumber(item, ['original_price', 'regular_price', 'mrp', 'list_price']);
      const discountPercent = firstNumber(item, ['discount_percent', 'discount_percentage', 'percent_off']);
      const discountValue = firstNumber(item, ['discount_value', 'discount_amount', 'flat_discount']);
      return {
        id: asString(item?.id ?? item?.code) || `offer-${i}`,
        title: firstString(item, ['title', 'name', 'offer_title', 'heading']),
        description: firstString(item, ['description', 'desc', 'details', 'terms', 'subtitle']),
        badge: firstString(item, ['badge', 'tag', 'label', 'discount', 'discount_text', 'offer_tag']),
        code: firstString(item, ['code', 'coupon_code', 'promo_code', 'coupon']),
        validUntil,
        limited: Boolean(item?.is_limited_time || item?.limited_time || validUntil),
        services: toLabelList(
          firstTruthy(item, [
            'applicable_services',
            'services',
            'service_names',
            'applicable_service_ids',
            'service_id',
            'service',
          ])
        ),
        price,
        originalPrice,
        discountLabel:
          firstString(item, ['discount_text', 'discount_label', 'offer_text']) ||
          (discountPercent > 0
            ? `${discountPercent}% off`
            : discountValue > 0
              ? `₹${discountValue} off`
              : ''),
      } satisfies OGOffer;
    })
    .filter((offer) => !isExpired(offer.validUntil))
    .filter((offer) => offer.title || offer.description || offer.badge || offer.code);

  // ── Membership / packages ────────────────────────────────────────────
  const packages: OGPackage[] = asArray(
    firstTruthy(record, ['memberships', 'membership_plans', 'membership_packages', 'packages', 'shop_packages', 'service_packages'])
  )
    .filter((item: any) => !item || typeof item !== 'object' || (item.is_active !== false && item.active !== false))
    .map((item: any, i: number) => {
      if (typeof item === 'string') {
        return {
          id: `package-${i}`,
          name: item,
          description: '',
          price: 0,
          period: '',
          validity: '',
          sessions: 0,
          benefits: [],
          includedServices: [],
        } satisfies OGPackage;
      }
      const period = firstString(item, ['period', 'billing_period']);
      const validity = firstString(item, ['validity', 'valid_for', 'validity_period', 'duration', 'duration_text']);
      const price = firstNumber(item, ['price', 'amount', 'fee', 'cost']);
      const sessions = firstNumber(item, ['sessions', 'sessions_included', 'total_sessions', 'visits', 'session_count']);
      const benefits = toLabelList(firstTruthy(item, ['benefits', 'features', 'perks', 'includes', 'inclusions']));
      const includedServices = toLabelList(
        firstTruthy(item, ['included_services', 'services', 'service_names', 'applicable_services', 'treatments'])
      );
      return {
        id: asString(item?.id ?? item?.name) || `package-${i}`,
        name: firstString(item, ['name', 'title', 'package_name', 'plan_name']),
        description: firstString(item, ['description', 'desc', 'details', 'subtitle']),
        price,
        period,
        validity,
        sessions,
        benefits,
        includedServices,
      } satisfies OGPackage;
    })
    .filter((pkg) => pkg.name || pkg.description || pkg.price > 0);

  // ── Before & after ───────────────────────────────────────────────────
  const beforeAfter: OGBeforeAfter[] = [];
  asArray(
    firstTruthy(record, ['before_after', 'before_after_media', 'transformations', 'transformation_media'])
  ).forEach((item: any, i: number) => {
    if (!item || typeof item !== 'object') return;
    const images = asArray(item.images);
    const before = extractImage(firstTruthy(item, ['before_url', 'before_image', 'before_image_url', 'before_photo', 'before'])) || extractImage(images[0]);
    const after = extractImage(firstTruthy(item, ['after_url', 'after_image', 'after_image_url', 'after_photo', 'after'])) || extractImage(images[1]);
    if (!before || !after) return;
    beforeAfter.push({
      id: asString(item.id ?? item.pair_id) || `pair-${i}`,
      before,
      after,
      title: firstString(item, ['title', 'name', 'service_name', 'caption']),
      description: firstString(item, ['description', 'details', 'note']),
    });
  });

  // Group shop_media records explicitly tagged as before / after.
  const groups = new Map<string, { before: string; after: string; title: string }>();
  beforeAfterMedia.forEach((m, i) => {
    const raw = m.raw || {};
    const type = asString(raw.media_type ?? raw.type).toLowerCase();
    const text = `${m.caption} ${asString(raw.title)} ${asString(raw.label)}`.toLowerCase();
    const side: 'before' | 'after' | '' =
      type === 'before' || /\bbefore\b/.test(text) ? 'before' : type === 'after' || /\bafter\b/.test(text) ? 'after' : '';
    if (!side) return;
    const key = asString(raw.pair_id ?? raw.group_id ?? raw.transformation_id) || `group-${Math.floor(i / 2)}`;
    const entry = groups.get(key) || { before: '', after: '', title: '' };
    if (!entry[side]) entry[side] = m.url;
    if (!entry.title) entry.title = asString(raw.caption ?? raw.title ?? raw.service_name);
    groups.set(key, entry);
  });
  groups.forEach((group, key) => {
    if (!group.before || !group.after) return;
    if (beforeAfter.some((pair) => pair.before === group.before && pair.after === group.after)) return;
    beforeAfter.push({
      id: `media-${key}`,
      before: group.before,
      after: group.after,
      title: group.title,
      description: '',
    });
  });

  // ── Announcement ─────────────────────────────────────────────────────
  let announcement: OGAnnouncement | null = null;
  const rawAnnouncement = firstTruthy(record, ['announcement', 'announcement_bar', 'promo_announcement']);
  const expiresAt = firstString(record, ['announcement_expires_at', 'announcement_end_date', 'announcement_valid_until']);
  const limited = Boolean(record?.announcement_is_limited || record?.is_limited_time_offer || expiresAt);
  if (typeof rawAnnouncement === 'string' && rawAnnouncement.trim()) {
    announcement = {
      text: rawAnnouncement.trim(),
      label: limited ? 'Limited time' : 'Announcement',
      coupon: firstString(record, ['announcement_coupon', 'coupon_code', 'promo_code', 'announcement_code']),
      expiresAt,
      limited,
    };
  } else if (rawAnnouncement && typeof rawAnnouncement === 'object' && rawAnnouncement.is_active !== false) {
    const text = firstString(rawAnnouncement, ['text', 'message', 'title', 'description']);
    if (text) {
      const ownExpiry = firstString(rawAnnouncement, ['expires_at', 'valid_until', 'end_date']);
      announcement = {
        text,
        label: firstString(rawAnnouncement, ['label', 'badge']) || (limited || ownExpiry ? 'Limited time' : 'Announcement'),
        coupon: firstString(rawAnnouncement, ['coupon', 'code', 'coupon_code', 'promo_code']),
        expiresAt: ownExpiry || expiresAt,
        limited: Boolean(rawAnnouncement.is_limited_time || rawAnnouncement.limited_time || ownExpiry || limited),
      };
    }
  } else {
    const text = firstString(record, [
      'announcement_text',
      'announcement_message',
      'promo_text',
      'promotional_text',
      'top_bar_text',
      'banner_text',
      'offer_announcement',
    ]);
    if (text) {
      announcement = {
        text,
        label: limited ? 'Limited time' : 'Announcement',
        coupon: firstString(record, ['announcement_coupon', 'coupon_code', 'promo_code', 'announcement_code']),
        expiresAt,
        limited,
      };
    }
  }
  if (announcement && isExpired(announcement.expiresAt)) announcement = null;

  // ── Ratings / trust data (only explicitly stored values) ─────────────
  const googleRating = firstNumber(record, ['google_rating', 'google_review_rating', 'google_reviews_rating']) ||
    firstNumber(record.google, ['rating']);
  const googleReviewCount = firstNumber(record, ['google_reviews_count', 'google_review_count']) ||
    firstNumber(record.google, ['review_count', 'reviews_count']);
  const storedRating = firstNumber(record, ['average_rating', 'rating', 'client_rating']);
  const computedRating = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.filter((r) => r.rating > 0).length
    : 0;
  const ratingValue = storedRating > 0 ? storedRating : Number.isFinite(computedRating) ? computedRating : 0;
  const ratingCount = firstNumber(record, ['total_reviews', 'reviews_count', 'review_count']) || reviews.length;
  const yearsExperience = firstNumber(record, ['years_of_experience', 'years_in_business', 'experience_years']);

  // ── About / highlights ───────────────────────────────────────────────
  const aboutText = firstString(record, [
    'about_description',
    'description',
    'about',
    'about_us',
    'about_text',
    'salon_description',
  ]);
  const aboutStory = firstString(record, ['our_story', 'story', 'salon_story', 'history']);
  const specialties = toLabelList(
    firstTruthy(record, ['specialities', 'specialties', 'specializations', 'speciality', 'expertise'])
  );
  const highlights = toLabelList(
    firstTruthy(record, ['business_highlights', 'highlights', 'key_highlights', 'features', 'usp', 'tags'])
  ).slice(0, 6);
  if (record.home_service_available === true) {
    const radius = firstNumber(record, ['service_radius_km', 'service_radius']);
    highlights.unshift(radius > 0 ? `Home service within ${radius} km` : 'Home service available');
  }
  const uniqueHighlights = Array.from(new Set(highlights)).slice(0, 6);

  // ── Owner introduction (only explicitly stored owner fields) ─────────
  const ownerRecord = record.owner && typeof record.owner === 'object' ? record.owner : null;
  const ownerName =
    firstString(record, ['owner_name', 'owner_full_name', 'proprietor_name', 'founder_name']) ||
    firstString(ownerRecord, ['name', 'full_name']);
  const ownerDesignation =
    firstString(record, ['owner_designation', 'owner_title', 'owner_role', 'proprietor_title']) ||
    firstString(ownerRecord, ['designation', 'title', 'role']);
  const ownerExperienceYears =
    firstNumber(record, ['owner_experience_years', 'owner_years_of_experience', 'owner_experience']) ||
    firstNumber(ownerRecord, ['years_of_experience', 'experience_years', 'experience']);
  const ownerBio =
    firstString(record, ['owner_bio', 'owner_about', 'owner_description', 'about_owner']) ||
    firstString(ownerRecord, ['bio', 'about', 'description']);
  const owner: OGOwner = {
    name: ownerName,
    photo:
      firstString(record, ['owner_photo_url', 'owner_image_url', 'owner_photo', 'owner_image']) ||
      firstString(ownerRecord, ['photo_url', 'avatar_url', 'photo', 'image']) ||
      ownerPhoto,
    designation: ownerDesignation,
    experience: ownerExperienceYears > 0 ? `${ownerExperienceYears}+ years` : '',
    specialties: toLabelList(
      firstTruthy(record, ['owner_specialities', 'owner_specialties', 'owner_expertise']) ??
        firstTruthy(ownerRecord, ['specializations', 'specialities', 'expertise'])
    ),
    bio: ownerBio,
  };
  const hasOwner = Boolean(owner.name || owner.photo || owner.bio || owner.designation);

  // ── Hours ────────────────────────────────────────────────────────────
  const opening = timeLabel(firstString(record, ['opening_time', 'open_time', 'start_time']).slice(0, 5));
  const closing = timeLabel(firstString(record, ['closing_time', 'close_time', 'end_time']).slice(0, 5));
  const rawWeeklyOff = firstTruthy(record, ['weekly_off', 'weekly_off_day', 'closed_day', 'closed_days']);
  const offLabels = toLabelList(rawWeeklyOff);
  const weeklyOff = offLabels.length ? offLabels.join(', ') : '';
  const offSet = new Set(offLabels.flatMap((d) => d.split(/[,/&]| and /i).map((v) => v.trim().toLowerCase())));
  const perDay = firstTruthy(record, ['opening_hours', 'weekly_hours', 'business_hours']);
  let days: OGDay[] = [];
  if (Array.isArray(perDay)) {
    days = perDay.map((entry: any) => {
      const day = firstString(entry, ['day', 'name', 'weekday']);
      const closed = entry?.is_closed === true || entry?.is_working === false || entry?.closed === true;
      const open = timeLabel(firstString(entry, ['open', 'opening_time', 'start_time', 'start']).slice(0, 5));
      const close = timeLabel(firstString(entry, ['close', 'closing_time', 'end_time', 'end']).slice(0, 5));
      return { day, label: closed ? 'Closed' : open && close ? `${open} – ${close}` : opening && closing ? `${opening} – ${closing}` : '', closed };
    });
  } else {
    days = DAYS.map((day) => ({
      day,
      label: offSet.has(day.toLowerCase()) ? 'Closed' : opening && closing ? `${opening} – ${closing}` : '',
      closed: offSet.has(day.toLowerCase()),
    }));
  }

  // ── Contact ──────────────────────────────────────────────────────────
  const phone = firstString(record, ['contact_number', 'contact_phone', 'phone', 'phone_number', 'mobile_number', 'mobile']);
  const whatsapp = firstString(record, ['whatsapp_number', 'whatsapp', 'whatsapp_phone']);
  const whatsappRaw = firstString(record, ['whatsapp_url']);
  const waSource = whatsapp || phone;
  const waDigits = waSource.replace(/\D/g, '');
  const waNumber = waDigits.length > 10 ? waDigits : waDigits.length === 10 ? `91${waDigits}` : '';
  const whatsappUrl = whatsappRaw || (waNumber ? `https://wa.me/${waNumber}` : '');
  const address = firstString(record, ['address', 'street_address', 'shop_address']);
  const city = firstString(record, ['city', 'town', 'locality']);
  const lat = firstNumber(record, ['latitude', 'lat']);
  const lng = firstNumber(record, ['longitude', 'lng', 'lon']);
  const destination = lat && lng ? `${lat},${lng}` : `${address}${city ? `, ${city}` : ''}`;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  const email = firstString(record, ['contact_email', 'email', 'business_email']);

  const socials: OGSocial[] = [];
  const addSocial = (label: string, href: string, fallback: string, kind: OGSocial['kind']) => {
    if (!href && !fallback) return;
    const url = href || fallback;
    const safeUrl = /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^@/, '')}`;
    socials.push({ label, href: safeUrl, kind });
  };
  addSocial(
    'Instagram',
    firstString(record, ['instagram_url', 'instagram_link']),
    firstString(record, ['instagram_handle', 'instagram'])
      ? `https://instagram.com/${firstString(record, ['instagram_handle', 'instagram']).replace(/^@/, '')}`
      : '',
    'instagram'
  );
  addSocial(
    'Facebook',
    firstString(record, ['facebook_url', 'facebook_link']),
    firstString(record, ['facebook_handle', 'facebook'])
      ? `https://facebook.com/${firstString(record, ['facebook_handle', 'facebook']).replace(/^@/, '')}`
      : '',
    'facebook'
  );
  addSocial('Website', firstString(record, ['website_url', 'website', 'web_url']), '', 'website');
  addSocial('YouTube', firstString(record, ['youtube_url', 'youtube']), '', 'youtube');
  addSocial('Pinterest', firstString(record, ['pinterest_url', 'pinterest']), '', 'other');

  return {
    shopId,
    name,
    category: asString(record.category ?? record.business_category ?? record.shop_category),
    tagline: firstString(record, ['tagline', 'slogan', 'subtitle']),
    introduction: aboutText,
    logoUrl,
    ownerPhoto: hasOwner ? owner.photo : '',
    owner: hasOwner ? owner : { name: '', photo: '', designation: '', experience: '', specialties: [], bio: '' },
    heroPhoto,
    aboutPhoto,
    bookingPhoto,
    photos,
    video,
    videos,
    services,
    categories,
    staff,
    reviews,
    testimonials,
    offers,
    packages,
    beforeAfter,
    announcement,
    ratingValue: ratingValue > 0 && ratingValue <= 5 ? ratingValue : 0,
    ratingCount,
    googleRating,
    googleReviewCount,
    yearsExperience,
    highlights: uniqueHighlights,
    specialties,
    aboutText,
    aboutStory: aboutStory && aboutStory !== aboutText ? aboutStory : '',
    hours: { opening, closing, weeklyOff, days },
    contact: { phone, whatsapp, whatsappUrl, email, address, city, mapsUrl, socials },
  };
}

export function formatPrice(value: number): string {
  return `₹${Math.round(asNumber(value)).toLocaleString('en-IN')}`;
}

export function formatReviewDate(value: string): string {
  return formatDate(value);
}
