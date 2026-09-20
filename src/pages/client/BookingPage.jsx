import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, Loader2, Calendar, FileText, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import useBookingStore from '../../store/useBookingStore';
import { mockLawyers } from '../../data/mockLawyers';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const STEPS = [
  { num: 1, title: 'Time Slot' },
  { num: 2, title: 'Case Details' },
  { num: 3, title: 'Confirm' }
];

export default function BookingPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addBooking = useBookingStore(state => state.addBooking);
  
  const lawyer = mockLawyers.find(l => l.id === id);
  const urlSlot = searchParams.get('slot');

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [caseBrief, setCaseBrief] = useState("My landlord is trying to evict me without a court order.");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (urlSlot) {
      const [day, time] = urlSlot.split('-');
      if (day && time) {
        setSelectedSlot({ day, time });
      }
    }
  }, [urlSlot]);

  if (!lawyer) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-zinc-50 mb-4">Lawyer not found</h2>
        <Link to="/lawyers" className="text-blue-500 hover:underline">Return to directory</Link>
      </div>
    );
  }

  const getSlotStatus = (day, time) => {
    const slot = lawyer.availability.find(a => a.day === day && a.time === time);
    return slot ? slot.status : 'unavailable';
  };

  const isStepValid = () => {
    if (step === 1) return selectedSlot !== null;
    if (step === 2) return caseBrief.trim() !== '' && consent;
    return true;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        addBooking({
          lawyerName: lawyer.name,
          start: `2023-11-15T${selectedSlot.time}:00`, // Mock date format
          status: 'pending',
          caseBrief: caseBrief
        });
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 1500);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-zinc-50 mb-2">Booking Requested!</h1>
        <p className="text-zinc-400 mb-8">Your request has been sent to {lawyer.name}.</p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full mb-8 text-left">
          <div className="flex items-center gap-3 text-sm text-zinc-300 mb-3">
            <Calendar className="h-5 w-5 text-blue-500" /> 
            {selectedSlot.day}, {selectedSlot.time} (30 mins)
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <ShieldCheck className="h-5 w-5 text-blue-500" /> 
            Your lawyer will confirm and add a Google Meet link shortly.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button 
            onClick={() => navigate('/chat')}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 border border-zinc-800 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Chat
          </button>
          <button 
            onClick={() => navigate('/bookings')}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            Go to My Bookings <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Book Consultation</h1>
          <p className="text-zinc-400">with {lawyer.name}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-4 sm:px-16">
          <div className="absolute left-10 right-10 sm:left-24 sm:right-24 top-1/2 h-0.5 bg-zinc-800 -z-10 -translate-y-1/2"></div>
          {STEPS.map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center gap-2 bg-zinc-950 px-4">
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
            <div className="space-y-4 animate-in fade-in duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Select a Time Slot</h2>
              <p className="text-sm text-zinc-400 mb-6">All slots are 30 minutes in duration and conducted via secure video call.</p>
              
              <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                <table className="w-full text-sm text-center min-w-[500px]">
                  <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3 w-16 border-r border-zinc-800">Time</th>
                      {DAYS.map(day => (
                        <th key={day} className="p-3 font-medium">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {TIMES.map(time => (
                      <tr key={time}>
                        <td className="p-3 text-zinc-500 text-xs border-r border-zinc-800 bg-zinc-900 font-medium">
                          {time}
                        </td>
                        {DAYS.map(day => {
                          const status = getSlotStatus(day, time);
                          const isSelected = selectedSlot?.day === day && selectedSlot?.time === time;
                          
                          return (
                            <td key={`${day}-${time}`} className="p-1">
                              <button
                                disabled={status !== 'available'}
                                onClick={() => setSelectedSlot({ day, time })}
                                className={`w-full py-2.5 rounded transition-colors border text-xs font-medium ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                                    : status === 'available'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                                      : 'bg-zinc-900 text-zinc-700 border-transparent cursor-not-allowed'
                                }`}
                              >
                                {status === 'available' ? (isSelected ? 'Selected' : 'Open') : '—'}
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

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Case Details</h2>
              <p className="text-sm text-zinc-400 mb-6">Briefly explain your situation so {lawyer.name} can prepare for the consultation.</p>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-500" /> Briefly describe your issue
                </label>
                <textarea 
                  rows={4} 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                  value={caseBrief} 
                  onChange={(e) => setCaseBrief(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                  <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                    <input type="checkbox" className="peer sr-only" 
                      checked={consent} onChange={(e) => setConsent(e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-zinc-600 rounded bg-zinc-900 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                    <Check className="absolute text-white w-3 h-3 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-zinc-300 group-hover:text-zinc-200 transition-colors leading-relaxed">
                    I understand AI summaries assist but do not replace my lawyer's judgment. I consent to sharing this brief securely with the lawyer.
                  </span>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Review & Confirm</h2>
              <p className="text-sm text-zinc-400 mb-6">Please review your booking details before confirming.</p>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-4">
                  <span className="text-zinc-400">Lawyer</span>
                  <span className="text-zinc-50 font-medium">{lawyer.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-4">
                  <span className="text-zinc-400">Date & Time</span>
                  <span className="text-zinc-50 font-medium">{selectedSlot?.day}, {selectedSlot?.time}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-4">
                  <span className="text-zinc-400">Duration</span>
                  <span className="text-zinc-50 font-medium">30 mins</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-zinc-50">Total Fee</span>
                  <span className="text-xl font-bold text-blue-400">৳{(lawyer.rateBdt / 2).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-400/90 leading-relaxed">
                  Payment handled directly with lawyer (bKash/Nagad) — platform payment coming soon.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} disabled={isSubmitting}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <button 
            onClick={handleNext}
            disabled={!isStepValid() || isSubmitting}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all
              ${!isStepValid() || isSubmitting
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              }
            `}
          >
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
            ) : (
              <>{step === 3 ? 'Confirm Booking' : 'Next Step'}</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
