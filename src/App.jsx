import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Building2 } from 'lucide-react';

import Navbar from './components/layout/Navbar';
import RequireAuth from './components/RequireAuth';
import Toaster from './components/ui/Toaster';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import PricingPage from './pages/public/PricingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';

// Client Pages
import ClientDashboard from './pages/client/ClientDashboard';
import ChatPage from './pages/client/ChatPage';
import LawyerDirectoryPage from './pages/client/LawyerDirectoryPage';
import LawyerProfilePage from './pages/client/LawyerProfilePage';
import BookingPage from './pages/client/BookingPage';
import MyBookingsPage from './pages/client/MyBookingsPage';
import MyCasesPage from './pages/client/MyCasesPage';
import ConsultationChatPage from './pages/client/ConsultationChatPage';

// Lawyer Pages
import LawyerDashboard from './pages/lawyer/LawyerDashboard';
import LawyerOnboarding from './pages/lawyer/LawyerOnboarding';
import AvailabilityPage from './pages/lawyer/AvailabilityPage';
import BookingDetailPage from './pages/lawyer/BookingDetailPage';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminModerators from './pages/admin/AdminModerators';
import AdminLawyers from './pages/admin/AdminLawyers';
import AdminQueries from './pages/admin/AdminQueries';
import AdminLLMConfig from './pages/admin/AdminLLMConfig';
import AdminPayments from './pages/admin/AdminPayments';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

import ErrorBoundary from './components/ErrorBoundary';

function FirmComingSoon() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex items-center justify-center p-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 max-w-md w-full text-center">
        <div className="h-16 w-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="h-8 w-8 text-violet-500" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-50 mb-3">Enterprise module — coming soon</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Law firm management is part of our upcoming Enterprise offering.
        </p>
        <Link to="/pricing" className="text-sm font-medium text-violet-400 hover:text-violet-300">View pricing →</Link>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-bold text-zinc-50 mb-3">Page not found</h1>
      <Link to="/" className="text-blue-500 hover:underline">Return home</Link>
    </div>
  );
}

