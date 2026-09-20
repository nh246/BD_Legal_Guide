import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useUser();
  const { role, isOnboarded } = useAuthStore();
  const location = useLocation();
  const path = location.pathname;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/roles" replace />;
  }

  // Role Routing Logic
  if (role === 'lawyer') {
    if (!isOnboarded && path !== '/lawyer/onboarding') {
      return <Navigate to="/lawyer/onboarding" replace />;
    }
    // Prevent onboarded lawyers from going back to onboarding
    if (isOnboarded && path === '/lawyer/onboarding') {
      return <Navigate to="/lawyer/dashboard" replace />;
    }
    // If they try to access a client route, bump them to dashboard
    if (isOnboarded && (path === '/chat' || path === '/')) {
      return <Navigate to="/lawyer/dashboard" replace />;
    }
  } 
  
  else if (role === 'firm') {
    if (!isOnboarded && path !== '/firm/onboarding') {
      return <Navigate to="/firm/onboarding" replace />;
    }
    if (isOnboarded && path === '/firm/onboarding') {
      return <Navigate to="/firm/dashboard" replace />;
    }
    if (isOnboarded && (path === '/chat' || path === '/')) {
      return <Navigate to="/firm/dashboard" replace />;
    }
  } 
  
  else if (role === 'client') {
    // If they try to go to root or a lawyer/firm specific area, bump to chat
    if (path === '/' || path.startsWith('/lawyer') || path.startsWith('/firm')) {
      return <Navigate to="/chat" replace />;
    }
  }

  return <Outlet />;
}
