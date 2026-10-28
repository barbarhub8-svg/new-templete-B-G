// =====================================================
// API FUNCTIONS - Real Database Operations
// =====================================================

import { supabase } from './supabase';
import { DUMMY_SHOP_DETAILS, DUMMY_STAFF_MEMBERS } from './dummyShopsData';
import type { 
  Shop, 
  DbShop,
  Service,
  DbService,
  Booking,
  DbBooking,
  Review,
  DbReview,
  WalletTransaction,
  DbWalletTransaction,
  StaffMember,
} from '../types';

// =====================================================
// SHOPS API
// =====================================================

/**
 * Get all approved shops with full details
 */
export async function getApprovedShops() {
  const { data: shops, error } = await supabase
    .from('shops')
    .select(`
      *,
      services(*),
      shop_media(*)
    `)
    .eq('status', 'approved')
    .order('average_rating', { ascending: false });

  if (error) throw error;
  return shops;
}

/**
 * Get shop by ID with full details
 */
export async function getShopById(shopId: string) {
  if (shopId.startsWith('dummy-') || DUMMY_SHOP_DETAILS[shopId]) {
    return DUMMY_SHOP_DETAILS[shopId] || DUMMY_SHOP_DETAILS['dummy-1'];
  }

  const { data: shop, error } = await supabase
    .from('shops')
    .select(`
      *,
      services(*),
      shop_media(*),
      reviews(*)
    `)
    .eq('id', shopId)
    .single();

  if (error) {
    if (DUMMY_SHOP_DETAILS[shopId]) {
      return DUMMY_SHOP_DETAILS[shopId];
    }
    throw error;
  }
  return shop;
}

/**
 * Get shop by owner ID
 */
export async function getShopByOwnerId(ownerId: string) {
  const { data: shop, error } = await supabase
    .from('shops')
    .select(`
      *,
      services(*),
      shop_media(*)
    `)
    .eq('owner_id', ownerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No shop found
      return null;
    }
    throw error;
  }
  return shop;
}

/**
 * Create new shop
 */
