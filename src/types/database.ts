// =====================================================
// DATABASE TYPES - Auto-generated from Supabase schema
// =====================================================

export type UserRole = 'customer' | 'owner' | 'admin';

export type ShopStatus = 'pending' | 'approved' | 'rejected';

export type BookingStatus = 
  | 'pending' 
  | 'time_suggested' 
  | 'confirmed' 
  | 'rejected' 
  | 'completed' 
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type TransactionType = 'earning' | 'commission' | 'withdrawal';

export type TransactionStatus = 'pending' | 'completed' | 'failed';

export type MediaType = 'photo' | 'video' | 'owner_photo';

export type ServiceType = 'in-shop' | 'home';

// =====================================================
// TABLE TYPES
// =====================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  opening_time: string;
  closing_time: string;
  weekly_off: string;
  home_service_available: boolean;
  home_service_charge: number;
  service_radius_km: number;
  status: ShopStatus;
  rejection_reason: string | null;
  total_bookings: number;
  pending_bookings: number;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface ShopMedia {
  id: string;
  shop_id: string;
  media_type: MediaType;
  media_url: string;
  display_order: number;
  created_at: string;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Booking {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  service_type: ServiceType;
  requested_date: string;
  requested_time: string;
  suggested_date: string | null;
  suggested_time: string | null;
  final_date: string | null;
  final_time: string | null;
  status: BookingStatus;
  staff_id?: string | null;
  staff_name?: string | null;
  staff_role?: string | null;
  staff_avatar?: string | null;
  services: BookingService[];
  service_amount: number;
  home_service_charge: number;
  total_amount: number;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

// =====================================================
// STAFF MANAGEMENT TYPES
// =====================================================

export type StaffPrimaryRole =
  | 'Senior Stylist'
  | 'Junior Stylist'
  | 'Hair Dresser'
  | 'Makeup Artist'
  | 'Nail Artist'
  | 'Spa Therapist'
  | 'Salon Manager'
  | 'Receptionist';

export type StaffAppAccessRole =
  | 'Manager (Full Access)'
  | 'Service Provider (Assigned)'
  | 'Receptionist (Frontdesk)';

export type StaffStatus = 'Available' | 'Busy' | 'On Leave' | 'Unavailable';

export interface StaffScheduleDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  is_working: boolean;
  start_time: string;
  end_time: string;
}

export interface StaffMember {
  id: string;
  shop_id: string;
  full_name: string;
  avatar_url?: string | null;
  primary_role: StaffPrimaryRole;
  app_access_role: StaffAppAccessRole;
  mobile_number: string;
  hide_mobile_from_public: boolean;
  commission_percentage: number;
  status: StaffStatus;
  is_active: boolean;
  assigned_service_ids: string[];
  specializations: string[];
  schedule: StaffScheduleDay[];
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  shop_id: string;
  booking_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  shop_id: string;
  booking_id: string | null;
  transaction_type: TransactionType;
  amount: number;
  platform_commission: number;
  net_amount: number;
  status: TransactionStatus;
  withdrawal_method: string | null;
  withdrawal_details: Record<string, any> | null;
  created_at: string;
  completed_at: string | null;
}

// =====================================================
// EXTENDED TYPES WITH RELATIONS
// =====================================================

export interface ShopWithDetails extends Shop {
  owner: UserProfile;
  services: Service[];
  media: ShopMedia[];
  reviews: Review[];
}

export interface BookingWithShop extends Booking {
  shop: Shop;
}

export interface WalletSummary {
  total_earnings: number;
  total_withdrawals: number;
  available_balance: number;
  pending_amount: number;
}
