import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

import Navbar from './components/layout/Navbar';
import RequireAuth from './components/RequireAuth';
import Toaster from './components/ui/Toaster';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import PricingPage from './pages/public/PricingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Client Pages
import ClientDashboard from './pages/client/ClientDashboard';
import ChatPage from './pages/client/ChatPage';
import LawyerDirectoryPage from './pages/client/LawyerDirectoryPage';
import LawyerProfilePage from './pages/client/LawyerProfilePage';
import BookingPage from './pages/client/BookingPage';
import MyBookingsPage from './pages/client/MyBookingsPage';
import ConsultationChatPage from './pages/client/ConsultationChatPage';

// Lawyer Pages
import LawyerDashboard from './pages/lawyer/LawyerDashboard';
import LawyerOnboarding from './pages/lawyer/LawyerOnboarding';
import AvailabilityPage from './pages/lawyer/AvailabilityPage';
import BookingDetailPage from './pages/lawyer/BookingDetailPage';
import LawyerProfileEditPage from './pages/lawyer/LawyerProfilePage';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminModerators from './pages/admin/AdminModerators';
import AdminLawyers from './pages/admin/AdminLawyers';
import AdminFirms from './pages/admin/AdminFirms';
import AdminQueries from './pages/admin/AdminQueries';
import AdminLlmConfig from './pages/admin/AdminLlmConfig';
import AdminPayments from './pages/admin/AdminPayments';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

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

function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-blue-500/30">
      <Navbar />

      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />
          <Route path="/chat" element={<Navigate to="/client/chat" replace />} />
          <Route path="/lawyers" element={<Navigate to="/client/lawyers" replace />} />
          <Route path="/dashboard" element={<Navigate to="/client" replace />} />
          <Route path="/firm/*" element={<FirmComingSoon />} />

          {/* Client */}
          <Route path="/client" element={<RequireAuth roles={['user', 'admin']} />}>
            <Route index element={<ClientDashboard />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:sessionId" element={<ChatPage />} />
            <Route path="lawyers" element={<LawyerDirectoryPage />} />
            <Route path="lawyers/:id" element={<LawyerProfilePage />} />
            <Route path="book/:id" element={<BookingPage />} />
            <Route path="bookings" element={<MyBookingsPage />} />
            <Route path="consultation/:id" element={<ConsultationChatPage />} />
          </Route>

          {/* Lawyer */}
          <Route path="/lawyer" element={<RequireAuth roles={['lawyer', 'admin']} />}>
            <Route index element={<LawyerDashboard />} />
            <Route path="onboarding" element={<LawyerOnboarding />} />
            <Route path="profile" element={<LawyerProfileEditPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="requests/:id" element={<BookingDetailPage />} />
          </Route>

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RequireAuth roles={['admin', 'moderator']}>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="moderators" element={<AdminModerators />} />
            <Route path="lawyers" element={<AdminLawyers />} />
            <Route path="firms" element={<AdminFirms />} />
            <Route path="queries" element={<AdminQueries />} />
            <Route path="llm-config" element={<AdminLlmConfig />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Toaster />
    </div>
  );
}

export default App;
