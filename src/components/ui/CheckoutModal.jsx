import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  ExternalLink,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

export default function CheckoutModal({
  isOpen,
  onClose,
  payment_id,
  amount = 0,
  product_name = 'Pro Subscription',
  onSuccess,
}) {
  const [step, setStep] = useState('select_provider'); // 'select_provider' | 'simulated_card'
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  const [cardForm, setCardForm] = useState({
    card_number: '4242 4242 4242 4242',
    expiry: '12/28',
    cvc: '123',
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select_provider');
      setLoading(false);
      setSessionToken(null);
      setCardForm({
        card_number: '4242 4242 4242 4242',
        expiry: '12/28',
        cvc: '123',
      });
    }
  }, [isOpen]);

  // Handler for SSLCommerz payment
  const handlePaySSLCommerz = async () => {
    if (!payment_id) {
      toast.error('Missing payment reference. Please try again.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/payments/checkout', {
        payment_id,
        provider: 'sslcommerz',
      });
      const redirectUrl = res.data?.redirect_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.error('Gateway did not return a valid redirect URL.');
        setLoading(false);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to initialize SSLCommerz gateway session.'));
      setLoading(false);
    }
  };

  // Handler for Simulated Test Card session
  const handleSelectSimulated = async () => {
    if (!payment_id) {
      toast.error('Missing payment reference. Please try again.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/payments/checkout', {
        payment_id,
        provider: 'simulated',
      });
      const token = res.data?.session_token;
      if (token) {
        setSessionToken(token);
        setStep('simulated_card');
      } else {
        toast.error('Failed to obtain simulated checkout session.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to start simulated card checkout.'));
    } finally {
      setLoading(false);
    }
  };

  // Handler for confirming test card payment
  const handleConfirmSimulated = async (e) => {
    if (e) e.preventDefault();
    if (!sessionToken) {
      toast.error('Invalid checkout session token. Please re-select payment method.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/payments/simulated/confirm', {
        session_token: sessionToken,
        card_number: cardForm.card_number,
        expiry: cardForm.expiry,
        cvc: cardForm.cvc,
      });

      toast.success('Payment successful!');
      try {
        await useAuthStore.getState().fetchMe();
      } catch {
        // ignore
      }

      if (onSuccess) {
        await onSuccess();
      }
      onClose();

      // Refresh to update active badges & entitlements
      window.location.reload();
    } catch (err) {
      const status = err.response?.status;
      if (status === 402) {
        toast.error('Card declined');
      } else if (status === 400) {
        toast.error('Invalid card format');
      } else {
        toast.error(getErrorMessage(err, 'Payment processing failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Your Order"
      description={`Checkout for ${product_name}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Order Summary Strip */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-zinc-400">Total Due</div>
            <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1 mt-0.5">
              <span className="text-base text-zinc-400 font-normal">Tk.</span>
              <span>{amount}</span>
              <span className="text-xs text-zinc-500 font-mono">BDT</span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              {product_name}
            </span>
          </div>
        </div>

        {step === 'select_provider' ? (
          /* STEP 1: Provider Selection */
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Select Payment Method
            </div>

            {/* SSLCommerz Button */}
            <button
              id="checkout-provider-sslcommerz-btn"
              type="button"
              disabled={loading}
              onClick={handlePaySSLCommerz}
              className="w-full group p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30 hover:border-emerald-500/60 transition-all text-left flex items-center justify-between cursor-pointer shadow-lg shadow-emerald-950/20"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-emerald-300 flex items-center gap-2">
                    Pay with SSLCommerz
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Sandbox / Live
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Cards, bKash, Nagad, Rocket & Bangladesh Online Banking
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400/70 group-hover:text-emerald-300 shrink-0 ml-2" />
            </button>

            {/* Simulated Test Card Button */}
            <button
              id="checkout-provider-simulated-btn"
              type="button"
              disabled={loading}
              onClick={handleSelectSimulated}
              className="w-full group p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-zinc-200 flex items-center gap-2">
                    Use Test Card
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Dev / Viva Demo
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Simulate card approval (4242...) or decline (4000...) offline
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-zinc-500 group-hover:text-zinc-300">
                Continue →
              </span>
            </button>

            <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-zinc-500">
              <Lock className="w-3.5 h-3.5" />
              <span>256-bit encrypted secure platform checkout</span>
            </div>
          </div>
        ) : (
          /* STEP 2: Simulated Card Form */
          <form onSubmit={handleConfirmSimulated} className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                id="simulated-back-btn"
                type="button"
                onClick={() => setStep('select_provider')}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Methods
              </button>
              <span className="text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Test Mode Simulation
              </span>
            </div>

            {/* Test Card Quick Note */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <div className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Demo Credentials:
              </div>
              <div className="font-mono text-[11px] text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                <span>Pass: <strong className="text-emerald-400">4242 4242 4242 4242</strong></span>
                <span>Decline: <strong className="text-red-400">4000 0000 0000 0000</strong></span>
              </div>
            </div>

            {/* Card Inputs */}
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="simulated-card-number-input"
                  className="block text-xs font-medium text-zinc-300 mb-1"
                >
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="simulated-card-number-input"
                    type="text"
                    value={cardForm.card_number}
                    onChange={(e) => setCardForm((prev) => ({ ...prev, card_number: e.target.value }))}
                    placeholder="4242 4242 4242 4242"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="simulated-card-expiry-input"
                    className="block text-xs font-medium text-zinc-300 mb-1"
                  >
                    Expiry (MM/YY)
                  </label>
                  <input
                    id="simulated-card-expiry-input"
                    type="text"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm((prev) => ({ ...prev, expiry: e.target.value }))}
                    placeholder="12/28"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="simulated-card-cvc-input"
                    className="block text-xs font-medium text-zinc-300 mb-1"
                  >
                    CVC
                  </label>
                  <input
                    id="simulated-card-cvc-input"
                    type="text"
                    value={cardForm.cvc}
                    onChange={(e) => setCardForm((prev) => ({ ...prev, cvc: e.target.value }))}
                    placeholder="123"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              id="simulated-confirm-btn"
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-2.5 text-sm font-semibold mt-2 shadow-lg shadow-amber-500/10"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  Processing Payment...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  Pay Tk. {amount} Now
                </span>
              )}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