function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let pageName = 'Your Bridge to Justice';

    if (path === '/') pageName = 'Your Bridge to Justice';
    else if (path === '/login') pageName = 'Log In';
    else if (path === '/register') pageName = 'Create Account';
    else if (path === '/reset-password') pageName = 'Reset Password';
    else if (path === '/pricing') pageName = 'Transparent Pricing';
    else if (path === '/client/chat') pageName = 'AI Legal Assistant';
    else if (path === '/client/lawyers') pageName = 'Verified Lawyers Directory';
    else if (path.startsWith('/client/lawyers/')) pageName = 'Lawyer Profile';
    else if (path === '/client/cases') pageName = 'Case Board Marketplace';
    else if (path === '/client/bookings') pageName = 'My Consultations';
    else if (path === '/client') pageName = 'Client Dashboard';
    else if (path === '/lawyer/signup') pageName = 'Join as an Advocate';
    else if (path === '/lawyer/availability') pageName = 'Availability Schedule';
    else if (path.startsWith('/lawyer')) pageName = 'Lawyer Dashboard';
    else if (path === '/admin/users') pageName = 'Admin — Users';
    else if (path === '/admin/lawyers') pageName = 'Admin — Lawyers';
    else if (path === '/admin/moderators') pageName = 'Admin — Moderators';
    else if (path === '/admin/queries') pageName = 'Admin — AI Queries';
    else if (path === '/admin/payments') pageName = 'Admin — Payments';
    else if (path === '/admin/audit-logs') pageName = 'Admin — Audit Logs';
    else if (path === '/admin/llm-config') pageName = 'Admin — LLM Config';
    else if (path.startsWith('/admin')) pageName = 'Admin Dashboard';

    document.title = `Legal Bridge — ${pageName}`;
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-blue-500/30">
      <PageTitleManager />
      <Navbar />

      <main>
        <ErrorBoundary name="Main Route Tree">
          <Routes>
            {/* Public */}
            <Route path="/" element={<ErrorBoundary name="Landing Page"><LandingPage /></ErrorBoundary>} />
            <Route path="/pricing" element={<ErrorBoundary name="Pricing Page"><PricingPage /></ErrorBoundary>} />
            <Route path="/login" element={<ErrorBoundary name="Login Page"><LoginPage /></ErrorBoundary>} />
            <Route path="/register" element={<ErrorBoundary name="Register Page"><RegisterPage /></ErrorBoundary>} />
            <Route path="/reset-password" element={<ErrorBoundary name="Reset Password Page"><ResetPasswordPage /></ErrorBoundary>} />
            <Route path="/signup" element={<Navigate to="/register" replace />} />
            <Route path="/chat" element={<Navigate to="/client/chat" replace />} />
            <Route path="/lawyers" element={<Navigate to="/client/lawyers" replace />} />
            <Route path="/dashboard" element={<Navigate to="/client" replace />} />
            <Route path="/firm/*" element={<ErrorBoundary name="Firm Module"><FirmComingSoon /></ErrorBoundary>} />

            {/* Client */}
            <Route path="/client" element={<RequireAuth roles={['user', 'admin']} />}>
              <Route index element={<ErrorBoundary name="Client Dashboard"><ClientDashboard /></ErrorBoundary>} />
              <Route path="chat" element={<ErrorBoundary name="Client Chat"><ChatPage /></ErrorBoundary>} />
              <Route path="chat/:sessionId" element={<ErrorBoundary name="Client Chat"><ChatPage /></ErrorBoundary>} />
              <Route path="lawyers" element={<ErrorBoundary name="Lawyer Directory"><LawyerDirectoryPage /></ErrorBoundary>} />
              <Route path="lawyers/:id" element={<ErrorBoundary name="Lawyer Profile"><LawyerProfilePage /></ErrorBoundary>} />
              <Route path="book/:id" element={<ErrorBoundary name="Booking Page"><BookingPage /></ErrorBoundary>} />
              <Route path="bookings" element={<ErrorBoundary name="My Bookings"><MyBookingsPage /></ErrorBoundary>} />
              <Route path="cases" element={<ErrorBoundary name="My Cases"><MyCasesPage /></ErrorBoundary>} />
              <Route path="consultation/:id" element={<ErrorBoundary name="Consultation Chat"><ConsultationChatPage /></ErrorBoundary>} />
            </Route>

            {/* Lawyer */}
            <Route path="/lawyer" element={<RequireAuth roles={['lawyer', 'admin']} />}>
              <Route index element={<ErrorBoundary name="Lawyer Dashboard"><LawyerDashboard /></ErrorBoundary>} />
              <Route path="onboarding" element={<ErrorBoundary name="Lawyer Onboarding"><LawyerOnboarding /></ErrorBoundary>} />
              <Route path="profile" element={<Navigate to="/lawyer?tab=profile" replace />} />
              <Route path="availability" element={<ErrorBoundary name="Availability Management"><AvailabilityPage /></ErrorBoundary>} />
              <Route path="requests/:id" element={<ErrorBoundary name="Booking Detail"><BookingDetailPage /></ErrorBoundary>} />
            </Route>

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <RequireAuth roles={['admin', 'moderator']}>
                  <ErrorBoundary name="Admin Portal">
                    <AdminLayout />
                  </ErrorBoundary>
                </RequireAuth>
              }
            >
              <Route index element={<ErrorBoundary name="Admin Overview"><AdminOverview /></ErrorBoundary>} />
              <Route path="users" element={<ErrorBoundary name="User Management"><AdminUsers /></ErrorBoundary>} />
              <Route path="moderators" element={<ErrorBoundary name="Moderator Management"><AdminModerators /></ErrorBoundary>} />
              <Route path="lawyers" element={<ErrorBoundary name="Lawyer Verification"><AdminLawyers /></ErrorBoundary>} />
              <Route path="queries" element={<ErrorBoundary name="Platform Queries"><AdminQueries /></ErrorBoundary>} />
              <Route path="llm-config" element={<ErrorBoundary name="LLM Configuration"><AdminLLMConfig /></ErrorBoundary>} />
              <Route path="payments" element={<ErrorBoundary name="Payment Monitoring"><AdminPayments /></ErrorBoundary>} />
              <Route path="audit-logs" element={<ErrorBoundary name="Audit Logs"><AdminAuditLogs /></ErrorBoundary>} />
            </Route>

            <Route path="*" element={<ErrorBoundary name="Page Not Found"><NotFound /></ErrorBoundary>} />
          </Routes>
        </ErrorBoundary>
      </main>

      <Toaster />
    </div>
  );
}

export default App;
