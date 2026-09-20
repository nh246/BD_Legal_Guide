import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Upload, Loader2, X, Plus, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const PRACTICE_AREAS = ['Property', 'Family', 'Criminal', 'Labour', 'Corporate', 'Consumer'];

const STEPS = [
  { num: 1, title: 'Firm Identity' },
  { num: 2, title: 'Firm Profile' },
  { num: 3, title: 'Team Setup' }
];

export default function FirmOnboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firmName: '',
    regNumber: '',
    address: '',
    description: '',
    website: '',
    phone: '',
    practiceAreas: [],
    logoFile: null,
  });

  // Team State
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [team, setTeam] = useState([
    { id: '1', name: 'You (Owner)', email: 'owner@firm.com', role: 'owner' }
  ]);

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key, item) => {
    setFormData(prev => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
      };
    });
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;
    setIsInviting(true);
    setTimeout(() => {
      setTeam([...team, { id: Date.now().toString(), name: 'Pending', email: inviteEmail, role: 'invited' }]);
      setInviteEmail('');
      setIsInviting(false);
    }, 1000);
  };

  const removeInvite = (id) => {
    setTeam(team.filter(member => member.id !== id));
  };

  const isStepValid = () => {
    if (step === 1) return formData.firmName.trim() !== '' && formData.regNumber.trim() !== '';
    if (step === 2) return true; // Optional fields
    if (step === 3) return true;
    return false;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        completeOnboarding();
        navigate('/firm/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Firm Onboarding</h1>
          <p className="text-zinc-400">Register your law firm and invite your team.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-2 sm:px-12">
          <div className="absolute left-10 right-10 sm:left-20 sm:right-20 top-1/2 h-0.5 bg-zinc-800 -z-10 -translate-y-1/2"></div>
          {STEPS.map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center gap-2 bg-zinc-950 px-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isCompleted ? 'bg-emerald-500 text-white' : 
                  isActive ? 'bg-violet-600 text-white' : 
                  'bg-zinc-800 text-zinc-500'
                }`}>
                  {isCompleted ? <Check className="h-5 w-5" /> : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  isCompleted || isActive ? 'text-zinc-200' : 'text-zinc-600'
                }`}>{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* Form Container */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 mb-6">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">Firm Identity</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Law Firm Name *</label>
                  <input type="text" placeholder="e.g. Rahman & Associates" 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-violet-500/50 outline-none"
                    value={formData.firmName} onChange={(e) => updateForm('firmName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Registration Number *</label>
                  <input type="text" placeholder="e.g. Reg-2023-1122" 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-violet-500/50 outline-none"
                    value={formData.regNumber} onChange={(e) => updateForm('regNumber', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Registered Address</label>
                <textarea 
                  rows={2} 
                  placeholder="Full office address..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-violet-500/50 outline-none resize-none"
                  value={formData.address} onChange={(e) => updateForm('address', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Firm Description</label>
                <textarea 
                  rows={4} 
                  placeholder="Write a brief overview of your firm's history and mission..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-violet-500/50 outline-none resize-none"
                  value={formData.description} onChange={(e) => updateForm('description', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">Firm Profile</h2>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Firm Logo</label>
                {!formData.logoFile ? (
                  <div 
                    onClick={() => updateForm('logoFile', { name: 'firm-logo.png' })}
                    className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-colors bg-zinc-950"
                  >
                    <Upload className="h-8 w-8 text-zinc-500 mb-3" />
                    <p className="text-sm text-zinc-300 font-medium">Click to upload firm logo</p>
                    <p className="text-xs text-zinc-500 mt-1">JPG or PNG (max 5MB)</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <Check className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-50 truncate">{formData.logoFile.name}</p>
                      <p className="text-xs text-emerald-400">Uploaded successfully</p>
                    </div>
                    <button onClick={() => updateForm('logoFile', null)} className="text-sm text-red-400 hover:text-red-300">Remove</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Website URL</label>
                  <input type="url" placeholder="https://www.example.com" 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-violet-500/50 outline-none"
                    value={formData.website} onChange={(e) => updateForm('website', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Contact Phone</label>
                  <input type="tel" placeholder="+8801..." 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-violet-500/50 outline-none"
                    value={formData.phone} onChange={(e) => updateForm('phone', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Key Practice Areas</label>
                <div className="flex flex-wrap gap-2">
                  {PRACTICE_AREAS.map(area => (
                    <button key={area} onClick={() => toggleArrayItem('practiceAreas', area)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        formData.practiceAreas.includes(area)
                          ? 'bg-violet-600/10 text-violet-400 border-violet-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Team Setup</h2>
              <p className="text-sm text-zinc-400 mb-6">Invite lawyers to join your firm's roster. They will receive an email invitation to create an account.</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Lawyer's email address..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-violet-500/50 outline-none"
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
                <button 
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || isInviting}
                  className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors border border-zinc-700 shrink-0"
                >
                  {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Invite Lawyer
                </button>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden mt-6">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {team.map((member) => (
                      <tr key={member.id} className="hover:bg-zinc-900/30">
                        <td className="px-4 py-3 text-zinc-50 font-medium">
                          <div className="flex items-center gap-2">
                            {member.name}
                            {member.role === 'owner' && <ShieldCheck className="h-4 w-4 text-violet-500" />}
                          </div>
                          {/* Mobile only email display */}
                          <div className="text-zinc-500 font-normal mt-0.5 sm:hidden">{member.email}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">{member.email}</td>
                        <td className="px-4 py-3">
                          {member.role === 'owner' ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                              Owner
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Invited
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {member.role !== 'owner' && (
                            <button onClick={() => removeInvite(member.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-1">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} disabled={isSubmitting}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <button 
            onClick={handleNext}
            disabled={!isStepValid() || isSubmitting}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all
              ${!isStepValid() || isSubmitting
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
              }
            `}
          >
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Creating Firm...</>
            ) : (
              <>{step === 3 ? 'Create Firm' : 'Next Step'}</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
