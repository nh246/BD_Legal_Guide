import React from 'react';
import Modal from './Modal';
import { Zap, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

export default function ProPaywallModal({ isOpen, onClose }) {
  const features = [
    "Verified citations from BD Penal Code & Acts",
    "Analyze uploaded legal documents (PDF/Docx)",
    "Priority matching with Gold-Verified Lawyers",
    "Unlimited AI chat queries"
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center pb-2">
        <div className="h-16 w-16 bg-violet-500/10 rounded-full flex items-center justify-center mb-4 border border-violet-500/20">
          <Zap className="h-8 w-8 text-violet-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-zinc-50 mb-2">Upgrade to Pro</h2>
        <p className="text-zinc-400 text-sm mb-6">
          This feature requires a Pro subscription. Upgrade now to unlock the full power of BD Legal Guide AI.
        </p>

        <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="text-left space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link to="/pricing" className="w-full">
            <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white">
              Upgrade for Tk. 299/mo
            </Button>
          </Link>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  );
}
