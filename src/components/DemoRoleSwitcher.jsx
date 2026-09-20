import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useAdminStore, { INITIAL_MODS } from '../store/useAdminStore';
import { User, Gavel, Building2, Trash2, Shield, ChevronUp } from 'lucide-react';

export default function DemoRoleSwitcher() {
  if (import.meta.env.VITE_DEMO_MODE !== 'true') return null;

  const { role, setRole, completeOnboarding } = useAuthStore();
  const { setAdminRole, adminRole, activeModId } = useAdminStore();
  const navigate = useNavigate();
  const [modDropdownOpen, setModDropdownOpen] = useState(false);

  const handleSwitch = (newRole, path) => {
    localStorage.setItem('selected_role', newRole);
    setRole(newRole);
    if (newRole === 'admin') setAdminRole('ADMIN');
    completeOnboarding();
    navigate(path);
  };

  const handleModSwitch = (modId) => {
    localStorage.setItem('selected_role', 'admin'); // global protected route thinks it's admin
    setRole('admin');
    setAdminRole('MODERATOR', modId);
    completeOnboarding();
    setModDropdownOpen(false);
    navigate('/admin');
  };

  const handleClear = () => {
    localStorage.removeItem('selected_role');
    setRole(null);
    setAdminRole('ADMIN');
    navigate('/');
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-zinc-900 border border-zinc-800 p-2 rounded-2xl shadow-2xl flex items-center gap-2">
      <div className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
        Demo Mode
      </div>
      
      <button 
        onClick={() => handleSwitch('client', '/chat')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
          role === 'client' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-700'
        }`}
      >
        <User className="h-3 w-3" /> Client
      </button>

      <button 
        onClick={() => handleSwitch('lawyer', '/lawyer/dashboard')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
          role === 'lawyer' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-700'
        }`}
      >
        <Gavel className="h-3 w-3" /> Lawyer
      </button>

      <button 
        onClick={() => handleSwitch('firm', '/firm/dashboard')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
          role === 'firm' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-700'
        }`}
      >
        <Building2 className="h-3 w-3" /> Firm
      </button>

      {/* Mod Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setModDropdownOpen(!modDropdownOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            role === 'admin' && adminRole === 'MODERATOR' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-700'
          }`}
        >
          <Shield className="h-3 w-3" /> Mod <ChevronUp className="h-3 w-3 opacity-50" />
        </button>

        {modDropdownOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 overflow-hidden animate-in slide-in-from-bottom-2">
            {INITIAL_MODS.map(mod => (
              <button
                key={mod.id}
                onClick={() => handleModSwitch(mod.id)}
                className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-zinc-800 transition-colors ${
                  activeModId === mod.id ? 'text-emerald-400' : 'text-zinc-300'
                }`}
              >
                {mod.id.toUpperCase()} - {mod.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-zinc-800 mx-1"></div>

      <button 
        onClick={handleClear}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-950 text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 className="h-3 w-3" /> Clear
      </button>
    </div>
  );
}
