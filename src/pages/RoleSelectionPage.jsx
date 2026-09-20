import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Gavel, Building2, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ROLES = [
  {
    id: 'client',
    title: 'I need legal help',
    icon: User,
    accent: 'blue',
    bullets: [
      'AI legal answers in Bangla & English',
      'Browse verified lawyers',
      'Free basic access'
    ]
  },
  {
    id: 'lawyer',
    title: 'I am a Lawyer',
    icon: Gavel,
    accent: 'amber',
    bullets: [
      'Verified advocate profile',
      'Booking & fee management',
      'In-platform client chat'
    ]
  },
  {
    id: 'firm',
    title: 'We are a Law Firm',
    icon: Building2,
    accent: 'violet',
    bullets: [
      'Multi-lawyer team dashboard',
      'Firm-wide bookings',
      'Priority placement'
    ]
  }
];

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();
  const setAuthRole = useAuthStore((state) => state.setRole);

  const handleContinue = () => {
    if (!selectedRole) return;
    localStorage.setItem('selected_role', selectedRole);
    setAuthRole(selectedRole);
    navigate(`/signup?role=${selectedRole}`);
  };

  const accentColors = {
    blue: {
      selected: 'border-blue-500 ring-1 ring-blue-500 shadow-xl shadow-blue-500/10',
      text: 'text-blue-500',
      iconBg: 'bg-blue-500/20 text-blue-400',
      bullet: 'bg-blue-500'
    },
    amber: {
      selected: 'border-amber-500 ring-1 ring-amber-500 shadow-xl shadow-amber-500/10',
      text: 'text-amber-500',
      iconBg: 'bg-amber-500/20 text-amber-400',
      bullet: 'bg-amber-500'
    },
    violet: {
      selected: 'border-violet-500 ring-1 ring-violet-500 shadow-xl shadow-violet-500/10',
      text: 'text-violet-500',
      iconBg: 'bg-violet-500/20 text-violet-400',
      bullet: 'bg-violet-500'
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-5xl mx-auto">
        
        {/* Ghost Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-zinc-50 transition-colors mb-12"
        >
          &larr; Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-50 mb-3">Join BD Legal AI</h1>
          <p className="text-sm sm:text-base text-zinc-500">Choose how you want to use the platform</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {ROLES.map((role, idx) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            const style = accentColors[role.accent];
            
            return (
              <div 
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`group bg-zinc-900 border rounded-xl p-6 cursor-pointer transition-all duration-300 relative animate-in fade-in zoom-in-95 ${
                  isSelected 
                    ? style.selected
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div className={`absolute top-4 right-4 animate-in zoom-in ${style.text}`}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}

                {/* Icon */}
                <div className={`h-12 w-12 rounded-lg mb-6 flex items-center justify-center transition-colors ${
                  isSelected ? style.iconBg : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className={`text-xl font-bold mb-4 transition-colors ${
                  isSelected ? 'text-zinc-50' : 'text-zinc-200 group-hover:text-zinc-50'
                }`}>
                  {role.title}
                </h3>

                <ul className="space-y-3">
                  {role.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2 text-sm text-zinc-400">
                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${
                        isSelected ? style.bullet : 'bg-zinc-700'
                      }`} />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Action */}
        <div className="flex justify-center animate-in fade-in duration-500 delay-300">
          <button 
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`px-8 py-3.5 rounded-lg font-bold text-sm transition-all duration-300 ${
              selectedRole 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 cursor-pointer' 
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>

      </div>
    </div>
  );
}
