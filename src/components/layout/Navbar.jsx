import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Bell } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

export default function Navbar() {
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
            <Link to="/chat" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Chat
            </Link>
            <Link to="/lawyers" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Find Lawyers
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Pricing
            </Link>
          </div>

          {/* Right: Auth Actions */}
          <div className="flex items-center gap-4">
            <SignedIn>
              <button className="p-2 text-zinc-400 hover:text-zinc-50 transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
              </button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            
            <SignedOut>
              <Link to="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                Log In
              </Link>
              <Link to="/signup" className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
                Sign Up
              </Link>
            </SignedOut>
          </div>

        </div>
      </div>
    </nav>
  );
}
