import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import CustomerLayout from './components/layout/CustomerLayout';
import OwnerLayout from './components/layout/OwnerLayout';
import HomePage from './pages/customer/HomePage';
import ShopDetailsPage from './pages/customer/ShopDetailsPage';
import ShopMiniWebsite from './pages/customer/ShopMiniWebsite';
import BookingPage from './pages/customer/BookingPage';
import BookingConfirmationPage from './pages/customer/BookingConfirmationPage';
import BookingStatusPage from './pages/customer/BookingStatusPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import MyRewardsPage from './pages/customer/MyRewardsPage';
import SalonListingPage from './pages/customer/SalonListingPage';
import TermsPage from './pages/customer/TermsPage';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerBookings from './pages/owner/OwnerBookings';
import OwnerWallet from './pages/owner/OwnerWallet';
import OwnerProfile from './pages/owner/OwnerProfile';
import OwnerServices from './pages/owner/OwnerServices';
import OwnerStaff from './pages/owner/OwnerStaff';
import OwnerRegisterPage from './pages/owner/OwnerRegisterPage';
import PendingApprovalPage from './pages/owner/PendingApprovalPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLayout from './components/layout/AdminLayout';
import { useAuthStore } from './stores/authStore';

function App() {
  return (
    <Router>
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
      <Toaster />
    </Router>
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
