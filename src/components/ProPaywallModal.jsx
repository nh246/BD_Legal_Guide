import React, { useState } from 'react';
import { Crown, CheckCircle2 } from 'lucide-react';

export default function ProPaywallModal({ isOpen, onClose }) {
  const [toastMsg, setToastMsg] = useState(null);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setToastMsg("Payment coming soon");
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Decorative Top Gradient */}
        <div className="h-32 bg-gradient-to-br from-violet-600/20 to-blue-600/20 w-full relative">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-3xl" />
          <div className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 h-16 w-16 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center shadow-xl">
            <Crown className="h-8 w-8 text-violet-500" />
          </div>
        </div>

        <div className="pt-12 p-6 text-center">
          <h2 className="text-2xl font-bold text-zinc-50 mb-2">Verified RAG is a Pro feature</h2>
          <p className="text-sm text-zinc-400 mb-6">Upgrade to access Bangladesh's most powerful AI legal research tool.</p>

          <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 text-left mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-300">Exact Act + Section citations linked to official gazettes</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-300">Unlimited RAG queries per month</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-300">AI-powered lawyer matching & priority booking</span>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-3xl font-bold text-zinc-50">৳299</span>
            <span className="text-zinc-500">/mo</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
            >
              Maybe later
            </button>
            <button 
              onClick={handleUpgrade}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-50 px-4 py-2 rounded-full text-sm shadow-lg border border-zinc-700 whitespace-nowrap animate-in slide-in-from-top-2">
            {toastMsg}
          </div>
        )}
      </div>
    </div>
  );
}