export async function createShop(shopData: {
  owner_id: string;
  name: string;
  address: string;
  city: string;
  opening_time: string;
  closing_time: string;
  weekly_off: string;
  home_service_available: boolean;
  home_service_charge: number;
  service_radius_km: number;
}) {
  const { data, error } = await supabase
    .from('shops')
    .insert(shopData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update shop details
 */
export async function updateShop(shopId: string, updates: Partial<DbShop>) {
  const { data, error } = await supabase
    .from('shops')
    .update(updates)
    .eq('id', shopId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// SERVICES API
// =====================================================

/**
 * Get services for a shop
 */
export async function getShopServices(shopId: string) {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

/**
 * Add service to shop
 */
export async function addService(serviceData: {
  shop_id: string;
  name: string;
  price: number;
  duration_minutes: number;
}) {
  const { data, error } = await supabase
    .from('services')
    .insert(serviceData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update service
 */
export async function updateService(serviceId: string, updates: Partial<DbService>) {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete service
 */
export async function deleteService(serviceId: string) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) throw error;
}

// =====================================================
// SHOP MEDIA API
// =====================================================

/**
 * Add shop media
 */
export async function addShopMedia(mediaData: {
  shop_id: string;
  media_type: 'photo' | 'video' | 'owner_photo';
  media_url: string;
  display_order: number;
}) {
  const { data, error } = await supabase
    .from('shop_media')
    .insert(mediaData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete shop media
 */
export async function deleteShopMedia(mediaId: string) {
  const { error } = await supabase
    .from('shop_media')
    .delete()
    .eq('id', mediaId);

  if (error) throw error;
}

// =====================================================
// BOOKINGS API
// =====================================================

/**
 * Create new booking
 */
export async function createBooking(bookingData: {
  shop_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  service_type: 'in-shop' | 'home';
  requested_date: string;
  requested_time: string;
  services: any[];
  service_amount: number;
  home_service_charge: number;
  total_amount: number;
  referral_code_used?: string;
  staff_id?: string | null;
  staff_name?: string | null;
  staff_role?: string | null;
  staff_avatar?: string | null;
}) {
  if (bookingData.shop_id?.startsWith('dummy-')) {
    const dummyBooking = {
      id: `booking-${Date.now()}`,
      booking_id: `NX-${Math.floor(100000 + Math.random() * 900000)}`,
      shop_id: bookingData.shop_id,
      customer_name: bookingData.customer_name,
      customer_email: bookingData.customer_email,
      customer_phone: bookingData.customer_phone || '',
      customer_address: bookingData.customer_address || '',
      service_type: bookingData.service_type,
      requested_date: bookingData.requested_date,
      requested_time: bookingData.requested_time,
      final_date: bookingData.requested_date,
      final_time: bookingData.requested_time,
      services: bookingData.services,
      service_amount: bookingData.service_amount,
      home_service_charge: bookingData.home_service_charge,
      total_amount: bookingData.total_amount,
      staff_id: bookingData.staff_id || null,
      staff_name: bookingData.staff_name || null,
      staff_role: bookingData.staff_role || null,
      staff_avatar: bookingData.staff_avatar || null,
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return dummyBooking;
  }

  const { referral_code_used, ...rest } = bookingData;

  const { data, error } = await supabase
    .from('bookings')
    .insert({ ...rest, ...(referral_code_used ? { referral_code_used } : {}) })
    .select()
    .single();

  if (error) throw error;

  // If referral code provided, register referral asynchronously
  if (referral_code_used && data) {
    try {
      // Verify the referral code exists
      const { data: refOwner } = await supabase
        .from('customer_rewards')
        .select('email')
        .eq('referral_code', referral_code_used)
        .single();

      if (refOwner && refOwner.email !== bookingData.customer_email) {
        // Ensure new customer has a rewards profile
        await supabase.from('customer_rewards').upsert({
          email: bookingData.customer_email,
          name: bookingData.customer_name,
          phone: bookingData.customer_phone || null,
          referral_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
          referred_by_code: referral_code_used,
        }, { onConflict: 'email', ignoreDuplicates: false });

        // Update referrer total_referrals count
        await supabase.from('customer_rewards')
          .update({ total_referrals: supabase.rpc as any })
          .eq('email', refOwner.email);

        // Insert referral history record (only if not duplicate)
        const { data: existingRef } = await supabase
          .from('referral_history')
          .select('id')
          .eq('referral_code', referral_code_used)
          .eq('referred_email', bookingData.customer_email)
          .single();

        if (!existingRef) {
          await supabase.from('referral_history').insert({
            referrer_email: refOwner.email,
            referred_email: bookingData.customer_email,
            referral_code: referral_code_used,
            status: 'pending',
          });
          // Increment total_referrals for referrer
          const { data: currentRw } = await supabase
            .from('customer_rewards')
            .select('total_referrals')
            .eq('email', refOwner.email)
            .single();
          if (currentRw) {
            await supabase.from('customer_rewards')
              .update({ total_referrals: (currentRw.total_referrals || 0) + 1 })
              .eq('email', refOwner.email);
          }
        }
      }
    } catch (e) {
      console.warn('Referral registration failed (non-critical):', e);
    }
  }

  return data;
}

/**
 * Get bookings for a shop
 */
export async function getShopBookings(shopId: string, status?: string) {
  let query = supabase
    .from('bookings')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get bookings for slot conflict checking
 * Returns bookings for a specific date with time and duration
 */
export async function getBookingsForSlotCheck(
  shopId: string,
  date: string,
  staffId?: string | null
): Promise<Array<{ date: string; time: string; durationMinutes: number }>> {
  if (shopId.startsWith('dummy-')) {
    return [];
  }

  let query = supabase
    .from('bookings')
    .select('requested_date, requested_time, final_date, final_time, services, staff_id')
    .eq('shop_id', shopId)
    .or(`requested_date.eq.${date},final_date.eq.${date}`)
    .in('status', ['pending', 'suggested', 'confirmed']);

  if (staffId && staffId !== 'any') {
    query = query.eq('staff_id', staffId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform bookings to slot check format
  return (data || []).map((booking: any) => {
    const services = booking.services || [];
    const totalDuration = services.reduce(
      (sum: number, s: any) => sum + (s.duration_minutes || s.duration || 0),
      0
    );

    return {
      date: booking.final_date || booking.requested_date,
      time: booking.final_time || booking.requested_time,
      durationMinutes: totalDuration,
    };
  });
}

/**
 * Get customer bookings by email
 */
export async function getCustomerBookings(email: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      shops(name, address, city)
    `)
    .eq('customer_email', email)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  updates: {
    status?: string;
    suggested_date?: string;
    suggested_time?: string;
    final_date?: string;
    final_time?: string;
  }
) {
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Owner accepts booking - sets status to confirmed
 */
export async function acceptBooking(bookingId: string) {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('requested_date, requested_time')
    .eq('id', bookingId)
    .single();

  if (fetchError) throw fetchError;

  return updateBookingStatus(bookingId, {
    status: 'confirmed',
    final_date: booking.requested_date,
    final_time: booking.requested_time,
  });
}

/**
 * Owner rejects booking - sets status to cancelled
 */
export async function rejectBooking(bookingId: string) {
  return updateBookingStatus(bookingId, {
    status: 'cancelled',
  });
}

/**
 * Owner suggests alternative time - sets status to suggested
 */
export async function suggestBookingTime(
  bookingId: string,
  suggestedDate: string,
  suggestedTime: string
) {
  return updateBookingStatus(bookingId, {
    status: 'suggested',
    suggested_date: suggestedDate,
    suggested_time: suggestedTime,
  });
}

/**
 * Customer accepts suggested time - sets status to confirmed
 */
export async function acceptSuggestedTime(bookingId: string) {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('suggested_date, suggested_time')
    .eq('id', bookingId)
    .single();

  if (fetchError) throw fetchError;

  return updateBookingStatus(bookingId, {
    status: 'confirmed',
    final_date: booking.suggested_date,
    final_time: booking.suggested_time,
  });
}

/**
 * Customer rejects suggested time - sets status back to cancelled
 */
export async function rejectSuggestedTime(bookingId: string) {
  return updateBookingStatus(bookingId, {
    status: 'cancelled',
  });
}

/**
 * Mark booking as completed
 */
export async function completeBooking(bookingId: string) {
  return updateBookingStatus(bookingId, {
    status: 'completed',
  });
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  bookingId: string,
  paymentStatus: 'pending' | 'paid' | 'refunded'
) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ payment_status: paymentStatus })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// REVIEWS API
// =====================================================

/**
 * Get reviews for a shop
 */
export async function getShopReviews(shopId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Add review for a booking
 */
export async function addReview(reviewData: {
  shop_id: string;
  booking_id: string;
  customer_name: string;
  rating: number;
  comment?: string;
}) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// WALLET API
// =====================================================

/**
 * Get wallet balance for a shop
 */
export async function getWalletBalance(shopId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_wallet_balance', {
    p_shop_id: shopId,
  });

  if (error) throw error;
  return data || 0;
}

/**
 * Get wallet transactions for a shop
 */
export async function getWalletTransactions(shopId: string) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Request withdrawal
 */
export async function requestWithdrawal(withdrawalData: {
  shop_id: string;
  amount: number;
  withdrawal_method: string;
  withdrawal_details: any;
}) {
  // First check if withdrawal is allowed
  const { data: canWithdrawData, error: checkError } = await supabase.rpc('can_withdraw', {
    p_shop_id: withdrawalData.shop_id,
    p_amount: withdrawalData.amount,
  });

  if (checkError) throw checkError;
  if (!canWithdrawData) {
    throw new Error('Insufficient balance or amount below minimum (₹100)');
  }

  // Create withdrawal transaction
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert({
      ...withdrawalData,
      transaction_type: 'withdrawal',
      net_amount: withdrawalData.amount,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// USER PROFILE API
// =====================================================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: {
  username?: string;
  phone?: string;
  avatar_url?: string;
}) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// STAFF MANAGEMENT API
// =====================================================

/**
 * Get all staff members for a shop
 */
export async function getShopStaff(shopId: string, onlyActive = true): Promise<StaffMember[]> {
  try {
    if (shopId.startsWith('dummy-') || DUMMY_STAFF_MEMBERS[shopId]) {
      return (DUMMY_STAFF_MEMBERS[shopId] || DUMMY_STAFF_MEMBERS['dummy-1']) as StaffMember[];
    }

    let query = supabase
      .from('staff')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as StaffMember[];
  } catch (err) {
    if (DUMMY_STAFF_MEMBERS[shopId]) {
      return DUMMY_STAFF_MEMBERS[shopId] as StaffMember[];
    }
    console.warn('getShopStaff error, falling back:', err);
    return [];
  }
}

/**
 * Get staff member by ID
 */
export async function getStaffById(staffId: string): Promise<StaffMember | null> {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single();

    if (error) throw error;
    return data as StaffMember;
  } catch (err) {
    console.warn('getStaffById error:', err);
    return null;
  }
}

/**
 * Create a new staff member
 */
export async function createStaffMember(staffData: {
  shop_id: string;
  full_name: string;
  avatar_url?: string | null;
  primary_role: any;
  app_access_role: any;
  mobile_number: string;
  hide_mobile_from_public: boolean;
  commission_percentage: number;
  status: any;
  is_active: boolean;
  assigned_service_ids: string[];
  specializations: string[];
  schedule: any[];
}): Promise<StaffMember> {
  const { data, error } = await supabase
    .from('staff')
    .insert(staffData)
    .select()
    .single();

  if (error) throw error;
  return data as StaffMember;
}

/**
 * Update staff member details
 */
export async function updateStaffMember(
  staffId: string,
  updates: Partial<StaffMember>
): Promise<StaffMember> {
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', staffId)
    .select()
    .single();

  if (error) throw error;
  return data as StaffMember;
}

/**
 * Deactivate a staff member
 */
export async function deactivateStaffMember(staffId: string): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .update({ is_active: false, status: 'Unavailable' })
    .eq('id', staffId);

  if (error) throw error;
}

/**
 * Reactivate a staff member
 */
export async function reactivateStaffMember(staffId: string): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .update({ is_active: true, status: 'Available' })
    .eq('id', staffId);

  if (error) throw error;
}

/**
 * Check and get available staff for a booking (service, date, time)
 */
export async function getAvailableStaffForBooking(
  shopId: string,
  serviceIds: string[],
  date: string,
  time: string
): Promise<StaffMember[]> {
  try {
    const allStaff = await getShopStaff(shopId, true);
    if (!allStaff || allStaff.length === 0) return [];

    // Parse day of week from date
    const d = new Date(date + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[d.getDay()];

    // Fetch existing bookings on this date for conflict checking
    const { data: bookingsOnDate } = await supabase
      .from('bookings')
      .select('staff_id, requested_date, requested_time, final_date, final_time, status')
      .eq('shop_id', shopId)
      .or(`requested_date.eq.${date},final_date.eq.${date}`)
      .in('status', ['pending', 'suggested', 'confirmed']);

    return allStaff.filter((staff) => {
      // 1. Status check: must not be On Leave or Unavailable
      if (staff.status === 'On Leave' || staff.status === 'Unavailable') {
        return false;
      }

      // 2. Service check: if serviceIds provided, staff must be assigned to at least one (or if assigned list is empty, treats as general)
      if (serviceIds.length > 0 && staff.assigned_service_ids && staff.assigned_service_ids.length > 0) {
        const canDoService = serviceIds.some((sId) => staff.assigned_service_ids.includes(sId));
        if (!canDoService) return false;
      }

      // 3. Schedule check: must be working on this day of week
      const daySchedule = staff.schedule?.find((s) => s.day === dayName);
      if (!daySchedule || !daySchedule.is_working) {
        return false;
      }

      // Check if time is within start_time and end_time
      if (time && daySchedule.start_time && daySchedule.end_time) {
        if (time < daySchedule.start_time || time > daySchedule.end_time) {
          return false;
        }
      }

      // 4. Booking conflict check
      if (bookingsOnDate && bookingsOnDate.length > 0 && time) {
        const hasConflict = bookingsOnDate.some((b: any) => {
          if (b.staff_id !== staff.id) return false;
          const bTime = b.final_time || b.requested_time;
          return bTime === time;
        });
        if (hasConflict) return false;
      }

      return true;
    });
  } catch (err) {
    console.warn('getAvailableStaffForBooking error:', err);
    return [];
  }
}

