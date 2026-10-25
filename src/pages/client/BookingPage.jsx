import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, Calendar, FileText, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { LoadingState, ErrorState } from '../../components/ui/PageStates';
import EmptyState from '../../components/ui/EmptyState';
import useApi from '../../lib/useApi';
import api, { getErrorMessage } from '../../lib/api';
import CompletePaymentModal from '../../components/ui/CompletePaymentModal';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const STEPS = [
  { num: 1, title: 'Time Slot' },
  { num: 2, title: 'Case Details' },
  { num: 3, title: 'Confirm' },
];

export default function BookingPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: lawyer, loading, error, reload } = useApi(id ? `/lawyers/${id}` : null);

  const urlSlot = searchParams.get('slot');

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [caseBrief, setCaseBrief] = useState('');
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (urlSlot) {
      const [day, time] = urlSlot.split('-');
      if (day && time) {
        setSelectedSlot({ day, time });
      }
    }
  }, [urlSlot]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-8">
        <LoadingState label="Loading booking details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-8">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <EmptyState
          icon={FileText}
          title="Lawyer not found"
          description="The lawyer you are trying to book is not available."
          action={
            <Link to="/client/lawyers" className="text-blue-500 hover:underline text-sm font-medium">
              Return to directory
            </Link>
          }
        />
      </div>
    );
  }

  const rateBdt = lawyer.rateBdt || lawyer.rate || 2000;

  const isStepValid = () => {
    if (step === 1) return selectedSlot !== null;
    if (step === 2) return caseBrief.trim() !== '' && consent;
    return true;
  };

  const [createdBooking, setCreatedBooking] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const res = await api.post('/bookings', {
          lawyer_id: id,
          schedule_id: selectedSlot?.schedule_id || selectedSlot?.id || undefined,
          slot: selectedSlot,
          date: selectedSlot?.date || selectedSlot?.day,
          start_time: selectedSlot?.start_time || selectedSlot?.time,
          case_brief: caseBrief,
        });
        const bookingData = res.data;
        setCreatedBooking(bookingData);
        setIsSuccess(true);
        if (bookingData.status === 'awaiting_payment') {
          setIsPaymentModalOpen(true);
        }
      } catch (err) {
        setSubmitError(getErrorMessage(err, 'Could not complete booking'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSuccess) {
    const isAwaitingPay = createdBooking?.status === 'awaiting_payment';
    const isPaySubmitted = createdBooking?.status === 'payment_submitted';

    return (
      <div className="min-h-[calc(100vh-64px)] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>

        <h1 className="text-3xl font-bold text-zinc-50 mb-2">
          {isPaySubmitted ? 'Payment Proof Submitted!' : isAwaitingPay ? 'Booking Reserved — Payment Required' : 'Booking Confirmed!'}
        </h1>
        <p className="text-zinc-400 mb-8">
          {isPaySubmitted
            ? `Your payment is under review. ${lawyer.name} will confirm shortly.`
            : isAwaitingPay
            ? `Please submit your consultation fee to complete your booking with ${lawyer.name}.`
            : `Your consultation request has been confirmed with ${lawyer.name}.`}
        </p>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full mb-8 text-left space-y-3">
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <Calendar className="h-5 w-5 text-blue-500 shrink-0" />
            <span>{selectedSlot?.day || selectedSlot?.date}, {selectedSlot?.time || selectedSlot?.start_time} (30 mins)</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
            <span>
              {isPaySubmitted
                ? 'Payment proof submitted. Meeting link will be ready once confirmed.'
                : isAwaitingPay
                ? 'Slot reserved. Pay via bKash/Nagad and submit your TrxID.'
                : 'Your lawyer will confirm and provide meeting details shortly.'}
            </span>
          </div>

          {isAwaitingPay && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                Complete Payment Now
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button
            onClick={() => navigate('/client/chat')}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 border border-zinc-800 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Chat
          </button>
          <button
            onClick={() => navigate('/client/bookings')}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            Go to My Bookings <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <CompletePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          booking={createdBooking}
          onPaymentSubmitted={(updated) => setCreatedBooking(updated)}
        />
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
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isCompleted || isActive ? 'text-zinc-200' : 'text-zinc-600'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

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
                      {DAYS.map((day) => (
                        <th key={day} className="p-3 font-medium">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {TIMES.map((time) => (
                      <tr key={time}>
                        <td className="p-3 text-zinc-500 text-xs border-r border-zinc-800 bg-zinc-900 font-medium">{time}</td>
                        {DAYS.map((day) => {
                          const isSelected = selectedSlot?.day === day && selectedSlot?.time === time;
                          return (
                            <td key={`${day}-${time}`} className="p-1">
                              <button
                                onClick={() => setSelectedSlot({ day, time })}
                                className={`w-full py-2.5 rounded transition-colors border text-xs font-medium ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                                }`}
                              >
                                {isSelected ? 'Selected' : 'Open'}
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
                  placeholder="Explain the background of your legal inquiry..."
                  value={caseBrief}
                  onChange={(e) => setCaseBrief(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                  <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
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
                  <span className="text-zinc-50 font-medium">
                    {selectedSlot?.day}, {selectedSlot?.time}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-4">
                  <span className="text-zinc-400">Duration</span>
                  <span className="text-zinc-50 font-medium">30 mins</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-zinc-50">Total Fee</span>
                  <span className="text-xl font-bold text-blue-400">৳{(rateBdt / 2).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <Button
            onClick={handleNext}
            disabled={!isStepValid()}
            isLoading={isSubmitting}
            className="px-8 py-3"
          >
            {step === 3 ? 'Confirm Booking' : 'Next Step'}
          </Button>
        </div>
      </div>
    </div>
  );
}
