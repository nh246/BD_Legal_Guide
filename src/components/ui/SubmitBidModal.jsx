import React, { useState } from 'react';
import { Gavel, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Textarea from './Textarea';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

export default function SubmitBidModal({ isOpen, onClose, caseItem, onBidSubmitted }) {
  const [proposedFee, setProposedFee] = useState('');
  const [pitchMessage, setPitchMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setProposedFee('');
    setPitchMessage('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const newErrors = {};

    if (proposedFee !== '' && proposedFee !== null && proposedFee !== undefined) {
      const feeNum = Number(proposedFee);
      if (isNaN(feeNum) || feeNum <= 0) {
        newErrors.proposedFee = 'Proposed fee must be greater than 0 if entered.';
      }
    }

    if (!pitchMessage || pitchMessage.trim().length < 20) {
      newErrors.pitchMessage = `Pitch message must be at least 20 characters (${pitchMessage.trim().length}/20).`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caseItem?.id) return;

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        pitch_message: pitchMessage.trim(),
      };
      if (proposedFee !== '' && proposedFee !== null && proposedFee !== undefined) {
        payload.proposed_fee = Math.round(Number(proposedFee));
      }

      await api.post(`/cases/${caseItem.id}/bid`, payload);

      toast('Bid submitted successfully!', 'success');
      handleClose();
      if (onBidSubmitted) {
        onBidSubmitted(caseItem.id);
      }
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to submit bid'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !caseItem) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Submit Case Bid"
      description={`Submit your proposal and strategy for "${caseItem.title}".`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Case Info Callout */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="font-medium text-zinc-300">Client:</span>
            <span className="font-semibold text-zinc-200">{caseItem.user_name || 'Pro Client'}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span className="font-medium text-zinc-300">Category:</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              {caseItem.category}
            </span>
          </div>
        </div>

        {/* Proposed Fee */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Proposed Fee (৳) <span className="text-zinc-500 font-normal lowercase">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 font-bold text-sm">
              ৳
            </div>
            <input
              id="bid-proposed-fee"
              type="number"
              min="1"
              step="100"
              placeholder="e.g. 5000"
              value={proposedFee}
              onChange={(e) => {
                setProposedFee(e.target.value);
                if (errors.proposedFee) setErrors((prev) => ({ ...prev, proposedFee: null }));
              }}
              className={`w-full pl-8 pr-4 py-2.5 rounded-xl bg-zinc-950 border ${
                errors.proposedFee ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              } text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none transition-colors`}
            />
          </div>
          {errors.proposedFee ? (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.proposedFee}</span>
            </p>
          ) : (
            <p className="text-[11px] text-zinc-400">
              Optional — leave blank to discuss fees with the client after acceptance.
            </p>
          )}
        </div>

        {/* Pitch Message */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Pitch Message <span className="text-red-400">*</span>
            </label>
            <span
              className={`text-[11px] font-mono ${
                pitchMessage.trim().length >= 20 ? 'text-zinc-500' : 'text-amber-400'
              }`}
            >
              {pitchMessage.trim().length}/20 min chars
            </span>
          </div>
          <textarea
            id="bid-pitch-message"
            rows={4}
            placeholder="Explain your experience with this type of case and your proposed strategy..."
            value={pitchMessage}
            onChange={(e) => {
              setPitchMessage(e.target.value);
              if (errors.pitchMessage) setErrors((prev) => ({ ...prev, pitchMessage: null }));
            }}
            className={`w-full px-4 py-3 rounded-xl bg-zinc-950 border ${
              errors.pitchMessage ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
            } text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none transition-colors resize-none`}
            required
          />
          {errors.pitchMessage && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.pitchMessage}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={submitting}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </Button>
          <Button
            id="submit-bid-btn"
            type="submit"
            isLoading={submitting}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 px-5"
          >
            <Gavel className="h-4 w-4" />
            <span>Submit Bid</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
