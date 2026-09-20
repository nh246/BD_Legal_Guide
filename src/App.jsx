import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';

import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import DemoRoleSwitcher from './components/DemoRoleSwitcher';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/public/PricingPage';

// Client Pages
import ChatPage from './pages/client/ChatPage';
import LawyerDirectoryPage from './pages/client/LawyerDirectoryPage';
import LawyerProfilePage from './pages/client/LawyerProfilePage';
import BookingPage from './pages/client/BookingPage';
import MyBookingsPage from './pages/client/MyBookingsPage';
import ConsultationChatPage from './pages/client/ConsultationChatPage';

// Lawyer & Firm Pages
import LawyerOnboarding from './pages/LawyerOnboarding';
import FirmOnboarding from './pages/FirmOnboarding';
import LawyerDashboard from './pages/LawyerDashboard';
import FirmDashboard from './pages/FirmDashboard';
import AvailabilityPage from './pages/lawyer/AvailabilityPage';
import BookingDetailPage from './pages/lawyer/BookingDetailPage';
import FirmTeamPage from './pages/firm/FirmTeamPage';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminVerification from './pages/admin/AdminVerification';
import AdminQueries from './pages/admin/AdminQueries';
import AdminModerators from './pages/admin/AdminModerators';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminUsers from './pages/admin/AdminUsers';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminFirms from './pages/admin/AdminFirms';
import AdminModeration from './pages/admin/AdminModeration';

// Clerk Key (Placeholder)
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_ZHVtbXktY2xlcmstcHVibGlzaGFibGUta2V5LmNsZXJrLmFjY291bnRzLmRldiQ";

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-blue-500/30">
        <Navbar />
        
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/roles" element={<RoleSelectionPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/lawyers" element={<LawyerDirectoryPage />} />
            <Route path="/lawyers/:id" element={<LawyerProfilePage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:id" element={<ChatPage />} />
              <Route path="/consultation/book/:id" element={<BookingPage />} />
              <Route path="/bookings" element={<MyBookingsPage />} />
              <Route path="/consultation/:id" element={<ConsultationChatPage />} />

              <Route path="/lawyer/onboarding" element={<LawyerOnboarding />} />
              <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
              <Route path="/lawyer/availability" element={<AvailabilityPage />} />
              <Route path="/lawyer/bookings/:id" element={<BookingDetailPage />} />
              
              <Route path="/firm/onboarding" element={<FirmOnboarding />} />
              <Route path="/firm/dashboard" element={<FirmDashboard />} />
              <Route path="/firm/team" element={<FirmTeamPage />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="verifications" element={<AdminVerification />} />
                <Route path="queries" element={<AdminQueries />} />
                <Route path="moderators" element={<AdminModerators />} />
                <Route path="audit-logs" element={<AdminAuditLogs />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="complaints" element={<AdminComplaints />} />
                <Route path="firms" element={<AdminFirms />} />
                <Route path="moderation" element={<AdminModeration />} />
              </Route>
            </Route>
          </Routes>
        </main>
        <DemoRoleSwitcher />
      </div>
    </ClerkProvider>
  );
}

export default App;
