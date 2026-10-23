// =====================================================
// IN-MEMORY / LOCALSTORAGE MOCK DATABASE FOR AI STUDIO
// =====================================================

import { mockShops, mockBookings, mockWallet } from './mockData';

const STORAGE_KEY_PREFIX = 'nexora_mock_';

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('Failed to persist mock storage:', err);
  }
}

// Convert mockShops to DB shops, services, and media format
function initializeSeedData() {
  const seedShops: any[] = [];
  const seedServices: any[] = [];
  const seedMedia: any[] = [];
  const seedReviews: any[] = [];

  // Seed standard mock shops
  mockShops.forEach((shop, index) => {
    const dbShop = {
      id: shop.id,
      owner_id: shop.ownerId,
      name: shop.name,
      tagline: `Premium grooming and styling by ${shop.ownerName}`,
      address: shop.address,
      city: shop.city,
      latitude: shop.location?.lat || 19.076,
      longitude: shop.location?.lng || 72.8777,
      opening_time: shop.workingHours?.start || '09:00',
      closing_time: shop.workingHours?.end || '21:00',
      weekly_off: shop.weeklyOff || 'Monday',
      home_service_available: shop.homeServiceAvailable,
      home_service_charge: shop.homeServiceCharge || 0,
      service_radius_km: shop.serviceRadius || 5,
      status: shop.status || 'approved',
      rejection_reason: null,
      total_bookings: shop.totalBookings || 120,
      pending_bookings: shop.pendingBookings || 2,
      average_rating: shop.rating || 4.7,
      total_reviews: shop.totalReviews || 45,
      created_at: new Date(Date.now() - (index + 1) * 86400000 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    };
    seedShops.push(dbShop);

    // Services
    (shop.services || []).forEach((svc, sIdx) => {
      seedServices.push({
        id: svc.id ? `${shop.id}-${svc.id}` : `svc-${shop.id}-${sIdx}`,
        shop_id: shop.id,
        name: svc.name,
        price: svc.price,
        duration_minutes: svc.duration,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    // Media
    (shop.photos || []).forEach((photoUrl, pIdx) => {
      seedMedia.push({
        id: `media-${shop.id}-${pIdx}`,
        shop_id: shop.id,
        media_type: 'photo',
        media_url: photoUrl,
        display_order: pIdx,
        created_at: new Date().toISOString(),
      });
    });

    // Reviews
    (shop.reviews || []).forEach((rev, rIdx) => {
      seedReviews.push({
        id: rev.id || `rev-${shop.id}-${rIdx}`,
        shop_id: shop.id,
        booking_id: rev.bookingId || `b-${shop.id}-${rIdx}`,
        customer_name: rev.customerName,
        rating: rev.rating,
        comment: rev.comment,
        created_at: new Date(Date.now() - (rIdx + 1) * 86400000 * 3).toISOString(),
      });
    });
  });

  // Also include dummy-1 through dummy-6 for direct compatibility with HomePage / SalonListingPage cards
  const dummyList = [
    {
      id: 'dummy-1', name: 'The Royal Barberia',
      tagline: 'Luxury grooming with modern fades and classic precision styling.',
      photos: [
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=900&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&h=600&fit=crop&q=90',
      ],
      rating: 4.9, totalReviews: 312, city: 'Mumbai', address: 'Bhilwara, Rajasthan',
      homeService: false, opening_time: '09:00', closing_time: '21:00', weekly_off: 'Monday',
      home_service_charge: 0,
    },
    {
      id: 'dummy-2', name: 'Classic Cuts Studio',
      tagline: 'Professional grooming experts in a premium ambience.',
      photos: [
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&h=600&fit=crop&q=90',
      ],
      rating: 4.8, totalReviews: 210, city: 'Mumbai', address: 'Azad Nagar, Mumbai',
      homeService: true, opening_time: '10:00', closing_time: '21:00', weekly_off: 'Tuesday',
      home_service_charge: 100,
    },
    {
      id: 'dummy-3', name: 'Urban Fade Lounge',
      tagline: 'Trendy hairstyles, skin fades, and luxury salon experience.',
      photos: [
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&h=600&fit=crop&q=90',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=900&h=600&fit=crop&q=90',
      ],
      rating: 5.0, totalReviews: 180, city: 'Delhi', address: 'Connaught Place, Delhi',
      homeService: false, opening_time: '09:30', closing_time: '22:00', weekly_off: 'Wednesday',
      home_service_charge: 0,
    },
    {
      id: 'dummy-4', name: 'Serenity Spa & Salon',
      tagline: 'Complete beauty solutions — hair, skin, and relaxation.',
      photos: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&h=600&fit=crop&q=90'],
      rating: 4.7, totalReviews: 95, city: 'Bangalore', address: 'Koramangala, Bangalore',
      homeService: true, opening_time: '09:00', closing_time: '20:00', weekly_off: 'Sunday',
      home_service_charge: 150,
    },
    {
      id: 'dummy-5', name: 'Prestige Barbers',
      tagline: 'Old-school precision meets modern style in every cut.',
      photos: ['https://images.unsplash.com/photo-1492526234853-2f83bfdb9c3a?w=900&h=600&fit=crop&q=90'],
      rating: 4.6, totalReviews: 143, city: 'Pune', address: 'FC Road, Pune',
      homeService: false, opening_time: '08:30', closing_time: '20:00', weekly_off: 'Thursday',
      home_service_charge: 0,
    },
    {
      id: 'dummy-6', name: 'Glow Studio',
      tagline: 'Bridal and special occasion hair and makeup specialists.',
      photos: ['https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900&h=600&fit=crop&q=90'],
      rating: 4.8, totalReviews: 72, city: 'Chennai', address: 'Anna Nagar, Chennai',
      homeService: true, opening_time: '09:00', closing_time: '19:00', weekly_off: 'Monday',
      home_service_charge: 200,
    },
  ];

  dummyList.forEach((d) => {
    seedShops.push({
      id: d.id,
      owner_id: `owner-${d.id}`,
      name: d.name,
      tagline: d.tagline,
      address: d.address,
      city: d.city,
      latitude: 19.076,
      longitude: 72.8777,
      opening_time: d.opening_time,
      closing_time: d.closing_time,
      weekly_off: d.weekly_off,
      home_service_available: d.homeService,
      home_service_charge: d.home_service_charge,
      service_radius_km: 7,
      status: 'approved',
      rejection_reason: null,
      total_bookings: 850,
      pending_bookings: 4,
      average_rating: d.rating,
      total_reviews: d.totalReviews,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const standardServices = [
      { name: 'Hair Cut & Styling', price: 350, duration: 40 },
      { name: 'Beard Trim & Shape', price: 180, duration: 25 },
      { name: 'Royal Hot Towel Shave', price: 150, duration: 20 },
      { name: 'Detox Facial', price: 650, duration: 45 },
      { name: 'Relaxing Head Massage', price: 250, duration: 25 },
    ];

    standardServices.forEach((svc, idx) => {
      seedServices.push({
        id: `svc-${d.id}-${idx}`,
        shop_id: d.id,
        name: svc.name,
        price: svc.price,
        duration_minutes: svc.duration,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    d.photos.forEach((photoUrl, pIdx) => {
      seedMedia.push({
        id: `media-${d.id}-${pIdx}`,
        shop_id: d.id,
        media_type: 'photo',
        media_url: photoUrl,
        display_order: pIdx,
        created_at: new Date().toISOString(),
      });
    });

    seedReviews.push({
      id: `rev-${d.id}-1`,
      shop_id: d.id,
      booking_id: `b-${d.id}-1`,
      customer_name: 'Rahul Khanna',
      rating: 5,
      comment: 'Top quality service and wonderful ambiance!',
      created_at: new Date().toISOString(),
    });
  });

  // Seed bookings
  const seedBookings: any[] = mockBookings.map((b) => ({
    id: b.id,
    shop_id: b.shopId || '1',
    customer_name: b.customerName,
    customer_email: b.customerEmail,
    customer_phone: b.customerPhone || '9876543210',
    customer_address: (b as any).customerAddress || null,
    service_type: b.serviceType || 'in-shop',
    requested_date: b.requestedDate,
    requested_time: b.requestedTime,
    suggested_date: b.suggestedDate || null,
    suggested_time: b.suggestedTime || null,
    final_date: (b as any).finalDate || (b.status === 'confirmed' ? b.requestedDate : null),
    final_time: (b as any).finalTime || (b.status === 'confirmed' ? b.requestedTime : null),
    status: b.status === 'time-suggested' ? 'suggested' : b.status,
    services: (b.services || []).map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      duration_minutes: s.duration,
    })),
    service_amount: (b as any).totalAmount - (b as any).homeServiceCharge,
    home_service_charge: b.homeServiceCharge || 0,
    total_amount: b.totalAmount,
    payment_status: 'paid',
    created_at: b.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Seed user profiles
  const seedProfiles: any[] = [
    {
      id: 'admin-1',
      email: 'admin@nexora.com',
      username: 'Admin',
      phone: '+91 99999 88888',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'owner1',
      email: 'owner@nexora.com',
      username: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      role: 'owner',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Seed wallet transactions
  const seedTransactions: any[] = [];
  mockWallet.transactions.forEach((t) => {
    seedTransactions.push({
      id: t.id,
      shop_id: '1',
      booking_id: t.bookingId,
      transaction_type: t.type === 'credit' ? 'earning' : 'withdrawal',
      net_amount: t.amount,
      status: t.status,
      created_at: t.date || new Date().toISOString(),
    });
  });

  // Seed staff members
  const standardSchedule = [
    { day: 'Monday', is_working: true, start_time: '10:00', end_time: '20:00' },
    { day: 'Tuesday', is_working: true, start_time: '10:00', end_time: '20:00' },
    { day: 'Wednesday', is_working: true, start_time: '10:00', end_time: '20:00' },
    { day: 'Thursday', is_working: true, start_time: '10:00', end_time: '20:00' },
    { day: 'Friday', is_working: true, start_time: '10:00', end_time: '20:00' },
    { day: 'Saturday', is_working: true, start_time: '10:00', end_time: '20:00' },
    { day: 'Sunday', is_working: false, start_time: '10:00', end_time: '18:00' },
  ];

  const seedStaff: any[] = [
    {
      id: 'staff-1-1',
      shop_id: '1',
      full_name: 'Sameer Khan',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
      primary_role: 'Senior Stylist',
      app_access_role: 'Service Provider (Assigned)',
      mobile_number: '+91 98765 12340',
      hide_mobile_from_public: false,
      commission_percentage: 25,
      status: 'Available',
      is_active: true,
      assigned_service_ids: ['s1', 's2', 's3', 's4', 's5'],
      specializations: ['Hair Coloring', 'Keratin Treatment', 'Beard Sculpting'],
      schedule: standardSchedule,
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'staff-1-2',
      shop_id: '1',
      full_name: 'Priya Sharma',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
      primary_role: 'Makeup Artist',
      app_access_role: 'Manager (Full Access)',
      mobile_number: '+91 98765 23450',
      hide_mobile_from_public: true,
      commission_percentage: 30,
      status: 'Available',
      is_active: true,
      assigned_service_ids: ['s4', 's5'],
      specializations: ['Bridal Makeup', 'Facial Treatments'],
      schedule: standardSchedule,
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'staff-1-3',
      shop_id: '1',
      full_name: 'Aarav Patel',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      primary_role: 'Hair Dresser',
      app_access_role: 'Service Provider (Assigned)',
      mobile_number: '+91 98765 34560',
      hide_mobile_from_public: false,
      commission_percentage: 20,
      status: 'Busy',
      is_active: true,
      assigned_service_ids: ['s1', 's2', 's3'],
      specializations: ['Balayage', 'Hair Coloring'],
      schedule: standardSchedule,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'staff-1-4',
      shop_id: '1',
      full_name: 'Rohan Joshi',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
      primary_role: 'Spa Therapist',
      app_access_role: 'Service Provider (Assigned)',
      mobile_number: '+91 98765 45670',
      hide_mobile_from_public: true,
      commission_percentage: 20,
      status: 'On Leave',
      is_active: true,
      assigned_service_ids: ['s4', 's5'],
      specializations: ['Deep Tissue Massage', 'Facial Treatments'],
      schedule: standardSchedule,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'staff-1-5',
      shop_id: '1',
      full_name: 'Ananya Sen',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop',
      primary_role: 'Receptionist',
      app_access_role: 'Receptionist (Frontdesk)',
      mobile_number: '+91 98765 56780',
      hide_mobile_from_public: false,
      commission_percentage: 10,
      status: 'Available',
      is_active: true,
      assigned_service_ids: [],
      specializations: ['Threading & Waxing'],
      schedule: standardSchedule,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Seed staff for dummy shops so public profile & booking has staff for any salon
  const dummyStaffMap = [
    {
      shopId: 'dummy-1',
      name: 'Vikram Malhotra',
      role: 'Senior Stylist',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop',
      phone: '+91 98201 11223',
      hide: false,
      comm: 25,
      skills: ['Beard Sculpting', 'Hair Coloring'],
    },
    {
      shopId: 'dummy-1',
      name: 'Kavita Rao',
      role: 'Makeup Artist',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop',
      phone: '+91 98201 22334',
      hide: true,
      comm: 28,
      skills: ['Bridal Makeup', 'Facial Treatments'],
    },
    {
      shopId: 'dummy-2',
      name: 'Rahul Deshmukh',
      role: 'Junior Stylist',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop',
      phone: '+91 98201 33445',
      hide: false,
      comm: 20,
      skills: ['Hair Coloring', 'Balayage'],
    },
    {
      shopId: 'dummy-3',
      name: 'Deepak Roy',
      role: 'Hair Dresser',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      phone: '+91 98201 44556',
      hide: false,
      comm: 22,
      skills: ['Beard Sculpting', 'Hair Coloring'],
    },
  ];

  dummyStaffMap.forEach((ds, idx) => {
    seedStaff.push({
      id: `staff-${ds.shopId}-${idx}`,
      shop_id: ds.shopId,
      full_name: ds.name,
      avatar_url: ds.photo,
      primary_role: ds.role,
      app_access_role: 'Service Provider (Assigned)',
      mobile_number: ds.phone,
      hide_mobile_from_public: ds.hide,
      commission_percentage: ds.comm,
      status: 'Available',
      is_active: true,
      assigned_service_ids: [`svc-${ds.shopId}-0`, `svc-${ds.shopId}-1`, `svc-${ds.shopId}-2`, `svc-${ds.shopId}-3`, `svc-${ds.shopId}-4`],
      specializations: ds.skills,
      schedule: standardSchedule,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  return {
    shops: seedShops,
    services: seedServices,
    shop_media: seedMedia,
    reviews: seedReviews,
    bookings: seedBookings,
    staff: seedStaff,
    user_profiles: seedProfiles,
    wallet_transactions: seedTransactions,
    customer_rewards: [],
    referral_history: [],
  };
}

class MockDatabase {
  private tables: Record<string, any[]> = {};
  private currentUser: any = null;
  private authListeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    const seed = initializeSeedData();
    for (const [table, defaultRows] of Object.entries(seed)) {
      this.tables[table] = getStorage(table, defaultRows);
    }
    this.currentUser = getStorage('current_user', {
      id: 'owner1',
      email: 'owner@nexora.com',
      user_metadata: {
        username: 'Rajesh Kumar',
        role: 'owner',
      },
    });
  }

  public getTable(name: string): any[] {
    return this.tables[name] || [];
  }

  public saveTable(name: string, rows: any[]) {
    this.tables[name] = rows;
    setStorage(name, rows);
  }

  public getCurrentUser() {
    return this.currentUser;
  }

  public setCurrentUser(user: any) {
    this.currentUser = user;
    setStorage('current_user', user);
    this.notifyAuthListeners();
  }

  public addAuthListener(listener: (event: string, session: any) => void) {
    this.authListeners.push(listener);
    return () => {
      this.authListeners = this.authListeners.filter((l) => l !== listener);
    };
  }

  private notifyAuthListeners() {
    const session = this.currentUser
      ? { user: this.currentUser, access_token: 'mock-token' }
      : null;
    this.authListeners.forEach((l) => l(this.currentUser ? 'SIGNED_IN' : 'SIGNED_OUT', session));
  }
}

export const mockDbInstance = new MockDatabase();

// ─── Query Builder ────────────────────────────────────────────────────────────

export class MockQueryBuilder implements PromiseLike<{ data: any; error: any }> {
  private tableName: string;
  private selectColumns: string = '*';
  private filters: Array<(row: any) => boolean> = [];
  private orderField?: string;
  private orderAscending: boolean = true;
  private isSingleResult: boolean = false;
  private isMaybeSingle: boolean = false;
  private pendingOperation?: () => { data: any; error: any };

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => String(row[column]) === String(value));
    return this;
  }

  in(column: string, values: any[]) {
    const strValues = values.map(String);
    this.filters.push((row) => strValues.includes(String(row[column])));
    return this;
  }

  or(expr: string) {
    // Basic parser for expressions like "requested_date.eq.2026-01-01,final_date.eq.2026-01-01"
    const parts = expr.split(',');
    this.filters.push((row) => {
      return parts.some((part) => {
        const [col, op, val] = part.split('.');
        if (op === 'eq') return String(row[col]) === String(val);
        return false;
      });
    });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderField = column;
    this.orderAscending = options.ascending ?? true;
    return this;
  }

  single() {
    this.isSingleResult = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(data: any | any[]) {
    this.pendingOperation = () => {
      const items = Array.isArray(data) ? data : [data];
      const rows = mockDbInstance.getTable(this.tableName);
      const inserted: any[] = [];

      for (const item of items) {
        const newItem = {
          id: item.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item,
        };
        rows.push(newItem);
        inserted.push(newItem);
      }

      mockDbInstance.saveTable(this.tableName, rows);
      return { data: Array.isArray(data) ? inserted : inserted[0], error: null };
    };
    return this;
  }

  update(updates: any) {
    this.pendingOperation = () => {
      let rows = mockDbInstance.getTable(this.tableName);
      const updatedRows: any[] = [];

      rows = rows.map((row) => {
        const matches = this.filters.every((f) => f(row));
        if (matches) {
          const updated = { ...row, ...updates, updated_at: new Date().toISOString() };
          updatedRows.push(updated);
          return updated;
        }
        return row;
      });

      mockDbInstance.saveTable(this.tableName, rows);
      return { data: this.isSingleResult || updatedRows.length === 1 ? updatedRows[0] : updatedRows, error: null };
    };
    return this;
  }

  delete() {
    this.pendingOperation = () => {
      let rows = mockDbInstance.getTable(this.tableName);
      rows = rows.filter((row) => !this.filters.every((f) => f(row)));
      mockDbInstance.saveTable(this.tableName, rows);
      return { data: null, error: null };
    };
    return this;
  }

  upsert(data: any | any[], _options?: any) {
    this.pendingOperation = () => {
      const items = Array.isArray(data) ? data : [data];
      const rows = mockDbInstance.getTable(this.tableName);
      const result: any[] = [];

      for (const item of items) {
        const idx = rows.findIndex((r) => (item.id && r.id === item.id) || (item.email && r.email === item.email));
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...item, updated_at: new Date().toISOString() };
          result.push(rows[idx]);
        } else {
          const newItem = {
            id: item.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            created_at: new Date().toISOString(),
            ...item,
          };
          rows.push(newItem);
          result.push(newItem);
        }
      }

      mockDbInstance.saveTable(this.tableName, rows);
      return { data: Array.isArray(data) ? result : result[0], error: null };
    };
    return this;
  }

  private execute(): { data: any; error: any } {
    if (this.pendingOperation) {
      return this.pendingOperation();
    }

    let rows = mockDbInstance.getTable(this.tableName);

    // Apply filters
    if (this.filters.length > 0) {
      rows = rows.filter((row) => this.filters.every((f) => f(row)));
    }

    // Apply joins if requested in select query
    rows = rows.map((row) => {
      const copy = { ...row };
      if (this.selectColumns.includes('services(*)')) {
        const services = mockDbInstance.getTable('services').filter((s) => s.shop_id === row.id);
        copy.services = services;
      }
      if (this.selectColumns.includes('shop_media(*)')) {
        const media = mockDbInstance.getTable('shop_media').filter((m) => m.shop_id === row.id);
        copy.shop_media = media;
      }
      if (this.selectColumns.includes('reviews(*)')) {
        const reviews = mockDbInstance.getTable('reviews').filter((r) => r.shop_id === row.id);
        copy.reviews = reviews;
      }
      if (this.selectColumns.includes('shops(*)')) {
        const shop = mockDbInstance.getTable('shops').find((s) => s.id === row.shop_id);
        copy.shops = shop || null;
      }
      if (this.selectColumns.includes('staff(*)')) {
        const staffList = mockDbInstance.getTable('staff').filter((st) => st.shop_id === row.id && st.is_active !== false);
        copy.staff = staffList;
      }
      return copy;
    });

    // Apply ordering
    if (this.orderField) {
      const field = this.orderField;
      const asc = this.orderAscending;
      rows = [...rows].sort((a, b) => {
        const vA = a[field] ?? '';
        const vB = b[field] ?? '';
        if (vA < vB) return asc ? -1 : 1;
        if (vA > vB) return asc ? 1 : -1;
        return 0;
      });
    }

    if (this.isSingleResult) {
      if (rows.length === 0) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
      }
      return { data: rows[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: rows[0] || null, error: null };
    }

    return { data: rows, error: null };
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const res = this.execute();
    return Promise.resolve(res).then(onfulfilled, onrejected);
  }
}

// ─── Create Mock Supabase Object ──────────────────────────────────────────────

export function createMockSupabaseClient() {
  return {
    from(table: string) {
      return new MockQueryBuilder(table);
    },
    storage: {
      from(bucket: string) {
        return {
          upload: async (path: string, file: File) => {
            const publicUrl = URL.createObjectURL(file);
            return { data: { path: publicUrl }, error: null };
          },
          getPublicUrl: (path: string) => {
            return {
              data: {
                publicUrl: path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')
                  ? path
                  : 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&fit=crop',
              },
            };
          },
          remove: async (_paths: string[]) => {
            return { error: null };
          },
        };
      },
    },
    rpc: async (fnName: string, args: any) => {
      if (fnName === 'get_wallet_balance') {
        const txs = mockDbInstance.getTable('wallet_transactions').filter((t) => t.shop_id === args?.p_shop_id);
        const balance = txs.reduce((acc, t) => {
          if (t.transaction_type === 'earning' && t.status === 'completed') return acc + (t.net_amount || 0);
          if (t.transaction_type === 'withdrawal' && t.status === 'completed') return acc - (t.net_amount || 0);
          return acc;
        }, 4500);
        return { data: Math.max(0, balance), error: null };
      }
      if (fnName === 'can_withdraw') {
        return { data: (args?.p_amount || 0) >= 100, error: null };
      }
      return { data: null, error: null };
    },
    auth: {
      signUp: async ({ email, password, options }: any) => {
        const user = {
          id: `user-${Date.now()}`,
          email,
          user_metadata: {
            username: options?.data?.username || email.split('@')[0],
            role: options?.data?.role || 'owner',
          },
        };
        mockDbInstance.setCurrentUser(user);
        return {
          data: { user, session: { user, access_token: 'mock-jwt-token' } },
          error: null,
        };
      },
      signInWithPassword: async ({ email, password }: any) => {
        const isAdmin = email.toLowerCase().includes('admin');
        const user = {
          id: isAdmin ? 'admin-1' : 'owner1',
          email,
          user_metadata: {
            username: isAdmin ? 'Admin' : 'Rajesh Kumar',
            role: isAdmin ? 'admin' : 'owner',
          },
        };
        mockDbInstance.setCurrentUser(user);
        return {
          data: { user, session: { user, access_token: 'mock-jwt-token' } },
          error: null,
        };
      },
      signOut: async () => {
        mockDbInstance.setCurrentUser(null);
        return { error: null };
      },
      getSession: async () => {
        const user = mockDbInstance.getCurrentUser();
        return {
          data: {
            session: user ? { user, access_token: 'mock-jwt-token' } : null,
          },
          error: null,
        };
      },
      getUser: async () => {
        const user = mockDbInstance.getCurrentUser();
        return {
          data: { user },
          error: null,
        };
      },
      onAuthStateChange: (callback: any) => {
        const unsubscribe = mockDbInstance.addAuthListener(callback);
        return {
          data: {
            subscription: {
              unsubscribe,
            },
          },
        };
      },
      updateUser: async (updates: any) => {
        const current = mockDbInstance.getCurrentUser();
        const updated = { ...current, ...updates };
        mockDbInstance.setCurrentUser(updated);
        return { data: { user: updated }, error: null };
      },
      resetPasswordForEmail: async (_email: string) => {
        return { error: null };
      },
    },
  };
}
