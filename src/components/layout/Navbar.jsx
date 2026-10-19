import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Bell, LogOut, User } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { homeForRole } from '../../lib/roles';

export default function Navbar() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-blue-500" />
            <span className="font-bold text-lg text-zinc-50 tracking-tight">
              BD <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">LegalAI</span>
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {(!user || user.role === 'user' || user.role === 'admin') && (
              <>
                <Link to="/client/chat" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                  Chat
                </Link>
                <Link to="/client/lawyers" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                  Find Lawyers
                </Link>
              </>
            )}
            <Link to="/pricing" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Pricing
            </Link>
            {user && (
              <Link to={homeForRole(user.role)} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                Dashboard
              </Link>
            )}
          </div>

          {/* Right: Auth Actions */}
          <div className="flex items-center gap-4">
            {token && user ? (
              <div className="flex items-center gap-3">
                <button className="p-2 text-zinc-400 hover:text-zinc-50 transition-colors relative" title="Notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-zinc-800 text-sm">
                  <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium">
                    {user.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                  <span className="text-zinc-300 font-medium hidden sm:inline">{user.name || user.email}</span>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors ml-1"
                    title="Log Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                  Log In
                </Link>
                <Link to="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
