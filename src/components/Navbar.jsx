import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, LogOut, User, LayoutDashboard, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Scale className="h-6 w-6 text-blue-400" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              BD<span className="gradient-text">LegalAI</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Pricing</Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/chat" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Chat</Link>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Dashboard</Link>
                {user?.is_admin && (
                  <Link to="/admin" className="flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
                    <Settings className="w-4 h-4 mr-1" />
                    Admin
                  </Link>
                )}
                
                <div className="h-6 w-px bg-gray-700 mx-2"></div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">{user?.full_name || user?.email}</span>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                  Log in
                </Link>
                <Link to="/login?register=true" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
