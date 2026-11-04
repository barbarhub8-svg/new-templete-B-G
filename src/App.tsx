import { lazy,Suspense } from 'react';
import { Navigate,Outlet,Route,BrowserRouter as Router,Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import CustomerLayout from './components/layout/CustomerLayout';
import OwnerLayout from './components/layout/OwnerLayout';
import { Toaster } from './components/ui/toaster';
import { useAuthStore } from './stores/authStore';
const HomePage = lazy(() => import('./pages/customer/HomePage'));
const ShopDetailsPage = lazy(() => import('./pages/customer/ShopDetailsPage'));
const ShopMiniWebsite = lazy(() => import('./pages/customer/ShopMiniWebsite'));
const BookingPage = lazy(() => import('./pages/customer/BookingPage'));
const BookingConfirmationPage = lazy(() => import('./pages/customer/BookingConfirmationPage'));
const BookingStatusPage = lazy(() => import('./pages/customer/BookingStatusPage'));
const MyBookingsPage = lazy(() => import('./pages/customer/MyBookingsPage'));
const MyRewardsPage = lazy(() => import('./pages/customer/MyRewardsPage'));
const SalonListingPage = lazy(() => import('./pages/customer/SalonListingPage'));
const TemplatesGalleryPage = lazy(() => import('./pages/customer/TemplatesGalleryPage'));
const TermsPage = lazy(() => import('./pages/customer/TermsPage'));
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const Marketing = lazy(() => import('./pages/owner/marketing/Marketing'));
const OwnerBookings = lazy(() => import('./pages/owner/OwnerBookings'));
const OwnerWallet = lazy(() => import('./pages/owner/OwnerWallet'));
const OwnerProfile = lazy(() => import('./pages/owner/OwnerProfile'));
const OwnerServices = lazy(() => import('./pages/owner/OwnerServices'));
const OwnerStaff = lazy(() => import('./pages/owner/OwnerStaff'));
const OwnerRegisterPage = lazy(() => import('./pages/owner/OwnerRegisterPage'));
const PendingApprovalPage = lazy(() => import('./pages/owner/PendingApprovalPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function App() {
  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] overflow-x-hidden">
      <Router>
        <Suspense fallback={<div role="status" className="p-8 text-center text-white/60">Loading…</div>}>
        <Routes>
          {/* Shop Mini-Website — standalone, no BarberHub navbar */}
          <Route path="/shop/:shopId" element={<ShopMiniWebsite />} />

          {/* Customer Routes */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop/:shopId/details" element={<ShopDetailsPage />} />
            <Route path="shop/:shopId/book" element={<BookingPage />} />
            <Route path="booking/confirmation/:bookingId" element={<BookingConfirmationPage />} />
            <Route path="my-bookings" element={<MyBookingsPage />} />
            <Route path="booking/:id" element={<BookingStatusPage />} />
            <Route path="rewards" element={<MyRewardsPage />} />
            <Route path="salons" element={<SalonListingPage />} />
            <Route path="templates" element={<TemplatesGalleryPage />} />
            <Route path="terms" element={<TermsPage />} />
          </Route>

          {/* Owner Routes */}
          <Route path="/owner" element={<ProtectedOwnerRoute />}>
            <Route element={<OwnerLayout />}>
              <Route index element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="bookings" element={<OwnerBookings />} />
              <Route path="services" element={<OwnerServices />} />
              <Route path="staff" element={<OwnerStaff />} />
              <Route path="wallet" element={<OwnerWallet />} />
              <Route path="profile" element={<OwnerProfile />} />
            </Route>
          </Route>

          <Route path="/app/owner" element={<ProtectedOwnerRoute />}>
            <Route element={<OwnerLayout />}>
              <Route path="marketing" element={<Marketing />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/*" element={<ProtectedAdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/owner/register" element={<OwnerRegisterPage />} />
          <Route path="/owner/pending-approval" element={<PendingApprovalPage />} />
        </Routes>
        </Suspense>
        <Toaster />
      </Router>
    </div>
  );
}

function ProtectedAdminRoute() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}

function ProtectedOwnerRoute() {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || user?.role !== 'owner') {
    return <Navigate to="/login" replace />;
  }

  // Redirect to pending page if shop is not approved
  const shopStatus = user?.shopStatus;
  if (shopStatus && shopStatus !== 'approved') {
    return <Navigate to="/owner/pending-approval" replace />;
  }
  
  return <Outlet />;
}

export default App;
