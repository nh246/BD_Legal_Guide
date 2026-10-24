import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scale, Bell, LogOut, User, Menu, X, MessageSquare, Users, Calendar, LayoutDashboard } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { homeForRole } from '../../lib/roles';
import useApi from '../../lib/useApi';
import { asList } from '../../lib/api';

export default function Navbar() {
  const { user, token, logout } = useAuthStore();
  const { data: assetsData } = useApi(token ? '/profile/assets' : null);
  const avatarAsset = asList(assetsData, 'assets').find((a) => a.kind === 'avatar');
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dynamic active route detection
  const isChat = pathname === '/client/chat' || pathname.startsWith('/client/chat') || pathname === '/chat';
  const isLawyers = pathname === '/client/lawyers' || pathname.startsWith('/client/lawyers') || pathname.startsWith('/client/book') || pathname === '/lawyers';
  const isPricing = pathname === '/pricing' || pathname.startsWith('/pricing');
  const isAvailability = pathname.startsWith('/lawyer/availability');
  const isProfile = pathname.startsWith('/lawyer/profile');

  // Dashboard is active strictly when on user's primary dashboard, not when exploring Chat or Lawyer directory
  const isDashboard = Boolean(
    user && !isChat && !isLawyers && !isPricing && !isAvailability && !isProfile && (
      pathname === homeForRole(user.role) ||
      (user.role === 'user' && (pathname === '/client' || pathname === '/dashboard' || pathname.startsWith('/client/bookings') || pathname.startsWith('/client/consultation'))) ||
      (user.role === 'lawyer' && (pathname === '/lawyer' || pathname.startsWith('/lawyer/requests'))) ||
      (user.role === 'admin' && (pathname === '/admin' || pathname.startsWith('/admin/')))
    )
  );

  const getLinkClasses = (isActive) =>
    `relative text-sm font-medium transition-all duration-150 px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
      isActive
        ? 'text-blue-400 bg-blue-500/10 shadow-sm shadow-blue-500/10 font-semibold'
        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
    }`;

  const displayName = user?.full_name || user?.name || user?.email || 'User';
  const avatarLetter = (user?.full_name || user?.name || user?.email || 'U')[0].toUpperCase();

  return (
    <nav className="sticky top-0 z-50 w-full bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Scale className="h-6 w-6 text-blue-500 transition-transform group-hover:scale-105" />
            <span className="font-bold text-lg text-zinc-50 tracking-tight">
              BD <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">LegalAI</span>
            </span>
          </Link>

          {/* Center: Desktop Navigation Links with dynamic active highlighting */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            {(!user || user.role === 'user' || user.role === 'admin') && (
              <>
                <Link
                  id="nav-link-chat"
                  to="/client/chat"
                  className={getLinkClasses(isChat)}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                  {isChat && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </Link>

                <Link
                  id="nav-link-lawyers"
                  to="/client/lawyers"
                  className={getLinkClasses(isLawyers)}
                >
                  <Users className="h-4 w-4" />
                  <span>Find Lawyers</span>
                  {isLawyers && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </Link>
              </>
            )}

            {user?.role === 'lawyer' && (
              <>
                <Link
                  id="nav-link-availability"
                  to="/lawyer/availability"
                  className={getLinkClasses(isAvailability)}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Availability</span>
                  {isAvailability && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </Link>

                <Link
                  id="nav-link-profile"
                  to="/lawyer/profile"
                  className={getLinkClasses(isProfile)}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                  {isProfile && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </Link>
              </>
            )}

            <Link
              id="nav-link-pricing"
              to={user?.role === 'lawyer' ? '/pricing?role=lawyer' : '/pricing?role=user'}
              className={getLinkClasses(isPricing)}
            >
              <span>Pricing</span>
              {isPricing && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-500 rounded-full" />
              )}
            </Link>

            {user && (
              <Link
                id="nav-link-dashboard"
                to={homeForRole(user.role)}
                className={getLinkClasses(isDashboard)}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
                {isDashboard && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-500 rounded-full" />
                )}
              </Link>
            )}
          </div>

          {/* Right: Auth Actions & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            {token && user ? (
              <div className="flex items-center gap-3">
                <button
                  className="p-2 text-zinc-400 hover:text-zinc-50 transition-colors relative rounded-lg hover:bg-zinc-800/50"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-zinc-950"></span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-zinc-800 text-sm">
                  {avatarAsset ? (
                    <img
                      src={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000')}/api/assets/${avatarAsset.id}/file`}
                      alt={displayName}
                      className="h-7 w-7 rounded-full object-cover border border-zinc-700 shrink-0"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-xs shrink-0">
                      {avatarLetter}
                    </div>
                  )}
                  <span className="text-zinc-300 font-medium hidden sm:inline max-w-[140px] truncate">
                    {displayName}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors ml-1 rounded-md hover:bg-zinc-800/50"
                    title="Log Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-zinc-300 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-600/30"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              id="navbar-mobile-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-colors ml-1"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800/80 bg-zinc-950/95 px-4 pt-3 pb-5 space-y-2 backdrop-blur-xl animate-in slide-in-from-top-2 duration-150">
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm">
              {avatarAsset ? (
                <img
                  src={`${(import.meta.env.VITE_API_URL || 'http://localhost:8000')}/api/assets/${avatarAsset.id}/file`}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover border border-zinc-700 shrink-0"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-xs shrink-0">
                  {avatarLetter}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-zinc-200 font-medium truncate">{displayName}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {(!user || user.role === 'user' || user.role === 'admin') && (
            <>
              <Link
                to="/client/chat"
                className={`w-full ${getLinkClasses(isChat)}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </Link>
              <Link
                to="/client/lawyers"
                className={`w-full ${getLinkClasses(isLawyers)}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="h-4 w-4" />
                <span>Find Lawyers</span>
              </Link>
            </>
          )}

          {user?.role === 'lawyer' && (
            <>
              <Link
                to="/lawyer/availability"
                className={`w-full ${getLinkClasses(isAvailability)}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calendar className="h-4 w-4" />
                <span>Availability</span>
              </Link>
              <Link
                to="/lawyer/profile"
                className={`w-full ${getLinkClasses(isProfile)}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </>
          )}

          <Link
            to={user?.role === 'lawyer' ? '/pricing?role=lawyer' : '/pricing?role=user'}
            className={`w-full ${getLinkClasses(isPricing)}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>Pricing</span>
          </Link>

          {user && (
            <Link
              to={homeForRole(user.role)}
              className={`w-full ${getLinkClasses(isDashboard)}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          )}

          {!token && (
            <div className="pt-3 border-t border-zinc-800/60 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center text-sm font-medium text-zinc-300 hover:text-white py-2 rounded-lg bg-zinc-900 border border-zinc-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="w-full text-center text-sm font-medium text-white py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
