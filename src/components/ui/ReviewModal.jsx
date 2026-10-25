import React, { useState } from 'react';
import { Star, MessageSquare, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Textarea from './Textarea';
import api, { getErrorMessage } from '../../lib/api';
import { toast } from '../../store/useToastStore';

const RATING_LABELS = {
  1: 'Poor — Unsatisfactory advice',
  2: 'Fair — Met minimal expectations',
  3: 'Good — Helpful consultation',
  4: 'Very Good — Thorough & clear',
  5: 'Excellent — Outstanding legal guidance!',
};

export default function ReviewModal({
  isOpen,
  onClose,
  booking,
  revieweeName,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!booking) return null;

  const targetName =
    revieweeName ||
    booking.lawyer_name ||
    booking.lawyerName ||
    booking.user_name ||
    booking.userName ||
    'your Advocate';

  const currentDisplayRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/reviews', {
        booking_id: booking.id,
        rating: Number(rating),
        comment: comment.trim() || undefined,
      });

      toast('Thank you! Your review has been submitted.', 'success');
      onReviewSubmitted?.(res.data, booking.id);
      onClose?.();
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to submit review');
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !submitting && onClose?.()}
      title="Consultation Review"
      description="Help maintain trust and high legal standards in Bangladesh."
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={submitting || !rating}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold gap-2 shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="h-4 w-4" />
            <span>Submit Review</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-2">
        {/* Header Prompt */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-zinc-100">
            How was your consultation with{' '}
            <span className="text-amber-400">{targetName}</span>?
          </h3>
          <p className="text-xs text-zinc-400">
            Rate your experience with legal clarity, punctuality, and actionable advice.
          </p>
        </div>

        {/* Interactive 5 Gold Stars */}
        <div className="flex flex-col items-center justify-center gap-2.5 py-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((starVal) => {
              const isFilled = starVal <= currentDisplayRating;
              return (
                <button
                  key={starVal}
                  type="button"
                  onMouseEnter={() => setHoverRating(starVal)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => {
                    setRating(starVal);
                    setError(null);
                  }}
                  className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-amber-400/40 cursor-pointer"
                  title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'text-zinc-700 hover:text-zinc-500'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="h-5 flex items-center justify-center">
            <span className="text-xs font-semibold text-amber-300/90 font-mono">
              {RATING_LABELS[currentDisplayRating] || 'Select your rating'}
            </span>
          </div>
        </div>

        {/* Comment Textarea */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Feedback &amp; Comments <span className="text-zinc-600 font-normal lowercase">(optional)</span>
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details of your consultation (e.g. advocate was very clear regarding land registration law, responded to all questions)..."
            rows={4}
            disabled={submitting}
            className="w-full bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-600 border-zinc-800 focus:border-amber-500/50"
          />
          <p className="text-[11px] text-zinc-500">
            Reviews are publicly displayed on the advocate&apos;s directory profile to guide future clients.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
