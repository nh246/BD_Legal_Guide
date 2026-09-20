import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Textarea from '../../components/ui/Textarea';

export default function BookingPage() {
  const { id } = useParams();
  const [step, setStep] = useState(1);
  
  // Form State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [caseBrief, setCaseBrief] = useState('');

  // Mock data
  const lawyerName = "Adv. Sarah Rahman";
  const mockSlots = [
    { id: 's1', date: 'Oct 15, 2026', time: '10:00 AM' },
    { id: 's2', date: 'Oct 15, 2026', time: '02:00 PM' },
    { id: 's3', date: 'Oct 16, 2026', time: '11:00 AM' },
    { id: 's4', date: 'Oct 17, 2026', time: '04:00 PM' }
  ];

  const steps = [
    { num: 1, title: 'Select Time' },
    { num: 2, title: 'Case Brief' },
    { num: 3, title: 'Confirm' }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link to={`/lawyers/${id}`} className="inline-flex items-center text-sm text-zinc-400 hover:text-zinc-50 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-zinc-50">Book Consultation</h1>
          <p className="text-zinc-400 mt-1">with {lawyerName}</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-zinc-800 -z-10 -translate-y-1/2"></div>
          {steps.map((s, idx) => (
            <div key={s.num} className="flex flex-col items-center gap-2 bg-zinc-950 px-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s.num ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={`text-xs font-medium ${step >= s.num ? 'text-zinc-200' : 'text-zinc-600'}`}>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Form Container */}
        <Card className="p-6 md:p-8">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-6">Select a Time Slot</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {mockSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedSlot?.id === slot.id 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="font-medium text-zinc-50 mb-1">{slot.date}</div>
                    <div className="text-sm text-zinc-400">{slot.time}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!selectedSlot} className="gap-2">
                  Next Step <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-2">Provide a Case Brief</h2>
              <p className="text-sm text-zinc-400 mb-6">Briefly describe your legal issue so the lawyer can prepare for the consultation.</p>
              
              <Textarea 
                placeholder="E.g., I have a dispute with my landlord regarding the return of my security deposit..."
                value={caseBrief}
                onChange={(e) => setCaseBrief(e.target.value)}
                className="mb-8 min-h-[150px]"
              />
              
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} disabled={caseBrief.length < 10} className="gap-2">
                  Review <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-zinc-50 mb-6">Confirm Booking</h2>
              
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4 mb-8">
                <div className="flex justify-between border-b border-zinc-800/50 pb-4">
                  <span className="text-zinc-400">Lawyer</span>
                  <span className="font-medium text-zinc-50">{lawyerName}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/50 pb-4">
                  <span className="text-zinc-400">Time</span>
                  <span className="font-medium text-zinc-50">{selectedSlot?.date} at {selectedSlot?.time}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/50 pb-4">
                  <span className="text-zinc-400">Consultation Fee</span>
                  <span className="font-medium text-zinc-50">Tk. 2000</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-2">Case Brief</span>
                  <p className="text-sm text-zinc-300 bg-zinc-900 p-3 rounded-lg">{caseBrief}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Link to="/bookings">
                  <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                    <Check className="h-4 w-4" /> Confirm & Request Booking
                  </Button>
                </Link>
              </div>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
}
