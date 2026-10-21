import React, { useState } from 'react';
import Modal from './Modal';
import { Zap, Check } from 'lucide-react';
import Button from './Button';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

export default function ProPaywallModal({ isOpen, onClose, message, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const features = [
    "Unlimited AI chat queries and saved sessions",
    "Extended AI memory (20-turn context vs 5)",
    "Legal document and image upload with AI analysis (PDF/TXT/PNG/JPG)",
    "AI confidence score on every answer",
    "Direct messaging with verified lawyers",
    "Priority handling of consultation requests"
  ];

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await api.post('/subscriptions', { plan_code: 'user_pro', provider: 'demo' });
      try {
        await useAuthStore.getState().fetchMe();
      } catch {
        // ignore
      }
      if (onSuccess) {
        await onSuccess();
      }
      onClose();
      toast('Welcome to Pro', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to upgrade to Pro'), 'error');
    } finally {
      setLoading(false);
    }
  };

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
        <p className="text-zinc-400 text-sm mb-4">
          Unlock the Advanced Features of BD Legal Guide AI.
        </p>

        {message && (
          <div className="w-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs px-3 py-2 rounded-lg mb-4 text-center">
            {message}
          </div>
        )}

        <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="text-left space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button 
            onClick={handleUpgrade}
            isLoading={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white"
          >
            Upgrade for Tk. 299/mo
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose} disabled={loading}>
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  );
}

