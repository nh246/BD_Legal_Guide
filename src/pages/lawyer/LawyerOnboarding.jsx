import React, { useState } from 'react';
import { Upload, Check, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

export default function LawyerOnboarding() {
  const [step, setStep] = useState(1);

  // Form State
  const [barId, setBarId] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [bio, setBio] = useState('');
  const [rate, setRate] = useState('');
  const [bkash, setBkash] = useState('');

  const steps = [
    { num: 1, title: 'Verification' },
    { num: 2, title: 'Profile Info' },
    { num: 3, title: 'Payment' }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">Lawyer Onboarding</h1>
          <p className="text-zinc-400">Complete your profile to start accepting clients.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 relative px-4">
          <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-zinc-800 -z-10 -translate-y-1/2"></div>
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-2 bg-zinc-950 px-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= s.num ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={`text-xs font-medium ${step >= s.num ? 'text-zinc-200' : 'text-zinc-600'}`}>{s.title}</span>
            </div>
          ))}
        </div>

        <Card className="p-6 sm:p-8">
          {step === 1 && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <h2 className="text-xl font-semibold text-zinc-50">Identity Verification</h2>
              <p className="text-sm text-zinc-400">Upload your Bangladesh Bar Council ID card. Our team will verify this within 24 hours.</p>
              
              <Input 
                label="Bar Council ID Number" 
                placeholder="e.g. BD-2021-892" 
                value={barId}
                onChange={(e) => setBarId(e.target.value)}
              />

              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-1.5">Upload ID Card Image</label>
                <div className="border-2 border-dashed border-zinc-700 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-zinc-900/50">
                  <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-300 font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-zinc-500">SVG, PNG, JPG or PDF (max. 5MB)</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)} disabled={!barId} className="gap-2">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <h2 className="text-xl font-semibold text-zinc-50">Professional Profile</h2>
              <p className="text-sm text-zinc-400">This information will be visible to clients on your public profile.</p>
              
              <Input 
                label="Specialties (Comma separated)" 
                placeholder="e.g. Family Law, Corporate, Real Estate" 
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
              />

              <Textarea 
                label="Professional Biography" 
                placeholder="Write a brief overview of your experience and practice..." 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[120px]"
              />

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} disabled={!specialties || !bio} className="gap-2">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <h2 className="text-xl font-semibold text-zinc-50">Payment Information</h2>
              <p className="text-sm text-zinc-400">Set your consultation fee and how you want to receive payments.</p>
              
              <Input 
                label="Hourly Consultation Rate (BDT)" 
                type="number"
                placeholder="e.g. 2000" 
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />

              <Input 
                label="bKash / Nagad Number (For payouts)" 
                placeholder="e.g. 01700000000" 
                value={bkash}
                onChange={(e) => setBkash(e.target.value)}
              />

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => alert('Submit Onboarding')} disabled={!rate || !bkash} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                  <Check className="h-4 w-4" /> Complete Onboarding
                </Button>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
