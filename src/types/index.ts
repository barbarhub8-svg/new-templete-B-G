// =====================================================
// DATABASE TYPES - From Supabase schema
// =====================================================
export type {
  UserProfile,
  Shop as DbShop,
  ShopMedia,
  Service as DbService,
  Booking as DbBooking,
  BookingService,
  Review as DbReview,
  WalletTransaction as DbWalletTransaction,
  ShopWithDetails,
  BookingWithShop,
  WalletSummary,
  UserRole,
  ShopStatus,
  BookingStatus,
  PaymentStatus,
  TransactionType,
  TransactionStatus,
  MediaType,
  ServiceType,
  StaffPrimaryRole,
  StaffAppAccessRole,
  StaffStatus,
  StaffScheduleDay,
  StaffMember,
} from './database';

// =====================================================
// LEGACY TYPES (For backward compatibility)
// Will be migrated to use database types
// =====================================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'owner' | 'admin';
  shopId?: string;
  shopStatus?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  icon: string;
}

export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerPhoto: string;
  address: string;
  city: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number;
  photos: string[];
  video?: string;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  pendingBookings: number;
  workingHours: {
    start: string;
    end: string;
  };
  weeklyOff: string;
  homeServiceAvailable: boolean;
  homeServiceCharge: number;
  serviceRadius: number;
  status: 'pending' | 'approved' | 'rejected';
  services: Service[];
  reviews: Review[];
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  bookingId: string;
}

export interface Booking {
  id: string;
  shopId?: string;
  shopStatus: string;
  shopName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  services: Service[];
  serviceType: 'in-shop' | 'home';
  customerAddress?: string;
  requestedDate: string;
  requestedTime: string;
  suggestedDate?: string;
  suggestedTime?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'time-suggested' | 'completed' | 'cancelled';
  totalAmount: number;
  homeServiceCharge: number;
  commission: number;
  ownerEarning: number;
  whatsappConfirmation: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface WalletTransaction {
  id: string;
  ownerId: string;
  bookingId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  date: string;
  status: 'pending' | 'completed';
}

export interface Wallet {
  ownerId: string;
  totalEarnings: number;
  totalCommission: number;
  availableBalance: number;
  pendingBalance: number;
  transactions: WalletTransaction[];
}
