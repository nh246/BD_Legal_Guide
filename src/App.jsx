import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';

// Layout
import Navbar from './components/layout/Navbar';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import SignupPage from './pages/public/SignupPage';
import PricingPage from './pages/public/PricingPage';

// Client Pages
import ChatPage from './pages/client/ChatPage';
import LawyerDirectoryPage from './pages/client/LawyerDirectoryPage';
import LawyerProfilePage from './pages/client/LawyerProfilePage';
import BookingPage from './pages/client/BookingPage';
import MyBookingsPage from './pages/client/MyBookingsPage';
import ConsultationChatPage from './pages/client/ConsultationChatPage';

// Lawyer & Firm Pages
import LawyerOnboarding from './pages/lawyer/LawyerOnboarding';
import LawyerDashboard from './pages/lawyer/LawyerDashboard';
import AvailabilityPage from './pages/lawyer/AvailabilityPage';
import BookingDetailPage from './pages/lawyer/BookingDetailPage';
import FirmTeamPage from './pages/firm/FirmTeamPage';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import AdminVerification from './pages/admin/AdminVerification';
import AdminQueries from './pages/admin/AdminQueries';

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
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<SignupPage />} /> {/* Route to signup for now */}
            <Route path="/pricing" element={<PricingPage />} />

            {/* Client Routes */}
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
            <Route path="/lawyers" element={<LawyerDirectoryPage />} />
            <Route path="/lawyers/:id" element={<LawyerProfilePage />} />
            <Route path="/consultation/book/:id" element={<BookingPage />} />
            <Route path="/bookings" element={<MyBookingsPage />} />
            <Route path="/consultation/:id" element={<ConsultationChatPage />} />

            {/* Lawyer & Firm Routes */}
            <Route path="/lawyer/onboarding" element={<LawyerOnboarding />} />
            <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
            <Route path="/lawyer/availability" element={<AvailabilityPage />} />
            <Route path="/lawyer/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/firm/team" element={<FirmTeamPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/verifications" element={<AdminVerification />} />
            <Route path="/admin/queries" element={<AdminQueries />} />
          </Routes>
        </main>
      </div>
    </ClerkProvider>
  );
}

export default App;
