import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Upload, Loader2, FileText, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const COURTS = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna'];
const PRACTICE_AREAS = ['Property', 'Family', 'Criminal', 'Labour', 'Corporate', 'Consumer'];
const LANGUAGES = ['Bangla', 'English'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const STEPS = [
  { num: 1, title: 'Professional' },
  { num: 2, title: 'Profile' },
  { num: 3, title: 'Verification' },
  { num: 4, title: 'Availability' }
];

export default function LawyerOnboarding() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    barId: '',
    enrollmentYear: '',
    primaryCourt: '',
    practiceAreas: [],
    languages: [],
    bio: '',
    hourlyRate: '',
    photoFile: null,
    idFile: null,
    consent: false,
    availability: {} // key format: "Mon-09:00" -> boolean
  });

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

  const toggleAvailability = (day, time) => {
    const key = `${day}-${time}`;
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [key]: !prev.availability[key]
      }
    }));
  };

  const isStepValid = () => {
    if (step === 1) return formData.fullName.trim() !== '' && formData.barId.trim() !== '';
    if (step === 2) return true; // Optional fields for now
    if (step === 3) return formData.idFile !== null && formData.consent;
    if (step === 4) return true;
    return false;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        completeOnboarding();
        navigate('/lawyer/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Lawyer Onboarding</h1>
          <p className="text-zinc-400">Complete your profile to join the marketplace.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-2 sm:px-6">
          <div className="absolute left-6 right-6 sm:left-10 sm:right-10 top-1/2 h-0.5 bg-zinc-800 -z-10 -translate-y-1/2"></div>
          {STEPS.map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center gap-2 bg-zinc-950 px-2 sm:px-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isCompleted ? 'bg-emerald-500 text-white' : 
                  isActive ? 'bg-blue-600 text-white' : 
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
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">Professional Details</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name *</label>
                  <input type="text" placeholder="e.g. Adv. Sarah Rahman" 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    value={formData.fullName} onChange={(e) => updateForm('fullName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Bar Council ID *</label>
                  <input type="text" placeholder="e.g. BD-2021-892" 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    value={formData.barId} onChange={(e) => updateForm('barId', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Enrollment Year</label>
                  <input type="number" placeholder="YYYY" 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    value={formData.enrollmentYear} onChange={(e) => updateForm('enrollmentYear', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Primary Court</label>
                  <select 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none"
                    value={formData.primaryCourt} onChange={(e) => updateForm('primaryCourt', e.target.value)}
                  >
                    <option value="">Select a court...</option>
                    {COURTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Practice Areas</label>
                <div className="flex flex-wrap gap-2">
                  {PRACTICE_AREAS.map(area => (
                    <button key={area} onClick={() => toggleArrayItem('practiceAreas', area)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        formData.practiceAreas.includes(area)
                          ? 'bg-blue-600/10 text-blue-400 border-blue-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button key={lang} onClick={() => toggleArrayItem('languages', lang)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        formData.languages.includes(lang)
                          ? 'bg-blue-600/10 text-blue-400 border-blue-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">Public Profile</h2>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Profile Photo</label>
                {!formData.photoFile ? (
                  <div 
                    onClick={() => updateForm('photoFile', { name: 'profile-photo.jpg' })}
                    className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors bg-zinc-950"
                  >
                    <Upload className="h-8 w-8 text-zinc-500 mb-3" />
                    <p className="text-sm text-zinc-300 font-medium">Click to upload photo</p>
                    <p className="text-xs text-zinc-500 mt-1">JPG or PNG (max 5MB)</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <Check className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-50 truncate">{formData.photoFile.name}</p>
                      <p className="text-xs text-emerald-400">Uploaded successfully</p>
                    </div>
                    <button onClick={() => updateForm('photoFile', null)} className="text-sm text-red-400 hover:text-red-300">Remove</button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Professional Bio</label>
                <textarea 
                  rows={4} 
                  placeholder="Describe your legal experience and approach..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                  value={formData.bio} onChange={(e) => updateForm('bio', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Hourly Consultation Rate</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">৳</span>
                  <input type="number" placeholder="2000" 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-4 py-2 text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    value={formData.hourlyRate} onChange={(e) => updateForm('hourlyRate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">Identity Verification</h2>
              <p className="text-sm text-zinc-400 mb-6">Upload a clear photo or scan of your Bangladesh Bar Council ID or Enrollment Certificate.</p>

              {!formData.idFile ? (
                <div 
                  onClick={() => updateForm('idFile', { name: 'bar-council-id.pdf' })}
                  className="border-2 border-dashed border-zinc-700 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors bg-zinc-950"
                >
                  <Upload className="h-10 w-10 text-zinc-500 mb-4" />
                  <p className="text-base text-zinc-200 font-medium mb-1">Upload Bar Council ID or Enrollment Certificate</p>
                  <p className="text-sm text-zinc-500">Image or PDF format accepted</p>
                </div>
              ) : (
                <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl flex items-start gap-4">
                  <div className="shrink-0 p-3 bg-blue-600/10 rounded-lg text-blue-500">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-50 truncate">{formData.idFile.name}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                      <AlertCircle className="h-3 w-3" />
                      Pending AI + admin review
                    </div>
                  </div>
                  <button onClick={() => updateForm('idFile', null)} className="text-sm text-zinc-500 hover:text-red-400">Remove</button>
                </div>
              )}

              <div className="pt-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                    <input type="checkbox" className="peer sr-only" 
                      checked={formData.consent} onChange={(e) => updateForm('consent', e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-zinc-600 rounded bg-zinc-900 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                    <Check className="absolute text-white w-3 h-3 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-zinc-300 group-hover:text-zinc-200 transition-colors">
                    I confirm this document is authentic and I am currently licensed to practice law in Bangladesh.
                  </span>
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Availability Schedule</h2>
              <p className="text-sm text-zinc-400 mb-6">Select the hours you are typically available for video consultations.</p>
              
              <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                <table className="w-full text-sm text-center min-w-[600px]">
                  <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3 w-20 border-r border-zinc-800">Time</th>
                      {DAYS.map(day => (
                        <th key={day} className="p-3 font-medium">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {TIMES.map(time => (
                      <tr key={time}>
                        <td className="p-3 text-zinc-500 text-xs border-r border-zinc-800 bg-zinc-900/30 font-medium">
                          {time}
                        </td>
                        {DAYS.map(day => {
                          const isAvailable = formData.availability[`${day}-${time}`];
                          return (
                            <td key={`${day}-${time}`} className="p-1">
                              <button
                                onClick={() => toggleAvailability(day, time)}
                                className={`w-full py-2 rounded transition-colors border text-xs font-medium ${
                                  isAvailable 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-zinc-800 text-zinc-500 border-transparent hover:bg-zinc-700'
                                }`}
                              >
                                {isAvailable ? 'Open' : '—'}
                              </button>
                            </td>
                          );
                        })}
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
                : 'bg-blue-600 hover:bg-blue-500 text-white'
              }
            `}
          >
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</>
            ) : (
              <>{step === 4 ? 'Submit Application' : 'Next Step'}</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
